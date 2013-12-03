(function () {

	window.Random = function () {};
	window.Random.prototype.init = function (seed) { throw 'Not implemented'; };
	window.Random.prototype.nextUint8 = function () { throw 'Not implemented'; };
	window.Random.prototype.nextUint16 = function () { throw 'Not implemented'; };
	window.Random.prototype.nextInt32 = function () { throw 'Not implemented'; };
	window.Random.prototype.nextBefore = function (max) { throw 'Not implemented'; };
	window.Random.prototype.nextRange = function (min, max) { throw 'Not implemented'; };
	window.Random.prototype.getUint8Array = function (length) {
		var array = new Uint8Array(length);
		for (var i = 0; i < length; i++)
			array[i] = this.nextUint8();
		return array;
	};
	window.Random.prototype.getUint16Array = function (length) {
		var array = new Uint16Array(length);
		for (var i = 0; i < length; i++)
			array[i] = this.nextUint16();
		return array;
	};
	window.Random.prototype.saveToFile = function (fileName, bytesCount) {
		bytesCount = bytesCount || 10 * 1024 * 1024;
		var blob = new Blob([this.getUint8Array(bytesCount)], { type: 'application/octet-binary' });
		saveAs(blob, fileName);
	};

	window.StreamRandom = function () {
		this._data = new Uint8Array();
		this._index = 0;
		this._state = null;
	};
	window.StreamRandom.prototype = new window.Random();
	window.StreamRandom.prototype._fillData = function () { throw 'Not implemented'; };
	window.StreamRandom.prototype.nextUint8 = function () {
		if (this._index >= this._data.length)
			this._fillData();
		return this._data[this._index++];
	};
	window.StreamRandom.prototype.nextUint16 = function () {
		if (this._index + 1 >= this._data.length)
			this._fillData();
		return (this._data[this._index++] << 8) | this._data[this._index++];
	};
	window.StreamRandom.prototype.nextInt32 = function () {
		if (this._index + 3 >= this._data.length)
			this._fillData();
		return (this._data[this._index++] << 24) | (this._data[this._index++] << 16) | (this._data[this._index++] << 8) | this._data[this._index++];
	};

	window.Random.Default = new Random();
	window.Random.Default.nextUint8 = function () { return Math.floor(Math.random() * 0x100); };
	window.Random.Default.nextUint16 = function () { return Math.floor(Math.random() * 0x10000); };
	window.Random.Default.nextInt32 = function () { return Math.floor(Math.random() * 0x100000000); };
	window.Random.Default.nextBefore = function (max) { return Math.floor(Math.random() * max); };
	window.Random.Default.nextRange = function (min, max) { return min + Math.floor(Math.random() * (max - min)); };

	window.Random.SHA2PRNG = new StreamRandom();
	window.Random.SHA2PRNG.init = function (seed) {
		if (seed instanceof Array)
			seed = new Uint8Array(seed);
		if (!(seed instanceof Uint8Array))
			throw 'Invalid parameter';
		if (seed.length == 0)
			seed = new Uint8Array([0]);
		this._state = seed;
	};
	window.Random.SHA2PRNG._fillData = function () {
		var index = this._index;
		var remainCount = Math.max(this._data.length - index - 1, 0);
		var data = new Uint8Array(remainCount + 32);
		data.set(this._data.subarray(index, remainCount), 0);
		var hash = new HashAlgorithm.SHA256().computeHash(this._state);
		data.set(hash, remainCount);
		this._data = data;
		this._index = 0;

		var sum = this._state[0] + 1;
		this._state[0] = sum & 0xff;
		var carry = sum >>> 8;
		index = 1;
		while (carry > 0 && index < this._state.length) {
			sum = this._state[index] + carry;
			this._state[index++] = sum & 0xff;
			carry = sum >>> 8;
		}
		if (carry != 0) {
			var buf = new Uint8Array(this._state.length + 1);
			buf.set(this._state, 0);
			buf[this._state.length] = carry;
			this._state = buf;
		}
	};
	var seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	window.Random.SHA2PRNG.init(seed);

})();