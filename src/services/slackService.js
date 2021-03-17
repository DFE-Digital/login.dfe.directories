const { IncomingWebhook } = require('@slack/webhook');
const config = require('../infrastructure/config');
const logger = require('../infrastructure/logger');

class SlackService {

    async postMessage(message) {

        try {
            let url = config.notifications.slackWebHookUrl;
            const webhook = new IncomingWebhook(url);

            await (async () => {
                await webhook.send({
                    text: message
                });
            })();
        } catch (ex) {
            logger.error(`Exception in sending slack message`);
            logger.error(ex);
        }
    }
}

module.exports = new SlackService();