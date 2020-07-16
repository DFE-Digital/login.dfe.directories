var pm2 = require('pm2');
var _ = require('lodash');
const cron = require("node-cron");
var SlackService = require('./services/slackService');

const COOLING_PERIOD = 2 * 60 * 1000;

pm2.connect(function (err) {

    function scaleDown() {
        pm2.scale('dfe-dir', 2, (err, procs) => {
            if (err) {
                let msg = 'Error SCALING Directory Instances to 2 instances, will try again';
                SlackService.postMessage(msg);

                setTimeout(() => {
                    scaleDown();
                }, COOLING_PERIOD);
            } else {
                let msg = 'SCALED Directory Instances to 2 instances';
                SlackService.postMessage(msg);
            }
        });
    }

    function scaleUp() {
        pm2.scale('dfe-dir', '+2', (err, procs) => {
            if (err) {
                let msg = 'Error SCALING Directory Instances to 4 instances. Will try again';
                SlackService.postMessage(msg);

                setTimeout(() => {
                    scaleUp();
                }, COOLING_PERIOD);
            } else {
                let msg = 'SCALED Directory Instances to 4 instances';
                SlackService.postMessage(msg);

                setTimeout(() => {
                    scaleDown();
                }, COOLING_PERIOD);
            }
        });
    }

    function reloadCluster() {
        pm2.list((err, list) => {
            let instances = _.filter(list, (x) => {
                return x.name == 'dfe-dir';
            });

            if (instances.length <= 2) {
                scaleUp();
            }
        })
    }

    function monitorCluster() {
        // cron.schedule("0 2 * * 1-5", () => {
        cron.schedule("* * * * 1-5", () => {
            reloadCluster();
        });
    }

    if (err) {
        process.exit(2);
    }

    pm2.start({
        script: 'src/index.js',   // Script to be run DFE Directory 
        name: 'dfe-dir',
        exec_mode: 'cluster',
        instances: 2,
    }, (err, apps) => {
        if (err) {
            throw err;
        } else {
            monitorCluster();
        }
    });
});