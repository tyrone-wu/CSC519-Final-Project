const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const execSync = require('child_process').execSync;

const job = require('../lib/job');
const builder = require('../lib/builder');
const VBox = require('../lib/VBoxManage');

exports.command = 'monitor-deploy <inventory> <job_name> <build_yml>';
exports.desc = 'Deploy job & Monitor';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { inventory, job_name, build_yml, processor } = argv;

    // Check if the blue and green servers are up
    console.log(chalk.green("Checking if servers are up..."));
    let exitFlag = false;
    let servers = ["blue", "green"];
    for (let i = 0; i < servers.length; i++) {
        try {
            let output = execSync(`vboxmanage showvminfo "${servers[i]}" | grep -c "running (since"`).toString();
            if (output != 1) {
                console.log(chalk.red(`Error - ${servers[i]} is not running.`));
                exitFlag = true;
            }
        } catch (e) {
            console.log(chalk.red(`Error - ${servers[i]} could not be found.`));
            exitFlag = true;
        }
    }
    // Exit if error is encountered
    if (exitFlag) {
        console.log(chalk.red("\nExiting Deployment - Please run 'pipeline prod up' to provision the blue-green instances first."));
        return;
    }

    // Check if the inventory file exists
    if (!fs.existsSync(inventory)) {
        console.log(chalk.red("Error - inventory file could not be found.\nPlease check that the inventory file path is correct."));
        return;
    }

    // Obtain the port that the application is running on
    let port = JSON.parse(
        fs.readFileSync("./deployment/vars/webapp-port.json")
    );

    // Obtain the endpoint for monitoring health
    let endpoint = JSON.parse(
        fs.readFileSync("./deployment/vars/webapp-endpoint.json")
    );

    // Add port forwarding to port 3000 for redis
    console.log(chalk.green("\nPort forwarding to 3000 for redis..."));
    VBox.execute('controlvm', 'web-srv natpf1 "service,tcp,,3090,,3000"').catch( e => e );
    VBox.execute('controlvm', `blue natpf1 "service,tcp,,${port},,3000"`).catch( e => e );
    VBox.execute('controlvm', `green natpf1 "service,tcp,,${port},,3000"`).catch( e => e );

    // Execute deployment job
    console.log(chalk.green(`Deploying Job: ${job_name} from ${build_yml} with ${inventory}`));
    await job.buildJob(job_name, build_yml, inventory, "deploy");

    // Obtain the IP that the instances are running on
    let blue = null;
    let green = null;
    let vmInfo = yaml.load(fs.readFileSync("./deployment/bakerx.yml", { encoding: 'utf-8' }));
    for (let i = 0; i < vmInfo.servers.length; i++) {
        if (vmInfo.servers[i].name === "blue") {
            blue = vmInfo.servers[i].ip;
        } else if (vmInfo.servers[i].name === "green") {
            green = vmInfo.servers[i].ip;
        }
    }

    // Obtains IP of web-srv instance
    let webIP = null;
    let webInfo = yaml.load(fs.readFileSync("./bakerx.yml", { encoding: 'utf-8' }));
    for (let i = 0; i < webInfo.servers.length; i++) {
        if (webInfo.servers[i].name === "web-srv") {
            webIP = webInfo.servers[i].ip;
        }
    }
    fs.writeFileSync("./deployment/vars/proxy-ip.txt", webIP);

    // Obtain VM info of web-srv
    let webSsh = sshCmd("web-srv");

    // Running serve script in the web-srv
    await builder.execute(`${webSsh} "cd /bakerx/deployment/ && sudo npm install forever -g"`, "./");
    await builder.execute(`${webSsh} "cd /bakerx/deployment/ && npm install"`, "./");

    let serveCmd = `forever stopall && forever start index.js serve ${blue} ${green} ${port} ${endpoint} ${webIP}`;
    await builder.execute(`${webSsh} "cd /bakerx/deployment/ && ${serveCmd}"`, "./");

    // console.log(chalk.keyword('pink') (`Starting proxy on http://${webIP}:3090`));

    // Start monitor dashboard
    console.log(chalk.green("\nMonitoring deployment..."));
    let monitorCmd = `cd /bakerx && forever start ./monitor/bin/www`;
    await builder.execute(`${webSsh} "${monitorCmd}"`, "./");

    // console.log(chalk.keyword('pink') (`Starting dashboard monitor on http://${webIP}:8080`));

    // Push agent on web-srv proxy
    await builder.execute(`${webSsh} "cd /bakerx/deployment/agent/ && forever start index.js web-srv ${webIP}"`, "./");
    // Push agent on blue and green servers
    for (let i = 0; i < servers.length; i++) {
        let serverSsh = sshCmd(servers[i]);
        await builder.execute(`${serverSsh} "cd /bakerx/agent/ && sudo npm install forever -g"`, "./");
        await builder.execute(`${serverSsh} "cd /bakerx/ && forever stopall && forever start ./agent/index.js ${servers[i]} ${webIP}"`, "./");
    }

    console.log(chalk.green("\nDeployment monitor dashboard finished"));
    console.log(chalk.keyword('pink') (`Starting proxy on http://${webIP}:3090`));
    console.log(chalk.keyword('pink') (`Starting dashboard monitor on http://${webIP}:8080`));
};


function sshCmd(vmName) {
    // Get network information so port can be extracted
    let nicCmd = `vboxmanage showvminfo ${vmName} | grep 'NIC 1 Rule(0):'`;
    // Get ssh command information
    let keyDir = "~/.bakerx/insecure_private_key";
    let configPort = execSync(nicCmd).toString().match(/[0-9]{4}/g);
    let options = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null";
    let user = "vagrant";
    let ip = "127.0.0.1";

    return `ssh -i ${keyDir} -p ${configPort} ${options} ${user}@${ip}`;
}
