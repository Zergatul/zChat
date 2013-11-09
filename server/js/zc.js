$(function () {

	var manager = {};
	var helper = {};
	var conHandlers = {};

	manager.pageInit = function () {
		manager.messageTemplate = $('#messages-div > div:first').clone();

		// setup handlers
		$('#connect-btn').click(manager.onConnectBtnClick);
		$('#random-nick-btn').click(manager.onRandomBtnClick);
		$('#chat-invite-btn').click(manager.onChatInviteBtnClick);
		$('#accept-invite-btn').click(manager.onAcceptInviteBtnClick);
		$('#decline-invite-btn').click(manager.onDeclineInviteBtnClick);
		$('#send-btn').click(manager.sendMessage);
		$('#text-input-div input').on('keypress', manager.onTextInputKeyPress);
		$(window).resize(manager.onWindowResize);
		$('#clear-all-link').click(manager.onClearAllClick);
		$('#clear-1min-link').click(function () { manager.clearMessages(60); });
		$('#clear-5min-link').click(function () { manager.clearMessages(5 * 60); });
		$('#clear-15min-link').click(function () { manager.clearMessages(15 * 60); });
		$('#clear-1hour-link').click(function () { manager.clearMessages(60 * 60); });
		$('#disconnect-link').click(manager.onDisconnectClick);
		$('#terminate-session-link').click(manager.onTerminateSessionClick);
		$(document).on('keypress', manager.onKeyPress);

		// setup clearing blink messages
		manager.keyPressed = false;
		manager.blinkMessages = [];
		manager.blinkMessageTimer = setInterval(manager.clearBlinkMessages, 500);
		manager.icon1 = helper.loadIcon('favicon.ico');
		manager.icon2 = helper.loadIcon('newmessage.ico');
		document.getElementsByTagName('head')[0].appendChild(manager.icon1);
		manager.currentIcon = manager.icon1;
	};

	manager.onConnectBtnClick = function () {
		manager.nick = $('#nick-input').val();
		if (manager.nick.length == 0) {
			manager.modalDialog('Validation', 'Empty nick not allowed');
			return;
		}

		$('#connect-div').hide();
		$('#connection-process-div').show();

		manager.connection = new Connection();
		manager.connection.onConnect(conHandlers.onConnect);
		manager.connection.onSocketError(conHandlers.onSocketError);
		manager.connection.onDisconnect(conHandlers.onDisconnect);
		manager.connection.onChatRequest(conHandlers.onChatRequest);
		manager.connection.onRsaParams(conHandlers.onRsaParams);
		manager.connection.onSessionKey(conHandlers.onSessionKey);
		manager.connection.onSessionInit(conHandlers.onSessionInit);
		manager.connection.onMessage(conHandlers.onMessage);
		manager.connection.onPartnerDisconnect(conHandlers.onPartnerDisconnect);
	};

	manager.onRandomBtnClick = function () {
		//
		$('#nick-input').val('anon' + Math.floor(100000 + 900000 * Math.random()));
	};

	manager.onChatInviteBtnClick = function () {
		var partnerNick = $('#partner-input').val();
		if (partnerNick.length == 0) {
			manager.modalDialog('Validation', 'Empty nick not allowed');
			return;
		}
		$('#choose-partner-div').hide();
		$('#choose-partner-request-div').show();

		manager.connection.inviteForChatting(
			partnerNick,
			conHandlers.onChatInviteSuccess,
			conHandlers.onChatInviteFailed);
	};

	manager.onAcceptInviteBtnClick = function () {
		manager.connection.acceptInvite();
		clearInterval(manager.timer);
		$('#choose-partner-response-div').hide();
		$('#session-init-div').show();
	};

	manager.onDeclineInviteBtnClick = function () {
		manager.connection.declineInvite();
		clearInterval(manager.timer);
		$('#choose-partner-response-div').hide();
		$('#choose-partner-div').show();
	};

	manager.onTextInputKeyPress = function (e) {
		if (e.which == 13)
			manager.sendMessage();
	};

	manager.onWindowResize = function () {
		if ($('#chat-div').is(':visible'))
			manager.setChatDivHeight();
	};

	manager.onClearAllClick = function () {
		$('#messages-div > div:first').hide();
		$('#messages-div > div:gt(0)').remove();
	};

	manager.onDisconnectClick = function () {
		manager.blinkMessages = [];
		$('#messages-div > div:first').hide();
		$('#messages-div > div:gt(0)').remove();
		manager.connection.close();
	};

	manager.onTerminateSessionClick = function () {
		//
		manager.modalDialog('!', 'Not implemented');
	};

	manager.onKeyPress = function () {
		//
		manager.keyPressed = true;
	};

	manager.addMessage = function (cssClass, title, body, blinked) {
		var msgDiv = manager.messageTemplate.clone();
		msgDiv.removeClass('panel-primary');
		msgDiv.addClass(cssClass);
		msgDiv.find('.panel-title:first').text(title);
		msgDiv.find('.panel-title:last').text(helper.currentDate());
		msgDiv.find('.panel-body').text(body);
		msgDiv.appendTo($('#messages-div'));
		msgDiv.data('date', new Date());
		if (blinked) {
			msgDiv.addClass('blink-message');
			manager.blinkMessages.push(msgDiv);
		}

		// if contains scroll bar
		if ($('#messages-div')[0].scrollHeight > $('#messages-div').height()) {
			$('#messages-div').finish();
			$('#messages-div').animate({ scrollTop: $('#messages-div')[0].scrollHeight }, 400);
		}
	};

	manager.sendMessage = function () {
		var text = $('#text-input-div input').val();
		if (text.length == 0)
			return;
		$('#text-input-div input').val('');
		manager.connection.sendMessage(helper.encrypt(text));
		manager.addMessage('panel-success', manager.nick, text);
	};

	manager.clearBlinkMessages = function () {
		if (manager.keyPressed) {
			if (manager.blinkMessages.length > 0) {
				for (var i = 0; i < manager.blinkMessages.length; i++)
					manager.blinkMessages[i].removeClass('blink-message');
				manager.blinkMessages = [];
				var head = document.getElementsByTagName('head')[0];
				if (manager.currentIcon == manager.icon2) {
					head.removeChild(manager.icon2);
					head.appendChild(manager.icon1);
					manager.currentIcon = manager.icon1;
					document.title = 'zChat';
				}
			}
			manager.keyPressed = false;
		} else
			if (manager.blinkMessages.length > 0) {
				var head = document.getElementsByTagName('head')[0];
				if (manager.currentIcon == manager.icon1) {
					head.removeChild(manager.icon1);
					head.appendChild(manager.icon2);
					manager.currentIcon = manager.icon2;
					document.title = 'New message';
				} else {
					head.removeChild(manager.icon2);
					head.appendChild(manager.icon1);
					manager.currentIcon = manager.icon1;
					document.title = 'zChat';
				}
			}
	};

	manager.clearMessages = function (seconds) {
		var now = new Date();
		$('#messages-div > div:first').hide();
		$('#messages-div > div:gt(0)').each(function () {
			var msgDate = $(this).data('date');
			if (msgDate == undefined || now - msgDate >= seconds * 1000)
				$(this).remove();
		});
	};

	manager.modalDialog = function (title, text) {
		$('#modal-dialog-div .modal-title').text(title);
		$('#modal-dialog-div .modal-body').text(text);		
		$('#modal-dialog-div').modal();
	};

	manager.setChatDivHeight = function () {
		//
		$('#messages-div').css('height', ($(window).height() - 150) + 'px');
	};

	//*******************************************

	conHandlers.onConnect = function () {
		manager.connection.sendNick(manager.nick, function () {
			$('#connection-process-div').hide();
			$('#choose-partner-div').show();
			$('#nick-h4').text('Your nick: ' + manager.nick);
		}, function (msg) {
			manager.connection.close();
			manager.modalDialog('Error while registering nick', msg);
			$('#connection-process-div').hide();
			$('#connect-div').show();
		});
	};

	conHandlers.onSocketError = function () {
		//
		manager.modalDialog('Error', 'WebSocket error');
	};

	conHandlers.onDisconnect = function () {
		$('#connection-process-div').hide();
		$('#choose-partner-div').hide();
		$('#choose-partner-request-div').hide();
		$('#choose-partner-response-div').hide();
		$('#session-init-div').hide();
		$('#chat-div').hide();
		$('#connect-div').show();
		manager.connection = null;
		manager.blinkMessages = [];
	};

	conHandlers.onChatRequest = function (partnerNick) {
		$('#choose-partner-div').hide();
		$('#choose-partner-response-div').show();
		$('#chat-inviting-p').text(partnerNick + ' is inviting you for chatting.');

		var maxTime = 300;
		var startTime = new Date();
		var bar = $('#choose-partner-response-div .progress-bar');
		bar.attr('aria-valuenow', maxTime);
		bar.css('width', '100%');
		var timerFunction = function () {
			var time = maxTime - Math.round((new Date() - startTime) / 100);
			if (time <= 0)
				clearInterval(manager.timer);
			bar.attr('aria-valuenow', time);
			bar.css('width', Math.round(400 * time / maxTime) + 'px');
		};
		manager.timer = setInterval(timerFunction, 100);
	};

	conHandlers.onRsaParams = function (data) {
		var parts = data.split(':');
		var rsaParams = new RSAParameters();
		rsaParams.keyLength = parseInt(parts[0]);
		rsaParams.messageLength = parseInt(parts[1]);
		rsaParams.publicKey = {
			n: BigInt.parse(parts[2], 16),
			e: BigInt.parse(parts[3], 16)
		};

		if (rsaParams.keyLength != 1024)
			throw 'Invalid RSA key length';
		if (rsaParams.messageLength != 32)
			throw 'Invalid message length';

		manager.aesKey = random.SHA2PRNG.getUint8Array(16);
		manager.hmacKey = random.SHA2PRNG.getUint8Array(16);
		var message = new Uint8Array(32);
		message.set(manager.aesKey, 0);
		message.set(manager.hmacKey, 16);

		var data = rsa.encode(message, rsaParams);
		manager.connection.sendSessionKey(bh.byteArrayToHex(data));
	};

	conHandlers.onSessionKey = function (data) {
		var message = rsa.decode(bh.hexToByteArray(data), manager.rsaParams);
		manager.rsaParams = null;
		manager.aesKey = message.subarray(0, 16);
		manager.hmacKey = message.subarray(16, 32);
	};

	conHandlers.onSessionInit = function (partnerNick) {
		manager.partnerNick = partnerNick;
		$('#session-init-div').hide();
		$('#chat-div').show();
		$('#messages-div > div:first').show();
		$('#messages-div > div:gt(0)').remove();
		manager.setChatDivHeight();
	};

	conHandlers.onMessage = function (message) {
		//
		manager.addMessage('panel-warning', manager.partnerNick, helper.decrypt(message), true);
	};

	conHandlers.onPartnerDisconnect = function () {
		$('#choose-partner-request-div').hide();
		$('#choose-partner-response-div').hide();
		$('#session-init-div').hide();
		$('#chat-div').hide();
		$('#choose-partner-div').show();
		manager.modalDialog('Information', 'You partner was disconnected from server');
	};

	// TODO: refactor
	conHandlers.onChatInviteSuccess = function () {
		var maxTime = 300;
		var startTime = new Date();
		var bar = $('#choose-partner-request-div .progress-bar');
		bar.attr('aria-valuenow', maxTime);
		bar.css('width', '100%');
		var gotResponse = false;
		var timerFunction = function () {
			var time = maxTime - Math.round((new Date() - startTime) / 100);
			if (time <= 0) {
				clearInterval(manager.timer);
				$('#choose-partner-request-div').hide();
				$('#choose-partner-div').show();		
				return;
			}
			if (gotResponse) {
				clearInterval(manager.timer);
				return;
			}
			bar.attr('aria-valuenow', time);
			bar.css('width', Math.round(400 * time / maxTime) + 'px');
		};
		manager.timer = setInterval(timerFunction, 100);

		manager.connection.waitForInviteResponse(function () {
			gotResponse = true;

			$('#choose-partner-request-div').hide();
			$('#session-init-div').show();

			manager.rsaParams = rsa.generateParameters(1024, 32);
			manager.connection.sendRsaParams(
				manager.rsaParams.keyLength + ':' +
				manager.rsaParams.messageLength + ':' +
				manager.rsaParams.publicKey.n.toString(16) + ':' +
				manager.rsaParams.publicKey.e.toString(16));
		}, function (msg) {
			gotResponse = true;

			$('#choose-partner-request-div').hide();
			$('#choose-partner-div').show();
			manager.modalDialog('Error while waiting for user response', msg);
		});
	};

	conHandlers.onChatInviteFailed = function (msg) {
		manager.modalDialog('Error while sending chat invitation', msg);
		$('#choose-partner-request-div').hide();
		$('#choose-partner-div').show();
	}

	//*******************************************

	helper.intFormat = function (int) {
		//
		return int < 10 ? '0' + int : int.toString();
	};

	helper.currentDate = function () {
		var date = new Date();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		return helper.intFormat(hours) + ':' + helper.intFormat(minutes) + ':' + helper.intFormat(seconds);
	};

	helper.encrypt = function (text) {
		var bytes = encodings.UTF8.getBytes(text);
		var encBytes = aes.encrypt(bytes, manager.aesKey, paddings.PKCS7);
		return bh.byteArrayToHex(encBytes);
	};

	helper.decrypt = function (text) {
		var bytes = bh.hexToByteArray(text);
		var decBytes = aes.decrypt(bytes, manager.aesKey, paddings.PKCS7);
		return encodings.UTF8.getString(decBytes);
	};

	helper.loadIcon = function (url) {
		var ico = document.createElement('link');
		ico.type = 'image/x-icon';
		ico.rel = 'icon';
		ico.href = url;
		return ico;
	};

	//*******************************************

	manager.pageInit();

});