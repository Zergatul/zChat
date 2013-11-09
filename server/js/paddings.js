(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	window.Padding = function () { };
	// bytes - instance of Uint8Array
	// multiplicity - number
	// random - instance if Random
	// returns Uint8Array
	window.Padding.prototype.pad = function (bytes, multiplicity, random) {
		throw 'Not implemented';
	};
	// bytes - Uint8Array
	// returns padding bytes count
	window.Padding.prototype.unpad = function (bytes) {
		throw 'Not implemented';
	};

	window.paddings = {};

	window.paddings['ANSI X.923'] = new Padding();
	window.paddings['ANSI X.923'].pad = function (bytes, multiplicity) {
		if (!(bytes instanceof Uint8Array) || typeof multiplicity != 'number' || multiplicity < 4 || multiplicity > 256)
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		var padCount = multiplicity - bytesLength % multiplicity;
		var result = new Uint8Array(bytesLength + padCount);
		result.set(bytes, 0);
		for (var i = 0; i < padCount - 1; i++)
			result[bytesLength + i] = 0;
		result[bytesLength + padCount - 1] = padCount;
		return result;
	};
	window.paddings['ANSI X.923'].unpad = function (bytes) {
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		if (bytesLength == 0)
			return -1;
		var padCount = bytes[bytesLength - 1];
		if (padCount == 0 || padCount > bytesLength)
			return -1;
		for (var i = 0; i < padCount - 1; i++)
			if (bytes[bytesLength - i - 2] != 0)
				return -1;
		return padCount;
	};

	window.paddings['ISO 10126'] = new Padding();
	window.paddings['ISO 10126'].pad = function (bytes, multiplicity, random) {
		if (!(bytes instanceof Uint8Array) || typeof multiplicity != 'number' || multiplicity < 4 || multiplicity > 256 || !(random instanceof Random))
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		var padCount = multiplicity - bytesLength % multiplicity;
		var result = new Uint8Array(bytesLength + padCount);
		result.set(bytes, 0);
		for (var i = 0; i < padCount - 1; i++)
			result[bytesLength + i] = random.nextUint8();
		result[bytesLength + padCount - 1] = padCount;
		return result;
	};
	window.paddings['ISO 10126'].unpad = function (bytes) {
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		if (bytesLength == 0)
			return -1;
		var padCount = bytes[bytesLength - 1];
		if (padCount == 0 || padCount > bytesLength)
			return -1;
		return padCount;
	};

	window.paddings['PKCS7'] = new Padding();
	window.paddings['PKCS7'].pad = function (bytes, multiplicity) {
		if (!(bytes instanceof Uint8Array) || typeof multiplicity != 'number' || multiplicity < 4 || multiplicity > 256)
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		var padCount = multiplicity - bytesLength % multiplicity;
		var result = new Uint8Array(bytesLength + padCount);
		result.set(bytes, 0);
		for (var i = 0; i < padCount; i++)
			result[bytesLength + i] = padCount;
		return result;
	};
	window.paddings['PKCS7'].unpad = function (bytes) {
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		if (bytesLength == 0)
			return -1;
		var padCount = bytes[bytesLength - 1];
		if (padCount == 0 || padCount > bytesLength)
			return -1;
		for (var i = 0; i < padCount; i++)
			if (bytes[bytesLength - i - 1] != padCount)
				return -1;
		return padCount;
	};

	window.paddings['ISO/IEC 7816-4'] = new Padding();
	window.paddings['ISO/IEC 7816-4'].pad = function (bytes, multiplicity) {
		if (!(bytes instanceof Uint8Array) || typeof multiplicity != 'number' || multiplicity < 4 || multiplicity > 256)
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		var padCount = multiplicity - bytesLength % multiplicity;
		var result = new Uint8Array(bytesLength + padCount);
		result.set(bytes, 0);
		result[bytesLength] = 0x80;
		for (var i = 1; i < padCount; i++)
			result[bytesLength + i] = 0;
		return result;
	};
	window.paddings['ISO/IEC 7816-4'].unpad = function (bytes) {
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameters';
		var bytesLength = bytes.length;
		if (bytesLength == 0)
			return -1;
		var padCount = 1;
		while (bytes[bytesLength - padCount] == 0) {
			padCount++;
			if (padCount > bytesLength)
				return -1;
		}
		if (bytes[bytesLength - padCount] == 0x80)
			return padCount;
		else
			return -1;
	};

})();