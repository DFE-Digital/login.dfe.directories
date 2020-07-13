const { IncomingWebhook } = require('@slack/webhook');

class SlackService {

    static async postMessage(message) {
        let url = process.env.slackWebHookUrl;
        const webhook = new IncomingWebhook(url);

        await (async () => {
            await webhook.send({
                text: message
            });
        })();
    }
}

module.exports = SlackService;