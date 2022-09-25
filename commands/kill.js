const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const execSync = require('child_process').execSync;

const job = require('../lib/job');
const builder = require('../lib/builder');

exports.command = 'kill <inventory> <job_name> <build_yml>';
exports.desc = 'Kill deployment job';
exports.builder = yargs => {
    yargs.options({
    });
};

// Not a new feature; just for my convenience
exports.handler = async argv => {
    const { inventory, job_name, build_yml, processor } = argv;

    // Execute deployment job
    console.log(chalk.green(`Deploying Job: ${job_name} from ${build_yml} with ${inventory}`));
    await job.buildJob(job_name, build_yml, inventory, "deploy");

    // Print success message for shutting down deployed web app
    console.log(chalk.cyan("Web application has been shutdown."));
};
