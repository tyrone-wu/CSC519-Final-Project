const chalk = require('chalk');
const path = require('path');

const builder = require('../lib/builder');

exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { processor } = argv;

    console.log(chalk.green("Preparing computing environment..."));
    
    if (processor === "Intel/Amd64") {
        // If host is not running on M1, use bakerx
        console.log(chalk.cyan("Provisioning VM with bakerx..."));
        await builder.execute("bakerx run", "./");
    } else {
        // If host is running on M1
        console.log(chalk.red("M1 Detected - :((((((((((((((((((("));
        console.log(chalk.red("Get off M1 >:("));
    }
};