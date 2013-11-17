var http = require('http');
var https = require('https');
var fs = require('fs');
var settings = require('./settings');

module.exports = {};

var mime = {
	html: 'text/html; charset=UTF-8',
	css: 'text/css; charset=UTF-8',
	js: 'application/javascript; charset=UTF-8',
	ico: 'image/x-icon'
};

var files = {
	'/': { content: fs.readFileSync('index.html'), mime: mime.html },
	'/css/zc.css': {},
	'/css/bootstrap.css': {},
	'/css/bootstrap-responsive.css': {},
	'/favicon.ico': {},
	'/newmessage.ico': {}
};

var jss = fs.readdirSync('js');
for (var i = 0; i < jss.length; i++)
	files['/js/' + jss[i]] = {};

for (var file in files)
	if (files[file].content == undefined) {
		files[file].content = fs.readFileSync(file.substring(1));
		files[file].mime = mime[file.substring(file.lastIndexOf('.') + 1)];
	}

files['/js/sockets.js'].content = (function () {
	var previousContent = files['/js/sockets.js'].content.toString();
	var wsServer = '\'ws://' + settings.host + ':' + settings.wsPort + '/\'';
	var newContent = previousContent.replace('webSocketAddr', wsServer);
	return new Buffer(newContent);
})();

var show404 = function (response) {
	response.writeHead(404, { 'Content-Type': 'text/html' });
	response.write('The resourse you requested does not exist.');
	response.end();
};

var requestListener = function (request, response) {
	if (request.method != 'GET') {
		show404(response);
		return;
	}

	if (files[request.url] == undefined) {
		show404(response);
		return;
	}

	var file = files[request.url];
	response.writeHead(200, {
		'Content-Type': file.mime,
		'Cache-Control': 'max-age=' + settings.cacheMaxAge
	});
	response.write(file.content);
	response.end();
};

if (settings.useHttps) {
	var httpsServer = https.createServer({
		key: fs.readFileSync('keys/chat.zergatul.com.key'),
		cert: fs.readFileSync('keys/chat.zergatul.com.crt')
	}, requestListener);

	module.exports.start = function () {
		httpsServer.listen(settings.httpsPort);
		console.log('HTTPS server started');
	};
} else {
	var httpServer = http.createServer(requestListener);

	module.exports.start = function () {
		httpServer.listen(settings.httpPort);
		console.log('HTTP server started');
	};
}