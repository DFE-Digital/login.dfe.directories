const { IncomingWebhook } = require('@slack/webhook');
const config = require('../infrastructure/config');

class SlackService {

    async postMessage(message) {
        let url = config.notifications.slackWebHookUrl;
        const webhook = new IncomingWebhook(url);

        await (async () => {
            await webhook.send({
                text: message
            });
        })();
    }
}

module.exports = new SlackService();