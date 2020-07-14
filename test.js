// var http = require('http');

// http.createServer(function(req, res) {  
//     console.log("Http Call ---");
//   res.writeHead(200);
//   res.end("hello world\n");
// }).listen(8000);

var SlackService = require('./src/services/fakeSlackService');
SlackService.postMessage("dsdsdsd");