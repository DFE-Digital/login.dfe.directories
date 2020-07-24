// const { IncomingWebhook } = require('@slack/webhook');
// const config = require('../infrastructure/config');

// class SlackService {

//     async postMessage(message) {

//         try {
//             // let url = config.notifications.slackWebHookUrl;
//             // let url = " https://hooks.slack.com/services/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";

//             let url = 'https://hooks.slack.com/services/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';
//             const webhook = new IncomingWebhook(url);

//             await (async () => {
//                 await webhook.send({
//                     text: message
//                 });
//             })();
//         } catch (ex) {
//             console.log("Exception in sending slack message", ex);
//         }
//     }
// }
// 
// module.exports = new SlackService();