const chalk = require('chalk');
const path = require('path');
const execSync = require('child_process').execSync;

const builder = require('../lib/builder');

exports.command = 'prod up';
exports.desc = 'Provision Blue/Green Instances';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;
    console.log(chalk.green("Generating SSH Key Pair for the Blue and Green server."));

    // Get network information so port can be extracted
    let nicCmd = "vboxmanage showvminfo config-srv | grep 'NIC 1 Rule(0):'";

    // ssh command information
    let keyDir = "~/.bakerx/insecure_private_key";
    let port = execSync(nicCmd).toString().match(/[0-9]{4}/g);
    let options = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null";
    let user = "vagrant";
    let ip = "127.0.0.1";

    // Command for executing the ssh key gen script
    let keyGenCmd = "/bakerx/deployment/keygen_deployment.sh";

    // Make script executable
    await builder.execute(`ssh -i ${keyDir} -p ${port} ${options} ${user}@${ip} "sudo chmod +x ${keyGenCmd}"`, "./");
    // Remove the carriage return character that Windows may incorporate
    await builder.execute(`ssh -i ${keyDir} -p ${port} ${options} ${user}@${ip} "sed -i -e 's/\\r$//' ${keyGenCmd}"`, "./");

    // Execute the script to the config VM
    let provisionCmd = `ssh -i ${keyDir} -p ${port} ${options} ${user}@${ip} '${keyGenCmd}'`;
    await builder.execute(provisionCmd, "./");

    // Provision Blue and Green Instances
    console.log(chalk.green("Provisioning Blue and Green Instances..."));
    return builder.execute("bakerx run", "./deployment/");
};