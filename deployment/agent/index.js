const redis = require('redis');
const util  = require('util');
const os = require('os');
const si = require('systeminformation');
const yaml = require('js-yaml');
const fs = require('fs');

// Calculate metrics.
class Agent {

    memoryLoad() {
        let used = os.totalmem() - os.freemem();
        return (used / os.totalmem() * 100).toFixed(2);
    }

    async cpu() {
       let load = await si.currentLoad();
       return load.currentload.toFixed(2);
    }
}

(async () => {
    // Get command line arguments
    let args = process.argv.slice(2);

    let agentName = args[0];
    let webIP = args[1];
    main(agentName, webIP);
})();

async function main(name, webIP) {
    let agent = new Agent();

    let connection = redis.createClient(6379, `${webIP}`, {});
    connection.on('error', function(e) {
        console.log(e);
        process.exit(1);
    });
    let client = {};
    client.publish = util.promisify(connection.publish).bind(connection);

    // Push update ever 1 second
    setInterval(async function() {
        let payload = {
            memoryLoad: agent.memoryLoad(),
            cpu: await agent.cpu()
        };
        let msg = JSON.stringify(payload);
        await client.publish(name, msg);
        // console.log(`${name} ${msg}`);
    }, 1000);
}
