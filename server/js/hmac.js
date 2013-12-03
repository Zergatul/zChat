(function () {

	if (window.HashAlgorithm == undefined)
		throw 'hash.algorithm.js not loaded';

	window.HMAC = function () {};
	window.HMAC.prototype = new HashAlgorithm();
	window.HMAC.prototype._blockSize = 64;
	window.HMAC.prototype._hashAlgorithm = new HashAlgorithm();

	window.HMAC.prototype._setKey = function (key) {
		if (key instanceof Array)
			key = new Uint8Array(key);

		if (key.length > this._blockSize)
			key = this._hashAlgorithm.computeHash(key);
		if (key.length < this._blockSize) {
			var buf = new Uint8Array(this._blockSize);
			buf.set(key, 0);
			key = buf;
		}

		this._key = key;
	};

	window.HMAC.prototype.computeHash = function (bytes) {
		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);

		var ipad = new Uint8Array(this._blockSize);
		var opad = new Uint8Array(this._blockSize);
		for (var i = 0; i < this._blockSize; i++) {
			ipad[i] = 0x36;
			opad[i] = 0x5c;
		}

		var ikeypad = new Uint8Array(this._blockSize);
		var okeypad = new Uint8Array(this._blockSize);
		for (var i = 0; i < this._blockSize; i++) {
			ikeypad[i] = ipad[i] ^ this._key[i];
			okeypad[i] = opad[i] ^ this._key[i];
		}

		var buf = new Uint8Array(bytes.length + ikeypad.length);
		buf.set(ikeypad, 0);
		buf.set(bytes, ikeypad.length);
		var hash1 = this._hashAlgorithm.computeHash(buf);

		buf = new Uint8Array(okeypad.length + hash1.length);
		buf.set(okeypad, 0);
		buf.set(hash1, okeypad.length);

		return this._hashAlgorithm.computeHash(buf);
	};

	if (window.MD5 != undefined) {
		window.HMACMD5 = function (key) {
			this._hashAlgorithm = hashAlgorithms.md5;
			this._setKey(key);
		};
		window.HMACMD5.prototype = new HMAC();
	}
	if (window.SHA1 != undefined) {
		window.HMACSHA1 = function (key) {
			this._hashAlgorithm = hashAlgorithms.sha1;
			this._setKey(key);
		};
		window.HMACSHA1.prototype = new HMAC();
	}
	if (window.SHA256 != undefined) {
		window.HMACSHA256 = function (key) {
			this._hashAlgorithm = hashAlgorithms.sha256;
			this._setKey(key);
		};
		window.HMACSHA256.prototype = new HMAC();
	}

})();