var ws = require('ws');
var settings = require('./settings');

module.exports = {};

module.exports.start = function () {
	var wsServer = new ws.Server({ port: settings.wsPort });
	wsServer.on('connection', function (socket) {
		socket.on('message', function (message) {
			onMessage(socket, message);
		});
		socket.on('close', function () {
			onClose(socket);
		});
	});
	wsServer.on('error', function (error) {
		console.log('WebSocket error');
	});
	console.log('WebSocket server started');
};

var pck = { srv: {}, cl: {} };
pck.cl.nick = 1;
pck.cl.chatInvite = 2;
pck.cl.acceptInvite = 3;
pck.cl.declineInvite = 4;
pck.cl.rsaParams = 5;
pck.cl.sessionKey = 6;
pck.cl.message = 7;
pck.cl.fileInfo = 8;
pck.cl.beginDownload = 9;
pck.cl.requestFileData = 10;
pck.cl.fileData = 11;
pck.cl.endDownload = 12;
pck.srv.nickResponse = 1;
pck.srv.otherUserChatInvite = 2;
pck.srv.chatInviteResponse = 3;
pck.srv.userInviteResponse = 4;
pck.srv.rsaParams = 5;
pck.srv.sessionKey = 6;
pck.srv.sessionInit = 7;
pck.srv.message = 8;
pck.srv.partnerDisconnect = 9;
pck.srv.fileInfo = 10;
pck.srv.beginDownload = 11;
pck.srv.requestFileData = 12;
pck.srv.fileData = 13;
pck.srv.endDownload = 14;
pck.srv.chatInviteTimeout = 15;

var state = {
	INITIAL: 1,
	WAIT_FOR_INVITE_RESPONSE: 3,
	INVITING_PROCESS: 4,
	RSA_PARAMS_SENDING: 6,
	WAITING_FOR_RSA_PARAMS: 7,
	SESSION_KEY_SENDING: 8,
	WAITING_FOR_SESSION_KEY: 9,
	CHATTING_PRIMARY: 10,
	CHATTING_SECONDARY: 11
};

var okMessage = 127;

var users = {};

var onMessage = function (socket, message) {
	if (settings.packetLogging)
		console.log('received: %s', message.toString('hex'));

	var id = message[0];
	var data = message.slice(1);

	if (id == pck.cl.nick) {
		onNickPacket(socket, data);
		return;
	}
	if (id == pck.cl.chatInvite) {
		onChatInvite(socket, data);
		return;
	}
	if (id == pck.cl.acceptInvite) {
		onAcceptInvite(socket);
		return;
	}
	if (id == pck.cl.declineInvite) {
		onDeclineInvite(socket);
		return;
	}
	if (id == pck.cl.rsaParams) {
		onRsaParams(socket, data);
		return;
	}
	if (id == pck.cl.sessionKey) {
		onSessionKey(socket, data);
		return;
	}
	if (id == pck.cl.message) {
		onMessagePacket(socket, data);
		return;
	}
	if (id == pck.cl.fileInfo) {
		onFileInfo(socket, data);
		return;
	}
	if (id == pck.cl.beginDownload) {
		onBeginDownload(socket, data);
		return;
	}
	if (id == pck.cl.requestFileData) {
		onRequestFileData(socket, data);
		return;
	}
	if (id == pck.cl.fileData) {
		onFileData(socket, data);
		return;
	}
	if (id == pck.cl.endDownload) {
		onEndDownload(socket, data);
		return;
	}
};

var makeBuffer = function (id, str) {
	var msg = new Buffer(str);
	var buf = new Buffer(msg.length + 1);
	buf[0] = id;
	msg.copy(buf, 1);
	return buf;
};

var onClose = function (socket) {
	var user = users[socket._nick];
	if (user == undefined)
		return;
	
	delete users[socket._nick];

	if (user.state == state.CHATTING_PRIMARY || user.state == state.CHATTING_SECONDARY) {
		var partner = users[user.partner];
		if (partner != undefined) {
			users[user.partner].socket.send(new Buffer([pck.srv.partnerDisconnect]));
			users[user.partner].state = state.INITIAL;
		}
	}
};

var onNickPacket = function (socket, data) {
	if (socket._nick != undefined) {
		console.log('Nick packet already sended!');
		return;
	}
	var nick = new Buffer(data).toString('utf8');
	if (users[nick] == undefined) {
		socket._nick = nick;
		users[nick] = { state: state.INITIAL, socket: socket, nick: nick };
		socket.send(new Buffer([pck.srv.nickResponse, okMessage]));
	} else {
		socket.send(makeBuffer(pck.srv.nickResponse, 'Nick is already used by another user'));
	}
};

var onChatInvite = function (socket, data) {
	var nick = socket._nick;
	if (nick == undefined) {
		console.log('User did not send nick.');
		return;
	}
	if (users[nick] == undefined) {
		console.log('User is not in the list.');
		return;
	}
	if (users[nick].state != state.INITIAL) {
		console.log('User already in busy state.');
		return;
	}
	var strLen = data.readInt32LE(0);
	var partnerNick = data.toString('utf8', 4, 4 + strLen);
	if (nick == partnerNick) {
		socket.send(makeBuffer(pck.srv.chatInviteResponse, 'You cannot chat with self'));
		return;
	}
	if (users[partnerNick] == undefined) {
		socket.send(makeBuffer(pck.srv.chatInviteResponse, 'User is not online now'));
		return;
	}
	var partner = users[partnerNick];
	if (partner.state == state.WAIT_FOR_INVITE_RESPONSE) {
		socket.send(makeBuffer(pck.srv.chatInviteResponse, 'This user is inviting another user now'));
		return;
	}
	if (partner.state == state.INVITING_PROCESS) {
		socket.send(makeBuffer(pck.srv.chatInviteResponse, 'Someone else is inviting this user for chatting'));
		return;
	}
	if (partner.state == state.CHATTING_PRIMARY || partner.state == state.CHATTING_SECONDARY) {
		socket.send(makeBuffer(pck.srv.chatInviteResponse, 'This user is already chatting with someone'));
		return;
	}
	socket.send(new Buffer([pck.srv.chatInviteResponse, okMessage]));

	var nickBuffer = new Buffer(nick);
	var buffer = new Buffer(1 + 4 + nickBuffer.length + 8 + 1);
	buffer[0] = pck.srv.otherUserChatInvite;
	buffer.writeUInt32LE(nickBuffer.length, 1);
	nickBuffer.copy(buffer, 5);
	data.copy(buffer, 1 + 4 + nickBuffer.length, 4 + strLen);
	partner.socket.send(buffer);

	users[nick].state = state.WAIT_FOR_INVITE_RESPONSE;
	users[nick].inviting = partnerNick;

	partner.state = state.INVITING_PROCESS;
	partner.invitedBy = nick;

	if (users[nick].timer != null)
		clearTimeout(users[nick].timer);
	if (partner.timer != null)
		clearTimeout(users[nick].timer);

	var timer = setTimeout(function () {
		users[nick].socket.send(new Buffer([pck.srv.chatInviteTimeout]));
		partner.socket.send(new Buffer([pck.srv.chatInviteTimeout]));
		users[nick].state = state.INITIAL;
		partner.state = state.INITIAL;
	}, 30000);
	users[nick].timer = timer;
	partner.timer = timer;
};

var onAcceptInvite = function (socket) {
	var nick = socket._nick;
	var partner = users[nick];
	var user = users[partner.invitedBy];

	user.state = state.RSA_PARAMS_SENDING;
	partner.state = state.WAITING_FOR_RSA_PARAMS;

	user.partner = partner.nick;
	partner.partner = user.nick;

	clearTimeout(user.timer);
	user.timer = null;
	clearTimeout(partner.timer);
	partner.timer = null;

	user.socket.send(new Buffer([pck.srv.userInviteResponse, okMessage]));
};

var onDeclineInvite = function (socket) {
	var nick = socket._nick;
	var partner = users[nick];
	var user = users[partner.invitedBy];

	user.state = state.INITIAL;
	partner.state = state.INITIAL;

	clearTimeout(user.timer);
	user.timer = null;
	clearTimeout(partner.timer);
	partner.timer = null;

	user.socket.send(makeBuffer(pck.srv.userInviteResponse, 'User declined your invite'));
};

var onRsaParams = function (socket, data) {
	var nick = socket._nick;
	if (nick == undefined) {
		console.log('User did not send nick.');
		return;
	}
	var user = users[nick];
	if (user == undefined) {
		console.log('User is not in the list.');
		return;
	}
	if (user.state != state.RSA_PARAMS_SENDING) {
		console.log('User is not in RSA_PARAMS_SENDING state.');
		return;
	}
	if (user.partner == undefined) {
		console.log('User does not have a partner.');
		return;
	}
	var partner = users[user.partner];
	if (partner == undefined) {
		console.log('User partner is not in the list');
		return;
	}
	if (partner.state != state.WAITING_FOR_RSA_PARAMS) {
		console.log('Partner is not in WAITING_FOR_RSA_PARAMS state');
		return;
	}

	user.state = state.WAITING_FOR_SESSION_KEY;
	partner.state = state.SESSION_KEY_SENDING;

	partner.socket.send(makeBuffer(pck.srv.rsaParams, data));
};

var onSessionKey = function (socket, data) {
	var nick = socket._nick;
	if (nick == undefined) {
		console.log('User did not send nick.');
		return;
	}
	var user = users[nick];
	if (user == undefined) {
		console.log('User is not in the list.');
		return;
	}
	if (user.state != state.SESSION_KEY_SENDING) {
		console.log('User is not in SESSION_KEY_SENDING state.');
		return;
	}
	if (user.partner == undefined) {
		console.log('User does not have a partner.');
		return;
	}
	var partner = users[user.partner];
	if (partner == undefined) {
		console.log('User partner is not in the list');
		return;
	}
	if (partner.state != state.WAITING_FOR_SESSION_KEY) {
		console.log('Partner is in invalid state');
		return;
	}

	user.state = state.CHATTING_SECONDARY;
	partner.state = state.CHATTING_PRIMARY;

	partner.socket.send(makeBuffer(pck.srv.sessionKey, data));

	user.socket.send(makeBuffer(pck.srv.sessionInit, partner.nick));
	partner.socket.send(makeBuffer(pck.srv.sessionInit, user.nick));
};

var onMessagePacket = function (socket, data) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(makeBuffer(pck.srv.message, data));
};

var onFileInfo = function (socket, data) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(makeBuffer(pck.srv.fileInfo, data));
};

var onBeginDownload = function (socket, data) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(makeBuffer(pck.srv.beginDownload, data));
};

var onRequestFileData = function (socket, data) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(makeBuffer(pck.srv.requestFileData, data));
};

var onFileData = function (socket, data) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(makeBuffer(pck.srv.fileData, data));
};

var onEndDownload = function (socket, data) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(makeBuffer(pck.srv.endDownload, data));
};