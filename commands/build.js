const chalk = require('chalk');
const path = require('path');
const exec = require('child_process').exec;

const job = require('../lib/job');

exports.command = 'build <job_name> <build_yml>';
exports.desc = 'Build job';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { job_name, build_yml, processor } = argv;

    console.log(chalk.green(`Building Job: ${job_name} from ${build_yml}`));
    await job.buildJob(job_name, build_yml, "/bakerx/ansible/inventory", "web");
};
