var http = require('http');
var fs = require('fs');

module.exports = {};

var httpPort = 88;

var files = {};
files.index = fs.readFileSync('index.html');
files.css = {};
files.css.bootstrap = fs.readFileSync('css/bootstrap.css');
files.css.bootstrapResponsive = fs.readFileSync('css/bootstrap-responsive.css');
files.js = {};
files.js.zc = fs.readFileSync('js/zc.js');
files.js.jquery = fs.readFileSync('js/jquery-2.0.3.js');
files.js.sockets = fs.readFileSync('js/sockets.js');
files.js.bithelper = fs.readFileSync('js/bithelper.js');
files.js.aes = fs.readFileSync('js/aes.js');

var show404 = function (response) {
	response.writeHead(404, { 'Content-Type': 'text/html' });
	response.write('The page you requested no exists.');
	response.end();
};

var httpServer = http.createServer(function (request, response) {
	if (request.method != 'GET') {
		show404(response);
		return;
	}

	switch (request.url) {
		case '/':
			response.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
			response.write(files.index);
			break;
		case '/css/bootstrap.css':
			response.writeHead(200, { 'Content-Type': 'text/css; charset=UTF-8' });
			response.write(files.css.bootstrap);
			break;
		case '/css/bootstrap-responsive.css':
			response.writeHead(200, { 'Content-Type': 'text/css; charset=UTF-8' });
			response.write(files.css.bootstrapResponsive);
			break;
		case '/js/zc.js':
			response.writeHead(200, { 'Content-Type': 'application/javascript; charset=UTF-8' });
			response.write(files.js.zc);
			break;
		case '/js/jquery-2.0.3.js':
			response.writeHead(200, { 'Content-Type': 'application/javascript; charset=UTF-8' });
			response.write(files.js.jquery);
			break;
		case '/js/sockets.js':
			response.writeHead(200, { 'Content-Type': 'application/javascript; charset=UTF-8' });
			response.write(files.js.sockets);
			break;
		case '/js/bithelper.js':
			response.writeHead(200, { 'Content-Type': 'application/javascript; charset=UTF-8' });
			response.write(files.js.bithelper);
			break;
		case '/js/aes.js':
			response.writeHead(200, { 'Content-Type': 'application/javascript; charset=UTF-8' });
			response.write(files.js.aes);
			break;
		default:
			show404(response);
			return;
	}
	response.end();
});

module.exports.start = function () {
	httpServer.listen(httpPort);
	console.log('HTTP server started.');
};