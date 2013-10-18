var ws = require('ws');

module.exports = {};

module.exports.start = function () {
	var wsServer = new ws.Server({ port: 89 });
	wsServer.on('connection', function (socket) {
		socket.on('message', function (message) {
			onMessage(socket, message);
		});
	});
	wsServer.on('error', function (error) {
		console.log('WebSocket error');
	});
	console.log('WebSocket server started.');
};

var pck = { srv: {}, cl: {} };
pck.cl.nick = 1;
pck.cl.chatInvite = 2;
pck.cl.acceptInvite = 3;
pck.cl.declineInvite = 4;
pck.cl.message = 5;
pck.srv.nickResponse = 1;
pck.srv.otherUserChatInvite = 2;
pck.srv.chatInviteResponse = 3;
pck.srv.userInviteResponse = 4;
pck.srv.sessionInit = 5;
pck.srv.message = 6;

var state = {
	INITIAL: 1,
	NICK_CONFIRMED: 2,
	WAIT_FOR_INVITE_RESPONSE: 3,
	INVITING_PROCESS: 4,
	CHATTING_PRIMARY: 5,
	CHATTING_SECONDARY: 6
};

var okMessage = 'ok';

var users = {};

var onMessage = function (socket, message) {
	console.log('received: %s', message);

	var delimiterIndex = message.indexOf(':');
	var id = message.substring(0, delimiterIndex);
	id = parseInt(id);
	var data = message.substring(delimiterIndex + 1);

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
	if (id == pck.cl.message) {
		onMessagePacket(socket, data);
		return;
	}
};

var onNickPacket = function (socket, nick) {
	if (socket._nick != undefined) {
		console.log('Nick packet already sended!');
		return;
	}
	if (users[nick] == undefined) {
		socket._nick = nick;
		users[nick] = { state: state.NICK_CONFIRMED, socket: socket, nick: nick };
		socket.send(pck.srv.nickResponse + ':' + okMessage);
	} else {
		socket.send(pck.srv.nickResponse + ':Nick is already used by another user.');
	}
};

var onChatInvite = function (socket, partnerNick) {
	var nick = socket._nick;
	if (nick == undefined) {
		console.log('User did not send nick.');
		return;
	}
	if (users[nick] == undefined) {
		console.log('User is not in the list.');
		return;
	}
	if (users[nick].state != state.NICK_CONFIRMED) {
		console.log('User already in busy state.');
		return;
	}
	if (nick == partnerNick) {
		socket.send(pck.srv.chatInviteResponse + ':You cannot chat with self.');
		return;
	}
	if (users[partnerNick] == undefined) {
		socket.send(pck.srv.chatInviteResponse + ':User is not online now.');
		return;
	}
	var partner = users[partnerNick];
	if (partner.state == state.WAIT_FOR_INVITE_RESPONSE) {
		socket.send(pck.srv.chatInviteResponse + ':This user is inviting another user now.');
		return;
	}
	if (partner.state == state.INVITING_PROCESS) {
		socket.send(pck.srv.chatInviteResponse + ':Someone else is inviting this user for chatting.');
		return;
	}
	if (partner.state == state.CHATTING_PRIMARY || partner.state == state.CHATTING_SECONDARY) {
		socket.send(pck.srv.chatInviteResponse + ':This user is already chatting with someone.');
		return;
	}
	socket.send(pck.srv.chatInviteResponse + ':' + okMessage);
	partner.socket.send(pck.srv.otherUserChatInvite + ':' + nick);

	users[nick].state = state.WAIT_FOR_INVITE_RESPONSE;
	users[nick].inviting = partnerNick;

	partner.state = state.INVITING_PROCESS;
	partner.invitedBy = nick;
};

var onAcceptInvite = function (socket) {
	var nick = socket._nick;
	var partner = users[nick];
	var user = users[partner.invitedBy];

	user.state = state.CHATTING_PRIMARY;
	partner.state = state.CHATTING_SECONDARY;

	user.socket.send(pck.srv.userInviteResponse + ':' + okMessage);

	user.partner = partner.nick;
	partner.partner = user.nick;

	user.socket.send(pck.srv.sessionInit + ':' + partner.nick);
	partner.socket.send(pck.srv.sessionInit + ':' + user.nick);
};

var onDeclineInvite = function (socket) {
	var nick = socket._nick;
	var partner = users[nick];
	var user = users[partner.invitedBy];

	user.state = state.NICK_CONFIRMED;
	partner.state = state.NICK_CONFIRMED;

	user.socket.send(pck.srv.userInviteResponse + ':User declined your invite.');
};

var onMessagePacket = function (socket, message) {
	var user = users[socket._nick];
	var partner = users[user.partner];

	partner.socket.send(pck.srv.message + ':' + message);
};