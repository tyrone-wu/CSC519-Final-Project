const chalk = require('chalk');
const path = require('path');
const fs = require("fs");
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

class Job {

    // Run job
    async buildJob(job_name, build_yml, invFilePath, host) {

        // Copy build.yml to ./ansible/vars directory
        let fileName = "build-copy.yml";
        let dest = `./ansible/vars/${fileName}`;
        fs.copyFile(`${build_yml}`, `${dest}`, (err) => { 
            if (err) { 
                console.log(err); 
            } 
        });

        // Get network information so port can be extracted
        let nicCmd = "vboxmanage showvminfo config-srv | grep 'NIC 1 Rule(0):'";

        // ssh command information
        let keyDir = "~/.bakerx/insecure_private_key";
        let port = execSync(nicCmd).toString().match(/[0-9]{4}/g);
        let options = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null";
        let user = "vagrant";
        let ip = "127.0.0.1";

        // Parameters to pass when executing the ansible playbook
        let extraVars = `--extra-vars "job_name=${job_name} build=${fileName} host=${host}"`;

        // Setting the correct inventory file to use
        if (host === "deploy") {
            // Copy inventory file to the deployment directory
            fs.copyFile(invFilePath, "./deployment/inventory", (err) => { 
                if (err) { 
                    console.log(err); 
                }
            });
            invFilePath = "/bakerx/deployment/inventory";
        }

        // Command for executing ansible playbook
        let ansibleCmd = `ansible-playbook /bakerx/ansible/build-playbook.yml -i ${invFilePath} ${extraVars}`;

        // Final command for executing ansible command to VM
        let jobCmd = `ssh -i ${keyDir} -p ${port} ${options} ${user}@${ip} '${ansibleCmd}'`;
        return this._exec(jobCmd);
    }

    // Executes the command in the parameter
    _exec(cmd) {
        console.log( chalk.yellowBright(`Running ${cmd}` ));
        return new Promise( (resolve, reject) => {

            let subprocess = exec(cmd, {maxBuffer: 5 * 1024 * 1024});

            // Subscribe to stdout, stderr events
            subprocess.stdout.on('data', stdout => {
                console.log( chalk.gray(stdout.toString() ));

            });
            subprocess.stderr.on('data', stderr => {
                console.log( chalk.gray(stderr.toString() ));
            });

            // Subscribe to error starting process or process exiting events.
            subprocess.on('error', err => {
                console.log( chalk.red( err.message ) );
                reject(err);
            });
            subprocess.on('exit', code => {
                resolve(code);
            });
        });
    }

}

module.exports = new Job();