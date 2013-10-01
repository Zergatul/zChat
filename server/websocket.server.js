var ws = require('ws');

module.exports = {};

module.exports.start = function () {
	var wsServer = new ws.Server({ port: 89 });
	wsServer.on('connection', function (socket) {
		socket.on('message', function (message) {
			console.log('received: %s', message);
		});
		socket.send('something');
	});
	wsServer.on('error', function (error) {
		console.log('WebSocket error');
	});
	console.log('WebSocket server started.');
};