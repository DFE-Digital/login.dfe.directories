var axios = require('axios');

class SlackService {

    async static postMessage(message) {
        let url = process.env.slackWebHookUrl;
        let reqBody = {
            text: message
        };
        await axios.post(url, reqBody);
    }
}

module.exports = SlackService;