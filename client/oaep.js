(function () {

	if (sha2 == undefined)
		throw 'sha2.js not loaded';

	window.OAEP = function (n, m, k0) {
		this._n = n;
		this._m = m;
		this._k0 = k0;
	};

	window.OAEP.prototype.encode = function (bytes, random) {
		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameters';
		if (bytes.length != this._m)
			throw 'Invalid data length';

		var result = new Uint8Array(this._n);
		result.set(bytes, 0);

		for (var i = this._m; i < this._n - this._k0; i++)
			result[i] = 0;

		result.set(random.getUint8Array(this._k0), this._n - this._k0);

		var rightHash = sha2(result.subarray(this._n - this._k0, this._n), 256);
		for (var i = 0; i < this._n - this._k0; i++)
			result[i] = result[i] ^ rightHash[i % 32];

		var leftHash = sha2(result.subarray(0, this._n - this._k0), 256);
		for (var i = 0; i < this._k0; i++)
			result[this._n - this._k0 + i] = result[this._n - this._k0 + i] ^ leftHash[i % 32];

		return result;
	};

	window.OAEP.prototype.decode = function (bytes) {
		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid parameters';
		if (bytes.length != this._n)
			throw 'Invalid data length';

		var result = new Uint8Array(this._n);
		result.set(bytes, 0);

		var leftHash = sha2(bytes.subarray(0, this._n - this._k0), 256);
		for (var i = 0; i < this._k0; i++)
			result[this._n - this._k0 + i] = result[this._n - this._k0 + i] ^ leftHash[i % 32];

		var rightHash = sha2(result.subarray(this._n - this._k0, this._n), 256);
		for (var i = 0; i < this._n - this._k0; i++)
			result[i] = result[i] ^ rightHash[i % 32];

		for (var i = this._m; i < this._n - this._k0; i++)
			if (result[i] != 0)
				throw 'Invalid padding';

		return result.subarray(0, this._m);
	};

})();