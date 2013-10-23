(function () {

	window.random = {};

	window.Random = function () { };
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

	window.random.default = new Random();
	window.random.default.nextUint8 = function () { return Math.floor(Math.random() * 0x100); };
	window.random.default.nextUint16 = function () { return Math.floor(Math.random() * 0x10000); };
	window.random.default.nextInt32 = function () { return Math.floor(Math.random() * 0x100000000); };
	window.random.default.nextBefore = function (max) { return Math.floor(Math.random() * max); };
	window.random.default.nextRange = function (min, max) { return min + Math.floor(Math.random() * (max - min)); };

	window.random.SHA2PRNG = new StreamRandom();
	window.random.SHA2PRNG.init = function (seed) {
		if (!(seed instanceof Uint8Array))
			throw 'Invalid parameter';
		if (seed.length < 32) {
			var buf = new Uint8Array(32);
			buf.set(seed, 0);
			seed = buf;
		}	
		this._state = seed;
	};
	window.random.SHA2PRNG._fillData = function () {
		var index = this._index;
		var remainCount = Math.max(this._data.length - index - 1, 0);
		var data = new Uint8Array(remainCount + 32);
		data.set(this._data.subarray(index, remainCount), 0);
		var hash = sha2(this._state, 256);
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
	};

})();