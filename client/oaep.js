(function () {

	if (sha2 == undefined)
		throw 'sha2.js not loaded';

	window.oaep = {};

	window.oaep.encrypt = function (aesKey, rsaKeyLength) {
		if (rsaKeyLength == undefined || !(aesKey instanceof Array))
			throw 'Invalid parameter';
		if (rsaKeyLength % 8 != 0)
			throw 'Invalid RSA key length';
		if (rsaKeyLength < 512)
			throw 'RSA key length must be at least 512 bit';
		if (aesKey.length != 16)
			throw 'Only AES-128 supported';

		var bytesLength = rsaKeyLength / 8;
		var bytes = new Array(bytesLength);
		aesKey = bh.getByteArray(aesKey);
		var i;
		for (i = 0; i < 16; i++) {
			if (aesKey[i] < 0 || aesKey[i] > 255)
				throw 'Invalid key data';
			bytes[i] = aesKey[i];
		}
		while (i < 32)
			bytes[i++] = 0;
		while (i < bytesLength)
			bytes[i++] = Math.floor(256 * Math.random());

		var rightPart = new Array(bytesLength - 32);
		for (i = 0; i < rightPart.length; i++)
			rightPart[i] = bytes[i + 32];
		var h = sha2(rightPart, 256);
		for (i = 0; i < 32; i++)
			bytes[i] = bytes[i] ^ h[i];

		var leftPart = new Array(32);
		for (i = 0; i < 32; i++)
			leftPart[i] = bytes[i];		
		var g = sha2(leftPart, 256);
		for (i = 32; i < bytesLength; i++)
			bytes[i] = bytes[i] ^ g[(i - 32) % 32];

		return bytes;
	};

	window.oaep.decrypt = function (bytes) {
		if (!(bytes instanceof Array))
			throw 'Invalid argument';
		if (bytes.length < 64)
			throw 'Array length must be at least 64 bytes';
		var bytesLength = bytes.length;
		var buf = new Array(bytesLength);
		for (var i = 0; i < bytesLength; i++) {
			if (bytes[i] < 0 || bytes[i] > 255)
				throw 'Invalid data';
			buf[i] = bytes[i];
		}
		bytes = buf;

		var leftPart = new Array(32);
		for (var i = 0; i < 32; i++)
			leftPart[i] = bytes[i];
		var g = sha2(leftPart, 256);
		for (var i = 32; i < bytesLength; i++)
			bytes[i] = bytes[i] ^ g[(i - 32) % 32];

		var rightPart = new Array(bytesLength - 32);
		for (var i = 0; i < rightPart.length; i++)
			rightPart[i] = bytes[i + 32];
		var h = sha2(rightPart, 256);
		for (i = 0; i < 32; i++)
			bytes[i] = bytes[i] ^ h[i];

		for (var i = 16; i < 32; i++)
			if (bytes[i] != 0)
				return 'Decryption error';

		var result = new Array(16);
		for (var i = 0; i < 16; i++)
			result[i] = bytes[i];
		return result;
	};

})();