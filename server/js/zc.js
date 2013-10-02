$(function () {

	var con;

	$('#connect-btn').click(function () {
		var nick = $('#nick-input').val();
		if (nick.length == 0) {
			alert('Empty nick not allowed');
			return;
		}

		$('#connect-div').hide();

		con = new Connection();
		con.sendNick(nick);
	});

	$('#random-nick-btn').click(function () {
		$('#nick-input').val('anon' + Math.floor(1000000 * Math.random()));
	});
});