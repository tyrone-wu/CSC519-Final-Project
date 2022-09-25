const chalk = require('chalk');
const path = require('path');
const os = require('os');

const got = require('got');
const http = require('http');
const httpProxy = require('http-proxy');

exports.command = 'serve <blue_ip> <green_ip> <port> <endpoint> <web_ip>';
exports.desc = 'Run traffic proxy.';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const { blue_ip, green_ip, port, endpoint, web_ip } = argv;

    (async () => {
        await run(blue_ip, green_ip, port, endpoint, web_ip);
    })();
};

class Production {

    constructor() {
        this.TARGET_IP = GREEN;
        this.TARGET_PORT = PORT;
        setInterval( this.healthCheck.bind(this), 1000 );
    }

    // TASK 1: 
    proxy() {
        let options = {};
        let proxy = httpProxy.createProxyServer(options);
        let self = this;

        // Redirect requests to the active TARGET (BLUE or GREEN)s
        let server  = http.createServer(function(req, res) {
            // callback for redirecting requests.
            proxy.web( req, res, { target: `http://${self.TARGET_IP}:${self.TARGET_PORT}` } );
        });
        server.listen(3090);
    }

    failover() {
        this.TARGET_IP = BLUE;
    }

    async healthCheck() {
        try {
            try {
                // Check if GREEN is good to switch back
                if (this.TARGET_IP == BLUE) {
                    const response = await got(`http://${GREEN}:${this.TARGET_PORT}${HEALTH_ENDPOINT}`, { throwHttpErrors: false });
                    var status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);

                    if (response.statusCode == 200) {
                        this.TARGET_IP = GREEN;
                    }
                }

                const response = await got(`http://${this.TARGET_IP}:${this.TARGET_PORT}${HEALTH_ENDPOINT}`, { throwHttpErrors: false });
                var status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);
                if (this.TARGET_IP == GREEN && response.statusCode == 500) {
                    this.failover();
                }
            } catch (error) {
                this.failover();
                var status = error;
            }

            console.log( chalk`{grey Health check on http://${this.TARGET_IP}:${this.TARGET_PORT}${HEALTH_ENDPOINT}}: ${status}`);
        } catch (error) {
            console.log(error);
        }
    }
}

async function run(blue_ip, green_ip, webapp_port, webapp_endpoint, web_ip) {
    // URLs to for the blue/green instances
    GREEN = green_ip;
    BLUE = blue_ip;
    PORT = webapp_port;
    HEALTH_ENDPOINT = webapp_endpoint;

    console.log(chalk.keyword('pink') (`Starting proxy on http://${web_ip}:3090`));

    let prod = new Production();
    prod.proxy();
}