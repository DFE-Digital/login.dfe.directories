const { IncomingWebhook } = require('@slack/webhook');
const config = require('../infrastructure/config');

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
            console.log("Exception in sending slack message", ex);
        }
    }
}

module.exports = new SlackService();