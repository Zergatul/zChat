(function () {

	window.Encoding = function () { };
	window.Encoding.prototype.getBytes = function (str) {
		throw 'Not implemented';
	};
	window.Encoding.prototype.getString = function (bytes) {
		throw 'Not implemented';
	};

	window.encodings = {};
	window.encodings.UTF8 = new Encoding();
	window.encodings.UTF8.getBytes = function (str, BOM) {
		if (typeof str != "string")
			throw 'Invalid parameter';

		var a = new Array();
		if (BOM) {
			a.push(0xef);
			a.push(0xbb);
			a.push(0xbf)
		}

		for (var i = 0; i < str.length; i++) {
			var code = str.charCodeAt(i);
			if (code < 0x80) {
				// 7 bit -> 1 byte
				// 0bbb bbbb
				a.push(code);
			} else if (code < 0x800) {
				// 11 bit -> 2 bytes
				// 110b bbbb 10bb bbbb
				a.push(0xc0 | (code >> 6));
				a.push(0x80 | (code & 0x3f));
			} else if (code < 0x10000) {
				// 16 bit -> 3 bytes
				// 1110b bbbb 10bb bbbb 10bb bbbb
				a.push(0xe0 | (code >> 12));
				a.push(0x80 | ((code >> 6) & 0x3f));
				a.push(0x80 | (code & 0x3f));
			} else
				throw 'Not implemented'
		}

		return new Uint8Array(a);
	};
	window.encodings.UTF8.getString = function (bytes) {
		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameter';

		var result = '';
		var index = 0;
		while (index < bytes.length) {
			var byte = bytes[index++];
			if (byte < 0x80) {
				result += String.fromCharCode(byte);
			} else if (byte >= 0xc0 && byte <= 0xdf) {
				// from [1100 0000] to [1101 1111]
				var byte2 = bytes[index++];
				// byte2 must be [10bb bbbb]
				if (byte2 < 0x80 || byte2 > 0xbf)
					throw 'Invalid data';
				var code = ((byte & 0x1f) << 6) | (byte2 & 0x3f);
				result += String.fromCharCode(code);
			} else if (byte >= 0xe0 && byte <= 0xef) {
				// from [1110 0000] to [1110 1111]
				var byte2 = bytes[index++];
				var byte3 = bytes[index++];
				// byte2, byte3 must be [10bb bbbb]
				if (byte2 < 0x80 || byte2 > 0xbf || byte3 < 0x80 || byte3 > 0xbf)
					throw 'Invalid data';
				var code = ((byte & 0xf) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f);
				result += String.fromCharCode(code);
			} else
				throw 'Invalid data';
		}

		return result;
	};

})();