const { IncomingWebhook } = require('@slack/webhook');

class SlackService {

    async postMessage(message) {
        let url = process.env.slackWebHookUrl;
        const webhook = new IncomingWebhook(url);

        await (async () => {
            await webhook.send({
                text: message
            });
        })();
    }
}

module.exports = new SlackService();