$(function () {

	var manager = {};
	var helper = {};
	var conHandlers = {};
	var fileSender = {};

	manager.pageInit = function () {
		// setup handlers
		$('#connect-btn').click(manager.onConnectBtnClick);
		$('#random-nick-btn').click(manager.onRandomBtnClick);
		$('#chat-invite-btn').click(manager.onChatInviteBtnClick);
		$('#rnd-pwd-btn').click(manager.onRandomPasswordClick);
		$('#accept-invite-btn').click(manager.onAcceptInviteBtnClick);
		$('#decline-invite-btn').click(manager.onDeclineInviteBtnClick);
		$('#send-btn').click(manager.sendMessage);
		$('#text-input-div input').on('keypress', manager.onTextInputKeyPress);
		$(window).resize(manager.onWindowResize);
		$('#clear-all-link').click(manager.onClearAllClick);
		$('#send-file-link').click(manager.onSendFileClick);
		$('#disconnect-link').click(manager.onDisconnectClick);
		$('#terminate-session-link').click(manager.onTerminateSessionClick);
		$(document).on('keypress', manager.onKeyPress);
		$(document).on('click', manager.onKeyPress);
		$('.z-file-input > button').click(manager.onChooseFileClick);
		$('.z-file-input > input[type=file]').change(manager.onFileInputChange);
		$('#send-file-btn').click(manager.onSendFileBtnClick);

		// ?
		manager.setupFilesDragAndDrop();

		// setup tooltips
		$('[rel=tooltip]').tooltip();

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
			manager.modalDialog('Validation', 'Empty nick not allowed', true);
			return;
		}

		$('#connect-div').addClass('z-hidden');
		$('#connection-process-div').removeClass('z-hidden');

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
		manager.connection.onChatInviteTimeout(conHandlers.onChatInviteTimeout);
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
		$('#choose-partner-div').addClass('z-hidden');
		$('#choose-partner-request-div').removeClass('z-hidden');

		manager.cryptoParams = {
			rsaKeyLength: manager.getRsaKeyLength(),
			aesKeyLength: manager.getAesKeyLength(),
			withPwd: $('#use-pwd-chb').is(':checked')
		};

		manager.connection.inviteForChatting(
			partnerNick,
			manager.cryptoParams.rsaKeyLength,
			manager.cryptoParams.aesKeyLength,
			manager.cryptoParams.withPwd,
			conHandlers.onChatInviteSuccess,
			conHandlers.onChatInviteFailed);
	};

	manager.getRsaKeyLength = function () {
		if ($('#rsa-1024-rb').is(':checked'))
			return 1024;
		if ($('#rsa-1536-rb').is(':checked'))
			return 1536;
		if ($('#rsa-2048-rb').is(':checked'))
			return 2048;
	};

	manager.getAesKeyLength = function () {
		if ($('#aes-128-rb').is(':checked'))
			return 128;
		if ($('#aes-196-rb').is(':checked'))
			return 196;
		if ($('#aes-256-rb').is(':checked'))
			return 256;
	};

	manager.onRandomPasswordClick = function () {
		var symbols = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
		var pwd = '';
		for (var i = 0; i < 48; i++)
			pwd += symbols.charAt(Random.SHA2PRNG.nextBefore(symbols.length));
		$('#pwd-input').val(pwd);
	};

	manager.onAcceptInviteBtnClick = function () {
		manager.connection.acceptInvite();
		clearInterval(manager.timer);
		$('#choose-partner-response-div').addClass('z-hidden');
		$('#session-init-div').removeClass('z-hidden');
	};

	manager.onDeclineInviteBtnClick = function () {
		manager.connection.declineInvite();
		clearInterval(manager.timer);
		$('#choose-partner-response-div').addClass('z-hidden');
		$('#choose-partner-div').removeClass('z-hidden');
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
		$('#messages-div').empty();
	};

	manager.onChooseFileClick = function () {
		//
		$('.z-file-input > input[type=file]').click();
	};

	manager.onFileInputChange = function () {
		var file = $(this).val();
		$('.z-file-input > span').text(file);
		if (file == '')
			$('#send-file-btn').attr('disabled', true);
		else
			$('#send-file-btn').removeAttr('disabled');
	};

	manager.onSendFileBtnClick = function () {
		var file = $('.z-file-input > input[type=file]')[0].files[0];
		var reader = new FileReader();
		reader.onload = function (event) {
			var buffer = event.target.result;
			var data = new Uint8Array(buffer);
			fileSender.send(file.name, data);
		};
		reader.readAsArrayBuffer(file);

		$('#send-file-dialog-div').modal('hide');
	};

	manager.onSendFileClick = function () {
		$('#send-file-dialog-div').modal({ backdrop: 'static', keyboard: true });
	};

	manager.onDisconnectClick = function () {
		manager.blinkMessages = [];
		$('#messages-div > div:first').addClass('z-hidden');
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
		var isScrolled = manager.isChatWindowScrolledToBottom();

		var msgDiv = $('#text-message-template').clone();
		msgDiv.removeClass('z-hidden');
		msgDiv.removeAttr('id');
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

		if (isScrolled)
			manager.scrollChatWindow();
	};

	// TODO: refactor
	manager.addFileMessage = function (cssClass, title, fileName, size, blinked, data) {
		var isScrolled = manager.isChatWindowScrolledToBottom();

		var msgDiv = $('#file-message-template').clone();
		msgDiv.removeClass('z-hidden');
		msgDiv.removeAttr('id');
		msgDiv.addClass(cssClass);
		msgDiv.find('.panel-title:first').text(title);
		msgDiv.find('.panel-title:last').text(helper.currentDate());
		
		msgDiv.find('span.z-file-label:first').text(fileName);
		msgDiv.find('span.z-file-label:last').text(manager.fileSizeToString(size));

		if (data != undefined) {
			var sha1 = bh.byteArrayToHex(new HashAlgorithm.SHA1().computeHash(data));
			msgDiv.find('span[data-hash=sha1]').text(sha1);
			var md5 = bh.byteArrayToHex(new HashAlgorithm.MD5().computeHash(data));
			msgDiv.find('span[data-hash=md5]').text(md5);
		} else {
			msgDiv.find('span[data-hash=sha1]').parent().addClass('z-hidden');
			msgDiv.find('span[data-hash=md5]').parent().addClass('z-hidden');
		}

		if (blinked)
			msgDiv.find('button')
				.click(function () {
					var panel = $(this).closest('div.panel');
					var fileuid = bh.hexToByteArray(panel.attr('data-fileuid'));
					var bar = helper.createNonAnimatedProgressBar();
					bar.css('width', '100%');
					bar.css('margin-bottom', '5px');
					var isScrolled = manager.isChatWindowScrolledToBottom();
					$(this).replaceWith(bar);
					if (isScrolled)
						manager.scrollChatWindow();
					fileSender.download(fileuid);
				});
		else
			msgDiv.find('button').addClass('z-hidden');

		msgDiv.appendTo($('#messages-div'));
		msgDiv.data('date', new Date());
		if (blinked) {
			msgDiv.addClass('blink-message');
			manager.blinkMessages.push(msgDiv);
		}

		if (isScrolled)
			manager.scrollChatWindow();

		return msgDiv;
	};

	manager.scrollChatWindow = function () {
		if ($('#messages-div')[0].scrollHeight > $('#messages-div').height()) {
			$('#messages-div').finish();
			$('#messages-div').animate({ scrollTop: $('#messages-div')[0].scrollHeight }, 400);
		}
	};

	manager.isChatWindowScrolledToBottom = function () {
		return ($('#messages-div')[0].scrollHeight <= $('#messages-div').height()) ||
			($('#messages-div').scrollTop() + $('#messages-div').height() == $('#messages-div')[0].scrollHeight);
	};

	manager.fileSizeToString = function (size) {
		if (size < 1024)
			return size + 'b';
		if (size < 1024 * 1024)
			return (size / 1024).toFixed(2) + 'Kb';
		return (size / 1024 / 1024)	.toFixed(2) + 'Mb';
	};

	manager.sendMessage = function () {
		var text = $('#text-input-div input').val();
		if (text.length == 0)
			return;
		$('#text-input-div input').val('');
		var bytes = encodings.UTF8.getBytes(text)
		manager.connection.sendMessage(helper.encrypt(bytes));
		manager.addMessage('z-panel-my-msg', manager.nick, text);
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

	manager.modalDialog = function (title, inner, allowEsc) {
		$('#modal-dialog-div .modal-title').text(title);
		$('#modal-dialog-div .modal-body').empty().append(inner);		
		$('#modal-dialog-div').modal({ backdrop: 'static', keyboard: allowEsc });
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
			if (!$('#chat-div').is(':visible'))
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
			$('#connection-process-div').addClass('z-hidden');
			$('#choose-partner-div').removeClass('z-hidden');
			$('#nick-h4').text('Your nick: ' + manager.nick);
		}, function (msg) {
			manager.connection.close();
			manager.modalDialog('Error while registering nick', encodings.UTF8.getString(msg));
			$('#connection-process-div').addClass('z-hidden');
			$('#connect-div').removeClass('z-hidden');
		});
	};

	conHandlers.onSocketError = function () {
		//
		manager.modalDialog('Error', 'WebSocket error');
	};

	conHandlers.onDisconnect = function () {
		$('#connection-process-div').addClass('z-hidden');
		$('#choose-partner-div').addClass('z-hidden');
		$('#choose-partner-request-div').addClass('z-hidden');
		$('#choose-partner-response-div').addClass('z-hidden');
		$('#session-init-div').addClass('z-hidden');
		$('#chat-div').addClass('z-hidden');
		$('#connect-div').removeClass('z-hidden');
		manager.connection = null;
		manager.blinkMessages = [];
	};

	conHandlers.onChatRequest = function (data) {
		var br = new BinaryReader(data);
		var len = br.readInt32();
		var partnerNick = encodings.UTF8.getString(br.readBytes(len));
		var rsaKeyLength = br.readInt32();
		var aesKeyLength = br.readInt32();
		var withPwd = br.readByte() != 0;

		manager.cryptoParams = {
			rsaKeyLength: rsaKeyLength,
			aesKeyLength: aesKeyLength,
			withPwd: withPwd
		};

		$('#choose-partner-div').addClass('z-hidden');
		$('#choose-partner-response-div').removeClass('z-hidden');
		$('#chat-inviting-p').text(partnerNick + ' is inviting you for chatting.');
		$('#chat-inviting-p').next().find('ul > li:eq(0) > span').text(rsaKeyLength);
		$('#chat-inviting-p').next().find('ul > li:eq(1) > span').text(aesKeyLength);
		$('#chat-inviting-p').next().find('ul > li:eq(2) > span').text(withPwd ? 'Yes' : 'No');

		$('#invite-pwd-input').val('');
		if (withPwd)
			$('#invite-pwd-input').parent().removeClass('z-hidden');
		else
			$('#invite-pwd-input').parent().addClass('z-hidden');

		var maxTime = 300;
		var startTime = new Date();
		var bar = $('#choose-partner-response-div .progress-bar');
		bar.attr('aria-valuenow', maxTime);
		var width = bar.parent().width();
		bar.css('width', width + 'px');
		var timerFunction = function () {
			var time = maxTime - Math.round((new Date() - startTime) / 100);
			if (time <= 0) {
				clearInterval(manager.timer);
				return;
			}
			bar.attr('aria-valuenow', time);
			bar.css('width', Math.round(width * time / maxTime) + 'px');
		};
		manager.timer = setInterval(timerFunction, 100);
	};

	conHandlers.onChatInviteTimeout = function () {
		clearInterval(manager.timer);
		manager.modalDialog('Chat inviting timeout', 'User did not provide any response.');
		$('#choose-partner-div').removeClass('z-hidden');
		$('#choose-partner-response-div').addClass('z-hidden');
		$('#choose-partner-request-div').addClass('z-hidden');
	};

	conHandlers.onRsaParams = function (data) {
		var br = new BinaryReader(data);
		var rsaParams = new RSAParameters();
		rsaParams.keyLength = br.readInt32();
		rsaParams.messageLength = br.readInt32();
		rsaParams.publicKey = {
			n: BigInt.fromUint8Array(br.readBytes(br.readInt32())),
			e: BigInt.fromUint8Array(br.readBytes(br.readInt32()))
		};

		if (rsaParams.keyLength != manager.cryptoParams.rsaKeyLength)
			throw 'Invalid RSA key length';
		if (rsaParams.messageLength != manager.cryptoParams.aesKeyLength / 8 + 32)
			throw 'Invalid message length';

		manager.aesKey = Random.SHA2PRNG.getUint8Array(manager.cryptoParams.aesKeyLength / 8);
		manager.hmacKey = Random.SHA2PRNG.getUint8Array(32);
		var message = new Uint8Array(rsaParams.messageLength);
		message.set(manager.aesKey, 0);
		message.set(manager.hmacKey, manager.cryptoParams.aesKeyLength / 8);

		var data = rsa.encode(message, rsaParams);
		manager.connection.sendSessionKey(data);
	};

	conHandlers.onSessionKey = function (data) {
		var message = rsa.decode(data, manager.rsaParams);
		manager.rsaParams = null;
		manager.aesKey = message.subarray(0, manager.cryptoParams.aesKeyLength / 8);
		manager.hmacKey = message.subarray(manager.cryptoParams.aesKeyLength / 8, manager.cryptoParams.aesKeyLength / 8 + 32);
	};

	conHandlers.onSessionInit = function (data) {
		manager.partnerNick = encodings.UTF8.getString(data);
		$('#session-init-div').addClass('z-hidden');
		$('#chat-div').removeClass('z-hidden');
		$('#messages-div').empty();
		$('#text-input-div').find('button').removeAttr('disabled');
		$('#chat-div').find('input[type=text]').removeAttr('disabled');
		manager.addMessage('panel-primary', 'Welcome!', 'Chat session begins.');
		manager.setChatDivHeight();
	};

	conHandlers.onMessage = function (data) {
		var text = encodings.UTF8.getString(helper.decrypt(data));
		manager.addMessage('z-panel-partner-msg', manager.partnerNick, text, true);
	};

	conHandlers.onPartnerDisconnect = function () {
		var isScrolled = manager.isChatWindowScrolledToBottom();

		var msgDiv = $('#end-session-message-template').clone();
		msgDiv.removeAttr('id').removeClass('z-hidden');
		msgDiv.find('.panel-title:first').text('Your partner was disconnected from server');
		msgDiv.find('.panel-title:last').text(helper.currentDate());
		msgDiv.find('button').click(function () {
			$('#choose-partner-request-div').addClass('z-hidden');
			$('#choose-partner-response-div').addClass('z-hidden');
			$('#session-init-div').addClass('z-hidden');
			$('#chat-div').addClass('z-hidden');
			$('#choose-partner-div').removeClass('z-hidden');
		});
		msgDiv.appendTo($('#messages-div'));

		$('#text-input-div').find('button').attr('disabled', true);
		$('#chat-div').find('input[type=text]').attr('disabled', true);

		if (isScrolled)
			manager.scrollChatWindow();
	};

	// TODO: refactor
	conHandlers.onChatInviteSuccess = function () {
		var maxTime = 300;
		var startTime = new Date();
		var bar = $('#choose-partner-request-div .progress-bar');
		bar.attr('aria-valuenow', maxTime);
		var width = bar.parent().width();
		bar.css('width', width + 'px');
		var gotResponse = false;
		var timerFunction = function () {
			var time = maxTime - Math.round((new Date() - startTime) / 100);
			if (time <= 0) {
				clearInterval(manager.timer);
				return;
			}
			if (gotResponse) {
				clearInterval(manager.timer);
				return;
			}
			bar.attr('aria-valuenow', time);
			bar.css('width', Math.round(width * time / maxTime) + 'px');
		};
		manager.timer = setInterval(timerFunction, 100);

		manager.connection.waitForInviteResponse(function () {
			gotResponse = true;

			$('#choose-partner-request-div').addClass('z-hidden');
			$('#session-init-div').removeClass('z-hidden');

			manager.rsaParams = rsa.generateParameters(
				manager.cryptoParams.rsaKeyLength,
				manager.cryptoParams.aesKeyLength / 8 + 32);
			manager.connection.sendRsaParams(
				manager.rsaParams.keyLength,
				manager.rsaParams.messageLength,
				manager.rsaParams.publicKey.n,
				manager.rsaParams.publicKey.e);
		}, function (data) {
			gotResponse = true;

			$('#choose-partner-request-div').addClass('z-hidden');
			$('#choose-partner-div').removeClass('z-hidden');
			manager.modalDialog('Error while waiting for user response', encodings.UTF8.getString(data));
		});
	};

	conHandlers.onChatInviteFailed = function (data) {
		manager.modalDialog('Error while sending chat invitation', encodings.UTF8.getString(data));
		$('#choose-partner-request-div').addClass('z-hidden');
		$('#choose-partner-div').removeClass('z-hidden');
	};

	conHandlers.onFileInfo = function (data) {
		var br = new BinaryReader(helper.decrypt(data));
		var fileuid = br.readBytes(br.readInt32());
		var fileName = encodings.UTF8.getString(br.readBytes(br.readInt32()));
		var size = br.readInt32();

		var fileuidHex = bh.byteArrayToHex(fileuid);
		var div = manager.addFileMessage('z-panel-partner-msg', manager.partnerNick, fileName, size, true);
		div.attr('data-fileuid', fileuidHex);
		fileSender.inFiles[fileuidHex] = { name: fileName, size: size };
	};

	conHandlers.onBeginDownload = function (data) {
		var fileuid = helper.decrypt(data);
		var fileuidHex = bh.byteArrayToHex(fileuid);
		var panel = $('div.panel[data-fileuid=' + fileuidHex + ']');
		if (panel.length) {
			var isScrolled = manager.isChatWindowScrolledToBottom();
			var bar = helper.createNonAnimatedProgressBar();
			bar.css('style', '100%');
			bar.css('margin-bottom', '5px');
			panel.find('.panel-body').append(bar);
			if (isScrolled)
				manager.scrollChatWindow();
		}
	};

	conHandlers.onRequestFileData = function (data) {
		var br = new BinaryReader(helper.decrypt(data));
		var fileuid = br.readBytes(br.readInt32());
		var from = br.readInt32();
		var len = br.readInt32();

		fileSender.processRequestFileData(fileuid, from, len);
	};

	conHandlers.onFileData = function (data) {
		var br = new BinaryReader(helper.decrypt(data));
		var fileuid = br.readBytes(br.readInt32());
		var from = br.readInt32();
		var len = br.readInt32();
		var data = br.readBytes(len);

		fileSender.processFileData(fileuid, from, len, data);
	};

	conHandlers.onEndDownload = function (data) {
		var fileuid = helper.decrypt(data);
		var fileuidHex = bh.byteArrayToHex(fileuid);
		var panel = $('div.panel[data-fileuid=' + fileuidHex + ']');
		if (panel.length)
			panel.find('.progress').remove();
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

	helper.encrypt = function (bytes) {
		var encryptor = new AES().createEncryptor(manager.aesKey, CipherMode.CBC, paddings.PKCS7, Random.SHA2PRNG);
		return encryptor.process(bytes);
	};

	helper.decrypt = function (bytes) {
		var decryptor = new AES().createDecryptor(manager.aesKey, CipherMode.CBC, paddings.PKCS7, Random.SHA2PRNG);
		return decryptor.process(bytes);
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

	helper.createNonAnimatedProgressBar = function () {
		var div = helper.createProgressBar();
		div.find('div').addClass('z-simple-progress');
		return div;
	};

	//*******************************************

	fileSender.outFiles = {};
	fileSender.inFiles = {};

	fileSender.partSize = 1024;

	fileSender.send = function (name, data) {
		var fileuid = Random.SHA2PRNG.getUint8Array(32);
		var bw = new BinaryWriter();
		bw.writeInt32(fileuid.length);
		bw.writeBytes(fileuid);
		var nameBytes = encodings.UTF8.getBytes(name);
		bw.writeInt32(nameBytes.length);
		bw.writeBytes(nameBytes);
		bw.writeInt32(data.length);
		manager.connection.sendFileInfo(helper.encrypt(bw.toUint8Array()));
		
		var fileuidHex = bh.byteArrayToHex(fileuid);
		var div = manager.addFileMessage('z-panel-my-msg', manager.nick, name, data.length, false, data);
		div.attr('data-fileuid', fileuidHex);
		fileSender.outFiles[fileuidHex] = { name: name, size: data.length, data: data };
	};

	fileSender.download = function (fileuid) {
		var fileuidHex = bh.byteArrayToHex(fileuid);
		manager.connection.sendBeginDownload(helper.encrypt(fileuid));
		var size = fileSender.inFiles[fileuidHex].size;
		var len = Math.min(fileSender.partSize, size);
		fileSender.inFiles[fileuidHex].data = new Uint8Array(size);

		var bw = new BinaryWriter();
		bw.writeInt32(fileuid.length);
		bw.writeBytes(fileuid);
		bw.writeInt32(0);
		bw.writeInt32(len);
		manager.connection.sendRequestFileData(helper.encrypt(bw.toUint8Array()));
	};

	fileSender.processRequestFileData = function (fileuid, from, len) {
		var fileuidHex = bh.byteArrayToHex(fileuid);
		var file = fileSender.outFiles[fileuidHex];
		var data = file.data.subarray(from, from + len);
		var bw = new BinaryWriter();
		bw.writeInt32(fileuid.length);
		bw.writeBytes(fileuid);
		bw.writeInt32(from);
		bw.writeInt32(len);
		bw.writeBytes(data);
		manager.connection.sendFileData(helper.encrypt(bw.toUint8Array()));

		var panel = $('div.panel[data-fileuid=' + fileuidHex + ']');
		if (panel.length) {
			panel.find('.progress-bar').css('width', Math.round(100 * (from + len) / file.size) + '%');
		}
	};

	fileSender.processFileData = function (fileuid, from, len, data) {
		var fileuidHex = bh.byteArrayToHex(fileuid);
		var file = fileSender.inFiles[fileuidHex];
		file.data.set(data, from);

		if (from + len < file.size) {
			var newLen = Math.min(fileSender.partSize, file.size - (from + len));
			var bw = new BinaryWriter();
			bw.writeInt32(fileuid.length);
			bw.writeBytes(fileuid);
			bw.writeInt32(from + len);
			bw.writeInt32(newLen);
			manager.connection.sendRequestFileData(helper.encrypt(bw.toUint8Array()));
		} else
			manager.connection.sendEndDownload(helper.encrypt(fileuid));

		var panel = $('div.panel[data-fileuid=' + fileuidHex + ']');
		if (panel.length) {
			panel.find('.progress-bar').css('width', Math.round(100 * (from + len) / file.size) + '%');
			if (from + len == file.size) {
				var isScrolled = manager.isChatWindowScrolledToBottom();
				var sha1 = bh.byteArrayToHex(new HashAlgorithm.SHA1().computeHash(file.data));
				panel.find('span[data-hash=sha1]').text(sha1).parent().removeClass('z-hidden');
				var md5 = bh.byteArrayToHex(new HashAlgorithm.MD5().computeHash(file.data));
				panel.find('span[data-hash=md5]').text(md5).parent().removeClass('z-hidden');
				panel.find('.progress')
					.replaceWith($('<button>')
						.addClass('btn btn-primary')
						.attr('type', 'button')
						.text('Save...')
						.click(function () {
							var panel = $(this).closest('div.panel');
							var fileuidHex = panel.attr('data-fileuid');
							var file = fileSender.inFiles[fileuidHex];
							var blob = new Blob([file.data], { type: 'application/octet-binary' });
							saveAs(blob, file.name);
						}));
				if (isScrolled)
					manager.scrollChatWindow();
			}
		}
	};

	//*******************************************

	manager.pageInit();

});