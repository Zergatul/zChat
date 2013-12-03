$(function () {

	var manager = {};
	var helper = {};
	var conHandlers = {};
	var fileSender = {};

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
		$(document).on('click', manager.onKeyPress);

		// ?
		manager.setupFilesDragAndDrop();

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
		manager.connection.onFileInfo(conHandlers.onFileInfo);
		manager.connection.onBeginDownload(conHandlers.onBeginDownload);
		manager.connection.onRequestFileData(conHandlers.onRequestFileData);
		manager.connection.onFileData(conHandlers.onFileData);
		manager.connection.onEndDownload(conHandlers.onEndDownload);
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
		manager.setDragDiv();
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

	// TODO: refactor
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

	// TODO: refactor
	manager.addFileMessage = function (cssClass, title, fileName, size, blinked) {
		var msgDiv = manager.messageTemplate.clone();
		msgDiv.removeClass('panel-primary');
		msgDiv.addClass(cssClass);
		msgDiv.find('.panel-title:first').text(title);
		msgDiv.find('.panel-title:last').text(helper.currentDate());
		msgDiv.find('.panel-body').empty();
		msgDiv.find('.panel-body').html((blinked ? 'Incoming file' : 'Outcoming file') + ': ' + fileName + ' (' + size + ' bytes)');
		msgDiv.find('.panel-body').append($('<br>'));
		if (blinked) {
			msgDiv.find('.panel-body').append($('<button>')
				.addClass('btn btn-primary')
				.attr('type', 'button')
				.text('Download')
				.click(function () {
					var panel = $(this).closest('div.panel');
					var fileuid = panel.attr('data-fileuid');
					var bar = helper.createProgressBar();
					bar.css('width', '100%');
					bar.css('margin-bottom', '5px');
					$(this).replaceWith(bar);
					fileSender.download(fileuid);
				}));
		}
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

		return msgDiv;
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

	manager.setDragDiv = function () {
		$('#drag-div').outerWidth($(window).width() - 10);
		$('#drag-div').outerHeight($(window).height() - 10);
		$('#drag-over-div').outerWidth($(window).width());
		$('#drag-over-div').outerHeight($(window).height());
	};

	// TODO: refactor
	manager.setupFilesDragAndDrop = function () {
		manager.setDragDiv();

		document.ondragover = function (event) {
			var correctType = false;
			for (var i = 0; i < event.dataTransfer.types.length; i++)
				if (event.dataTransfer.types[i] == 'Files') {
					correctType = true;
					break;
				}
			if (!correctType)
				return;

			event.preventDefault();

			if (!$('#drag-div').is(':visible'))
				$('#drag-div, #drag-over-div').show();

			return false;
		};

		document.ondragleave = function (event) {
			if (event.toElement != document.querySelector('#drag-over-div'))
				return false;

			$('#drag-div, #drag-over-div').hide();

			return false;
		};

		document.ondrop = function (event) {
			$('#drag-div, #drag-over-div').hide();
			if (event.dataTransfer.files.length == 0) {
				event.preventDefault();
				return;
			}

			var file = event.dataTransfer.files[0];
			var reader = new FileReader();
			reader.onload = function (event) {
				var buffer = event.target.result;
				var data = new Uint8Array(buffer);
				fileSender.send(file.name, data);
			};
			reader.readAsArrayBuffer(file);
			
			event.preventDefault();
		};
	};

	//*******************************************

	conHandlers.onConnect = function () {
		manager.connection.sendNick(manager.nick, function () {
			$('#connection-process-div').hide();
			$('#choose-partner-div').show();
			$('#nick-h4').text('Your nick: ' + manager.nick);
		}, function (msg) {
			manager.connection.close();
			manager.modalDialog('Error while registering nick', encodings.UTF8.getString(msg));
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

		manager.aesKey = Random.SHA2PRNG.getUint8Array(16);
		manager.hmacKey = Random.SHA2PRNG.getUint8Array(16);
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
	};

	conHandlers.onFileInfo = function (data) {
		var parts = data.split(':');
		var fileuid = parts[0];
		var fileName = parts[1];
		var size = parseInt(parts[2]);
		var div = manager.addFileMessage('panel-warning', manager.partnerNick, fileName, size, true);
		div.attr('data-fileuid', fileuid);
		fileSender.inFiles[fileuid] = { name: fileName, size: size };
	};

	conHandlers.onBeginDownload = function (fileuid) {
		var panel = $('div.panel[data-fileuid=' + fileuid + ']');
		if (panel.length) {
			var bar = helper.createProgressBar();
			bar.css('style', '100%');
			bar.css('margin-bottom', '5px');
			panel.find('.panel-body').append(bar);
		}
	};

	conHandlers.onRequestFileData = function (data) {
		var parts = data.split(':');
		var fileuid = parts[0];
		var from = parseInt(parts[1]);
		var len = parseInt(parts[2]);
		fileSender.processRequestFileData(fileuid, from, len);
	};

	conHandlers.onFileData = function (data) {
		var parts = data.split(':');
		var fileuid = parts[0];
		var from = parseInt(parts[1]);
		var len = parseInt(parts[2]);
		var data = new Uint8Array(bh.hexToByteArray(parts[3]));
		fileSender.processFileData(fileuid, from, len, data);
	};

	conHandlers.onEndDownload = function (fileuid) {
		var panel = $('div.panel[data-fileuid=' + fileuid + ']');
		if (panel.length)
			panel.find('.progress').replaceWith('Uploaded');
	};

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
		var encryptor = new AES().createEncryptor(manager.aesKey, CipherMode.CBC, paddings.PKCS7, Random.SHA2PRNG);
		return bh.byteArrayToHex(encryptor.process(bytes));
	};

	helper.decrypt = function (text) {
		var bytes = bh.hexToByteArray(text);
		var decryptor = new AES().createDecryptor(manager.aesKey, CipherMode.CBC, paddings.PKCS7, Random.SHA2PRNG);
		return encodings.UTF8.getString(decryptor.process(bytes));
	};

	helper.loadIcon = function (url) {
		var ico = document.createElement('link');
		ico.type = 'image/x-icon';
		ico.rel = 'icon';
		ico.href = url;
		return ico;
	};

	helper.createProgressBar = function () {
		var div = $('<div>')
			.addClass('progress progress-striped active')
			.append($('<div>')
				.addClass('progress-bar')
				.attr('attr', 'progressbar')
				.attr('aria-valuenow', 0)
				.attr('aria-valuemin', 0)
				.attr('aria-valuemax', 100)
				.css('width', '0%'));
		return div;
	};

	//*******************************************

	fileSender.outFiles = {};
	fileSender.inFiles = {};

	fileSender.partSize = 1024;

	fileSender.send = function (name, data) {
		var fileuid = bh.byteArrayToHex(Random.SHA2PRNG.getUint8Array(32));
		manager.connection.sendFileInfo(fileuid, name, data.length);
		var div = manager.addFileMessage('panel-success', manager.nick, name, data.length);
		div.attr('data-fileuid', fileuid);
		fileSender.outFiles[fileuid] = { name: name, size: data.length, data: data };
	};

	fileSender.download = function (fileuid) {
		manager.connection.sendBeginDownload(fileuid);
		var size = fileSender.inFiles[fileuid].size;
		var len = Math.min(fileSender.partSize, size);
		fileSender.inFiles[fileuid].data = new Uint8Array(size);
		manager.connection.sendRequestFileData(fileuid, 0, len);
	};

	fileSender.processRequestFileData = function (fileuid, from, len) {
		var file = fileSender.outFiles[fileuid];
		var data = file.data.subarray(from, from + len);
		manager.connection.sendFileData(fileuid, from, len, data);

		var panel = $('div.panel[data-fileuid=' + fileuid + ']');
		if (panel.length) {
			panel.find('.progress-bar').css('width', Math.round(100 * (from + len) / file.size) + '%');
		}
	};

	fileSender.processFileData = function (fileuid, from, len, data) {
		var file = fileSender.inFiles[fileuid];
		file.data.set(data, from);

		if (from + len < file.size) {
			var newLen = Math.min(fileSender.partSize, file.size - (from + len));
			manager.connection.sendRequestFileData(fileuid, from + len, newLen);
		} else
			manager.connection.sendEndDownload(fileuid);

		var panel = $('div.panel[data-fileuid=' + fileuid + ']');
		if (panel.length) {
			panel.find('.progress-bar').css('width', Math.round(100 * (from + len) / file.size) + '%');
			if (from + len == file.size)
				panel.find('.progress')
					.replaceWith($('<button>')
						.addClass('btn btn-primary')
						.attr('type', 'button')
						.text('Save...')
						.click(function () {
							var panel = $(this).closest('div.panel');
							var fileuid = panel.attr('data-fileuid');
							var file = fileSender.inFiles[fileuid];
							var blob = new Blob([file.data], { type: 'application/octet-binary' });
							saveAs(blob, file.name);
						}));
		}
	};

	//*******************************************

	manager.pageInit();

});