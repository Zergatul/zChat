(function () {

	var webSocketAddr = 'ws://localhost:89/';

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

	var okMessage = 'ok';

	window.Connection = function () {
		var self = this;

		this._handlers = {};

		this._ws = new WebSocket(webSocketAddr);
		this._ws.onopen = function () {
			console.log('Socket opened!');
			if (typeof self._onConnect == 'function') {
				self._onConnect();
				delete self._onConnect;
			}
		};
		this._ws.onclose = function (event) {
			if (event.wasClean)
				console.log('Socket closed');
			else
				console.log('Socket closed unexpectedly');
			console.log('Code: ' + event.code + ' Reason: ' + event.reason);
		};
		this._ws.onmessage = function (event) {
			var delimiterIndex = event.data.indexOf(':');
			var id = event.data.substring(0, delimiterIndex);
			id = parseInt(id);
			var data = event.data.substring(delimiterIndex + 1);
			resolveSrvPacket(self, id, data);
		};
		this._ws.onerror = function (event) {
			console.log('Error: ' + event.message);
		};
	};

	var setupHandler = function (con, id, callback, permanent) {
		con._handlers[id] = { onMessage: callback };
		if (permanent)
			con._handlers[id].permanent = true;
	};

	var setupHandlers = function (con, id, onSuccess, onFail, permanent) {
		con._handlers[id] = { onSuccess: onSuccess, onFail: onFail };
		if (permanent)
			con._handlers[id].permanent = true;
	};

	var clearHandlers = function (con, id) {
		if (con._handlers[id])
			delete con._handlers[id];
	};

	var resolveSrvPacket = function (con, id, data) {
		if (con._handlers[id] != undefined) {
			var handlers = con._handlers[id];
			if (!handlers.permanent)
				delete con._handlers[id];
			if (handlers.onMessage != undefined)
				handlers.onMessage(data);
			else
				if (data == okMessage)
					handlers.onSuccess();
				else
					handlers.onFail(data);
		} else
			console.log('Packet without handler! id=' + id + '; data=' + data);
	};

	window.Connection.prototype.close = function () {
		this._ws.close();
	};

	window.Connection.prototype.sendNick = function (nick, onSuccess, onFail) {
		this._ws.send(pck.cl.nick + ':' + nick);
		setupHandlers(this, pck.srv.nickResponse, onSuccess, onFail);
	};

	window.Connection.prototype.inviteForChatting = function (partnerNick, onSuccess, onFail) {
		this._ws.send(pck.cl.chatInvite + ':' + partnerNick);
		setupHandlers(this, pck.srv.chatInviteResponse, onSuccess, onFail);
	};

	window.Connection.prototype.waitForInviteResponse = function (onSuccess, onFail) {
		setupHandlers(this, pck.srv.userInviteResponse, onSuccess, onFail);
	};

	window.Connection.prototype.acceptInvite = function () {
		this._ws.send(pck.cl.acceptInvite + ':');
	};

	window.Connection.prototype.declineInvite = function () {
		this._ws.send(pck.cl.declineInvite + ':');
	};

	window.Connection.prototype.sendMessage = function (text) {
		this._ws.send(pck.cl.message + ':' + text);
	};

	window.Connection.prototype.onConnect = function (func) {
		this._onConnect = func;
	};

	window.Connection.prototype.onChatRequest = function (func) {
		setupHandler(this, pck.srv.otherUserChatInvite, func, true);
	};

	window.Connection.prototype.onSessionInit = function (func) {
		setupHandler(this, pck.srv.sessionInit, func, true);
	};

	window.Connection.prototype.onMessage = function (func) {
		setupHandler(this, pck.srv.message, func, true);
	};

})();