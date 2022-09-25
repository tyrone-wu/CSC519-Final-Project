const chalk = require('chalk');
const path = require('path');
const exec = require('child_process').exec;

class Builder {

    // Executes the commands in subprocess and print the output
    async execute(command, cwd) {
        return this._exec(command, cwd);
    }

    // Executes the command in the parameter
    _exec(cmd, dir) {
        console.log( chalk.yellowBright(`Running ${cmd}` ));
        return new Promise( (resolve, reject) => {

            let subprocess = exec(cmd, { cwd: dir });

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

module.exports = new Builder();