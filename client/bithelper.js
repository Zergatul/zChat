(function () {

	window.bh = {};

	window.bh.getByteArray = function (data) {
		var bytes;
		if (typeof data == 'string') {
			bytes = [];
			for (var i = 0; i < data.length; i++)
				bytes.push(data.charCodeAt(i) % 256);
		} else if (data instanceof Array) {
			for (var i = 0; i < data.length; i++)
				if (data[i] < 0 || data > 255)
					throw 'Invalid array';
			bytes = data;
		} else
			throw 'Invalid parameter type';

		return bytes;
	};

	window.bh.padding = function (bytes) {
		bytes.push(0x80);
		while (bytes.length % 64 != 56)
			bytes.push(0)
	};

	window.bh.rotateLeft = function (val, count) {
		return (val << count) | (val >>> (32 - count));
	};

	window.bh.rotateRight = function (val, count) {
		return (val << (32 - count)) | (val >>> count);
	};

	window.bh.bytesToIntLE = function (bytes, from) {
		var result = 0;
		result |= bytes[from];
		result |= bytes[from + 1] << 8;
		result |= bytes[from + 2] << 16;
		result |= bytes[from + 3] << 24;
		return result;
	};

	window.bh.intToBytesLE = function (num) {
		return [
			num & 0xff,
			(num >>> 8) & 0xff,
			(num >>> 16) & 0xff,
			(num >>> 24) & 0xff
		];
	};

	window.bh.intToBytesBE = function (num) {
		return [
			(num >>> 24) & 0xff,			
			(num >>> 16) & 0xff,
			(num >>> 8) & 0xff,
			num & 0xff
		];
	};

	window.bh.byteArrayToHex = function (arr) {
		return arr.map(function (byte) {
			return byte < 16 ? '0' + byte.toString(16) : byte.toString(16);
		}).join('');
	};

	var hexChars = [];
	for (var i = 0; i < 16; i++)
		hexChars.push(i.toString(16).toUpperCase());

	window.bh.hexToByteArray = function (str) {
		if (typeof str != 'string')
			throw 'Invalid parameter';
		if (str.length % 2 == 1)
			throw 'Invalid string';

		var bytes = [];
		for (var i = 0; i < str.length / 2; i++) {
			var byteStr = str.substring(i * 2, i * 2 + 2).toUpperCase();
			if (hexChars.indexOf(byteStr.charAt(0)) == -1 || hexChars.indexOf(byteStr.charAt(1)) == -1)
				throw 'Invalid symbol';
			var byte = parseInt(byteStr, 16);
			bytes.push(byte);
		}

		return bytes;
	};

})();