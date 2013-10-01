(function () {

	window.Connection = function () {
		this._ws = new WebSocket('ws://localhost:89/');
		this._ws.onopen = function () {
			console.log('Socket opened!');
		};
		this._ws.onclose = function (event) {
			if (event.wasClean)
				console.log('Socket closed');
			else
				console.log('Socket closed unexpectedly');
			console.log('Code: ' + event.code + ' Reason: ' + event.reason);
		};
		this._ws.onmessage = function (event) {
			console.log('Got data: ' + event.data);
		};
		this._ws.onerror = function (event) {
			console.log('Error: ' + event.message);
		};
	};

})();