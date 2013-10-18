$(function () {

	var connection;
	var timer;
	var nick, partnerNick;

	window.secretKey = [201, 120, 8, 17, 30, 41, 109, 93, 196, 252, 55, 250, 36, 16, 101, 144];

	$('#connect-btn').click(function () {
		nick = $('#nick-input').val();
		if (nick.length == 0) {
			alert('Empty nick not allowed');
			return;
		}

		$('#connect-div').hide();
		$('#connection-process-div').show();

		connection = new Connection();

		connection.onConnect(function () {
			connection.sendNick(nick, function () {
				$('#connection-process-div').hide();
				$('#choose-partner-div').show();
				$('#nick-h4').text('Your nick: ' + nick);
			}, function (msg) {
				connection.close();
				alert(msg);
				$('#connection-process-div').hide();
				$('#connect-div').show();
			});
		});

		connection.onChatRequest(function (partnerNick) {
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
					clearInterval(timer);
				bar.attr('aria-valuenow', time);
				bar.css('width', Math.round(400 * time / maxTime) + 'px');
			};
			timer = setInterval(timerFunction, 100);
		});

		connection.onSessionInit(function (_partnerNick) {
			partnerNick = _partnerNick;
			$('#session-init-div').hide();
			$('#chat-div').show();
			setChatDivHeight();
		});

		connection.onMessage(function (message) {
			addMessage('panel-warning', partnerNick, decrypt(message));
		});
	});

	var addMessage = function (cssClass, title, body) {
		var msgDiv = $('#messages-div > div:first').clone();
		msgDiv.removeClass('panel-primary');
		msgDiv.addClass(cssClass);
		msgDiv.find('.panel-title').text(title);
		msgDiv.find('.panel-body').text(body);
		msgDiv.appendTo($('#messages-div'));

		// if contains scroll bar
		if ($('#messages-div')[0].scrollHeight > $('#messages-div').height()) {
			$('#messages-div').finish();
			$('#messages-div').animate({ scrollTop: $('#messages-div')[0].scrollHeight }, 400);
		}
	};

	$('#random-nick-btn').click(function () {
		$('#nick-input').val('anon' + Math.floor(100000 + 900000 * Math.random()));
	});

	$('#chat-invite-btn').click(function () {
		partnerNick = $('#partner-input').val();
		if (partnerNick.length == 0) {
			alert('Empty nick not allowed');
			return;
		}
		$('#choose-partner-div').hide();
		$('#choose-partner-request-div').show();

		connection.inviteForChatting(partnerNick, function () {
			var maxTime = 300;
			var startTime = new Date();
			var bar = $('#choose-partner-request-div .progress-bar');
			bar.attr('aria-valuenow', maxTime);
			bar.css('width', '100%');
			var gotResponse = false;
			var timerFunction = function () {
				var time = maxTime - Math.round((new Date() - startTime) / 100);
				if (time <= 0) {
					clearInterval(timer);
					$('#choose-partner-request-div').hide();
					$('#choose-partner-div').show();		
					return;
				}
				if (gotResponse) {
					clearInterval(timer);
					return;
				}
				bar.attr('aria-valuenow', time);
				bar.css('width', Math.round(400 * time / maxTime) + 'px');
			};
			timer = setInterval(timerFunction, 100);

			connection.waitForInviteResponse(function () {
				gotResponse = true;

				$('#choose-partner-request-div').hide();
				$('#session-init-div').show();
			}, function (msg) {
				gotResponse = true;

				$('#choose-partner-request-div').hide();
				$('#choose-partner-div').show();
				alert(msg);
			});
		}, function (msg) {
			alert(msg);
			$('#choose-partner-request-div').hide();
			$('#choose-partner-div').show();
		});
	});

	$('#accept-invite-btn').click(function () {
		connection.acceptInvite();
		clearInterval(timer);
		$('#choose-partner-response-div').hide();
		$('#session-init-div').show();
	});

	$('#decline-invite-btn').click(function () {
		connection.declineInvite();
		clearInterval(timer);
		$('#choose-partner-response-div').hide();
		$('#choose-partner-div').show();
	});

	var sendMessage = function () {
		var text = $('#text-input-div input').val();
		if (text.length == 0)
			return;
		$('#text-input-div input').val('');
		connection.sendMessage(encrypt(text));
		addMessage('panel-success', nick, text);
	}

	$('#send-btn').click(sendMessage);

	$('#text-input-div input').on('keypress', function (e) {
		if (e.which == 13)
			sendMessage();
	});

	var encrypt = function (text) {
		var bytes = bh.stringToByteArray(text + '.');
		bh.paddings.zero.pad(bytes, 16);
		var encBytes = [];
		while (bytes.length != 0) {
			var block = bytes.splice(0, 16);
			encBytes = encBytes.concat(aes.encrypt(block, window.secretKey));
		}
		return bh.byteArrayToHex(encBytes);
	};

	var decrypt = function (text) {
		var bytes = bh.hexToByteArray(text);
		var decBytes = [];
		while (bytes.length != 0) {
			var block = bytes.splice(0, 16);
			decBytes = decBytes.concat(aes.decrypt(block, window.secretKey));
		}
		bh.paddings.zero.unpad(decBytes);
		return bh.byteArrayToString(decBytes);
	};

	var setChatDivHeight = function () {
		$('#messages-div').css('height', ($(window).height() - 140) + 'px');
	};

	$(window).resize(function () {
		if ($('#chat-div').is(':visible'))
			setChatDivHeight();
	});

});