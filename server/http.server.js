var http = require('http');
var fs = require('fs');

module.exports = {};

var files = {};
files.index = fs.readFileSync('index.html');
files.css = {};
files.css.bootstrap = fs.readFileSync('css/bootstrap.css');
files.css.bootstrapResponsive = fs.readFileSync('css/bootstrap-responsive.css');
files.js = {};
files.js.zc = fs.readFileSync('js/zc.js');

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
		default:
			show404();
			return;
	}
	response.end();
});

module.exports.start = function () {
	httpServer.listen(88);
	console.log('HTTP server started.');
};