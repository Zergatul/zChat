(function () {

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

	var okMessage = 127;

	window.Connection = function () {
		var self = this;

		this._handlers = {};

		this._ws = new WebSocket(webSocketAddr);
		this._ws.binaryType = 'arraybuffer';

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
			var message = new Uint8Array(event.data);
			var id = message[0];
			var data = message.subarray(1);
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
				if (data.length == 1 && data[0] == okMessage)
					handlers.onSuccess();
				else
					handlers.onFail(data);
		} else
			console.log('Packet without handler! id=' + id + '; data=' + data);
	};

	window.Connection.prototype.close = function () {
		this._ws.close();
	};

	var makeBuffer = function (id, str) {
		var bytes = encodings.UTF8.getBytes(str);
		var buf = new Uint8Array(bytes.length + 1)
		buf.set(bytes, 1);
		buf[0] = id;
		return buf.buffer;
	};

	window.Connection.prototype.sendNick = function (nick, onSuccess, onFail) {
		this._ws.send(makeBuffer(pck.cl.nick, nick));
		setupHandlers(this, pck.srv.nickResponse, onSuccess, onFail);
	};

	window.Connection.prototype.inviteForChatting = function (partnerNick, onSuccess, onFail) {
		this._ws.send(makeBuffer(pck.cl.chatInvite, partnerNick));
		setupHandlers(this, pck.srv.chatInviteResponse, onSuccess, onFail);
	};

	window.Connection.prototype.waitForInviteResponse = function (onSuccess, onFail) {
		setupHandlers(this, pck.srv.userInviteResponse, onSuccess, onFail);
	};

	window.Connection.prototype.acceptInvite = function () {
		this._ws.send(new Uint8Array([pck.cl.acceptInvite]).buffer);
	};

	window.Connection.prototype.declineInvite = function () {
		this._ws.send(new Uint8Array([pck.cl.declineInvite]).buffer);
	};

	window.Connection.prototype.sendRsaParams = function (keyLength, messageLength, n, e) {
		var nBin = n.toUint8Array();
		var eBin = e.toUint8Array();
		var bs = new BinaryStream();
		bs.writeByte(pck.cl.rsaParams);
		bs.writeInt32(keyLength);
		bs.writeInt32(messageLength);
		bs.writeInt32(nBin.length);
		bs.writeBytes(nBin);
		bs.writeInt32(eBin.length);
		bs.writeBytes(eBin);
		this._ws.send(bs.getUint8Array());
	};

	window.Connection.prototype.sendSessionKey = function (data) {
		var bs = new BinaryStream();
		bs.writeByte(pck.cl.sessionKey);
		bs.writeBytes(data);
		this._ws.send(bs.getUint8Array());
	};

	window.Connection.prototype.sendMessage = function (data) {
		var bs = new BinaryStream();
		bs.writeByte(pck.cl.message);
		bs.writeBytes(data);
		this._ws.send(bs.getUint8Array());
	};

	window.Connection.prototype.sendFileInfo = function (fileuid, name, size) {
		this._ws.send(pck.cl.fileInfo + ':' + fileuid + ':' + name + ':' + size);
	};

	window.Connection.prototype.sendBeginDownload = function (fileuid) {
		this._ws.send(pck.cl.beginDownload + ':' + fileuid);
	};

	window.Connection.prototype.sendRequestFileData = function (fileuid, from, len) {
		this._ws.send(pck.cl.requestFileData + ':' + fileuid + ':' + from + ':' + len);
	};

	window.Connection.prototype.sendFileData = function (fileuid, from, len, data) {
		this._ws.send(pck.cl.fileData + ':' + fileuid + ':' + from + ':' + len + ':' + bh.byteArrayToHex(data));
	};

	window.Connection.prototype.sendEndDownload = function (fileuid) {
		this._ws.send(pck.cl.endDownload + ':' + fileuid);
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

	window.Connection.prototype.onFileInfo = function (func) {
		setupHandler(this, pck.srv.fileInfo, func, true);
	};

	window.Connection.prototype.onBeginDownload = function (func) {
		setupHandler(this, pck.srv.beginDownload, func, true);
	};

	window.Connection.prototype.onRequestFileData = function (func) {
		setupHandler(this, pck.srv.requestFileData, func, true);
	};

	window.Connection.prototype.onFileData = function (func) {
		setupHandler(this, pck.srv.fileData, func, true);
	};

	window.Connection.prototype.onEndDownload = function (func) {
		setupHandler(this, pck.srv.endDownload, func, true);
	};

	window.Connection.prototype.onPartnerDisconnect = function (func) {
		setupHandler(this, pck.srv.partnerDisconnect, func, true);
	};

})();