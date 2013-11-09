(function () {

	var pck = { srv: {}, cl: {} };
	pck.cl.nick = 1;
	pck.cl.chatInvite = 2;
	pck.cl.acceptInvite = 3;
	pck.cl.declineInvite = 4;
	pck.cl.rsaParams = 5;
	pck.cl.sessionKey = 6;
	pck.cl.message = 7;
	pck.srv.nickResponse = 1;
	pck.srv.otherUserChatInvite = 2;
	pck.srv.chatInviteResponse = 3;
	pck.srv.userInviteResponse = 4;
	pck.srv.rsaParams = 5;
	pck.srv.sessionKey = 6;
	pck.srv.sessionInit = 7;
	pck.srv.message = 8;
	pck.srv.partnerDisconnect = 9;

	var okMessage = 'ok';

	window.Connection = function () {
		var self = this;

		this._handlers = {};

		this._ws = new WebSocket(webSocketAddr);

		this._ws.onopen = function () {
			if (typeof self._onConnect == 'function') {
				self._onConnect();
				delete self._onConnect;
			}
		};

		this._ws.onclose = function (event) {
			if (typeof self._onDisconnect == 'function') {
				self._onDisconnect();
				delete self._onDisconnect;
			}
		};

		this._ws.onmessage = function (event) {
			var delimiterIndex = event.data.indexOf(':');
			var id = event.data.substring(0, delimiterIndex);
			id = parseInt(id);
			var data = event.data.substring(delimiterIndex + 1);
			resolveSrvPacket(self, id, data);
		};

		this._ws.onerror = function (event) {
			if (typeof self._onSocketError == 'function') {
				self._onSocketError();
				delete self._onSocketError;
			}
			if (typeof self._onDisconnect == 'function') {
				self._onDisconnect();
				delete self._onDisconnect;
			}
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

	window.Connection.prototype.sendRsaParams = function (data) {
		this._ws.send(pck.cl.rsaParams + ':' + data);
	};

	window.Connection.prototype.sendSessionKey = function (data) {
		this._ws.send(pck.cl.sessionKey + ':' + data);
	};

	window.Connection.prototype.sendMessage = function (text) {
		this._ws.send(pck.cl.message + ':' + text);
	};

	window.Connection.prototype.onConnect = function (func) {
		this._onConnect = func;
	};

	window.Connection.prototype.onSocketError = function (func) {
		this._onSocketError = func;
	};

	window.Connection.prototype.onDisconnect = function (func) {
		this._onDisconnect = func;
	};

	window.Connection.prototype.onChatRequest = function (func) {
		setupHandler(this, pck.srv.otherUserChatInvite, func, true);
	};

	window.Connection.prototype.onRsaParams = function (func) {
		setupHandler(this, pck.srv.rsaParams, func, true);
	};

	window.Connection.prototype.onSessionKey = function (func) {
		setupHandler(this, pck.srv.sessionKey, func, true);
	};

	window.Connection.prototype.onSessionInit = function (func) {
		setupHandler(this, pck.srv.sessionInit, func, true);
	};

	window.Connection.prototype.onMessage = function (func) {
		setupHandler(this, pck.srv.message, func, true);
	};

	window.Connection.prototype.onPartnerDisconnect = function (func) {
		setupHandler(this, pck.srv.partnerDisconnect, func, true);
	};

})();