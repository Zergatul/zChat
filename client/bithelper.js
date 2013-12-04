(function () {

	window.bh = {};

	window.bh.rotateLeft = function (val, count) {
		return (val << count) | (val >>> (32 - count));
	};

	window.bh.rotateRight = function (val, count) {
		return (val << (32 - count)) | (val >>> count);
	};

	window.bh.bytesToIntLE = function (bytes, from) {
		var result = 0;
		result |= bytes[from + 0];
		result |= bytes[from + 1] << 8;
		result |= bytes[from + 2] << 16;
		result |= bytes[from + 3] << 24;
		return result;
	};

	window.bh.bytesToIntBE = function (bytes, from) {
		var result = 0;
		result |= bytes[from + 0] << 24;
		result |= bytes[from + 1] << 16;
		result |= bytes[from + 2] << 8;
		result |= bytes[from + 3];
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
		var length = arr.length;
		var result = '';
		for (var i = 0; i < length; i++)
			result += arr[i] < 16 ? '0' + arr[i].toString(16) : arr[i].toString(16)
		return result;
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

	window.bh.stringToByteArray = function (str) {
		var array = new Array(str.length * 2);
		for (var i = 0; i < str.length; i++) {
			var code = str.charCodeAt(i);
			array[2 * i] = code & 0xff;
			array[2 * i + 1] = (code >>> 8) & 0xff;
		}
		return array;
	};

	window.bh.byteArrayToString = function (bytes) {
		var str = '';
		for (var i = 0; i < bytes.length >>> 1; i++) {
			var code = 0;
			code = code | bytes[2 * i];
			code = code | (bytes[2 * i + 1] << 8);
			str += String.fromCharCode(code);
		}
		return str;
	};

	window.Int64 = function (hi, lo) {
		this._hi = hi | 0;
		this._lo = lo | 0;
	};

	window.Int64.prototype.not = function () {
		return new Int64(~this._hi, ~this._lo);
	};

	window.Int64.prototype.rotateRight = function (bits) {
		if (bits == 0)
			return this;
		if (bits == 32)
			return new Int64(this._lo, this._hi);
		if (bits < 32)
			return new Int64((this._lo << (32 - bits)) | (this._hi >>> bits), (this._hi << (32 - bits)) | (this._lo >>> bits));
		if (bits > 32) {
			bits -= 32;
			return new Int64((this._hi << (32 - bits)) | (this._lo >>> bits), (this._lo << (32 - bits)) | (this._hi >>> bits));
		}
	};

	window.Int64.prototype.shiftRight = function (bits) {
		if (bits == 0)
			return this;
		if (bits == 32)
			return new Int64(0, this._hi);
		if (bits < 32)
			return new Int64(this._hi >>> bits, (this._hi << (32 - bits)) | (this._lo >>> bits));
		if (bits > 32)
			throw 'Not implemented';
	};

	window.Int64.prototype.toBytesBE = function () {
		return bh.intToBytesBE(this._hi).concat(bh.intToBytesBE(this._lo));
	};

	window.Int64.prototype.toString = function () {
		var result = '';
		for (var i = 0; i < 8; i++)
			result += ((this._hi >>> ((7 - i) * 4)) & 0xf).toString(16);
		for (var i = 0; i < 8; i++)
			result += ((this._lo >>> ((7 - i) * 4)) & 0xf).toString(16);
		return result;
	};

	window.Int64.add = function (i1, i2) {
		var hi = i1._hi + i2._hi;
		var lo = (i1._lo >= 0 ? i1._lo : i1._lo + 0x100000000) + (i2._lo >= 0 ? i2._lo : i2._lo + 0x100000000);
		if (lo > 0xffffffff)
			hi++;
		return new Int64(hi, lo);
	};

	window.Int64.xor = function (i1, i2) {
		return new Int64(i1._hi ^ i2._hi, i1._lo ^ i2._lo);
	};

	window.Int64.and = function (i1, i2) {
		return new Int64(i1._hi & i2._hi, i1._lo & i2._lo);
	};

	window.BinaryWriter = function () {
		this._data = [];
	};
	window.BinaryWriter.prototype.writeByte = function (val) {
		this._data.push(val);
	};
	window.BinaryWriter.prototype.writeInt16 = function (val) {
		this._data.push(val & 0xff);
		this._data.push((val >>> 8) & 0xff);
	};
	window.BinaryWriter.prototype.writeInt32 = function (val) {
		var buf = bh.intToBytesLE(val);
		for (var i = 0; i < 4; i++)
			this._data.push(buf[i]);
	};
	window.BinaryWriter.prototype.writeBytes = function (array) {
		for (var i = 0; i < array.length; i++)
			this._data.push(array[i]);
	};
	window.BinaryWriter.prototype.getUint8Array = function () {
		return new Uint8Array(this._data);
	};

	window.BinaryReader = function (array) {
		this._data = new Uint8Array(array);
		this._index = 0;
	};

	// TODO

})();