class SlackService {

    async postMessage(message) {
        console.log(message);
    }
}

module.exports = new SlackService();