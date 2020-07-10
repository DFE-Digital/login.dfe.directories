var pm2 = require('pm2');
var moment = require('moment');
var _ = require('lodash');
var SlackService = require('./build/slackService');

// --- for Development ---
var SlackService = require('./build/fakeSlackService');

let slackService = new SlackService();

const POLL_INTERVAL = 10 * 60 * 1000;
const COOLING_PERIOD = 2 * 60 * 1000;

// --- for Development ---
// const POLL_INTERVAL = 20000;
// const COOLING_PERIOD = 5000;

pm2.connect(function (err) {

    let lastRunDate = moment().year() + '.' + moment().month() + '.' + moment().date();

    function yetToBeExecutedForTheDay() {
        let currentDate = moment().year() + '.' + moment().month() + '.' + moment().date();

        if (currentDate == lastRunDate) {
            return true;
        }

        return false;
    }

    function isMondayMorning() {
        if (moment().day() == 1 && (moment().hour() > 1 && moment().hour() < 3)) {
            return true;
        }

        return false;
    }

    function isFridayMorning() {
        if (moment().day() == 5 && (moment().hour() > 1 && moment().hour() < 3)) {
            return true;
        }

        return false;
    }

    function scaleDown() {
        pm2.scale('dfe-dir', 2, (err, procs) => {
            console.log('SCALED Directory Instances to 2 instances');
            slackService.postMessage('Directory Instances scalled to 2 instances');
            lastRunDate = moment().year() + '.' + moment().month() + '.' + moment().date();
        });
    }

    function scaleUp() {
        pm2.scale('dfe-dir', '+2', (err, procs) => {
            console.log('SCALED Directory Instances scalled to 4 instances');
            slackService.postMessage('Directory Instances to 4 instances');
            setTimeout(() => {
                scaleDown();
            }, COOLING_PERIOD);
        });
    }

    function increaseClusterSize() {
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
        setInterval(() => {
            if ((isMondayMorning() || isFridayMorning()) && yetToBeExecutedForTheDay()) {
                increaseClusterSize();
            }
        }, POLL_INTERVAL);
    }

    if (err) {
        console.error(err);
        process.exit(2);
    }

    pm2.list((err, list) => {
        console.log(err, list)
    })

    pm2.stop('dfe-dir', (err, proc) => {
    })

    pm2.restart('dfe-dir', (err, proc) => {
    })

    pm2.start({
        script: 'src/index.js',   // Script to be run DFE Directory 
        name: 'dfe-dir',
        exec_mode: 'cluster',
        instances: 2,
    }, (err, apps) => {
        if (err) {
            throw err
        } else {
            monitorCluster();
        }
    });
});