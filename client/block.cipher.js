(function () {

	window.BlockCipher = function () {};
	window.BlockCipher.prototype.createEncryptor = function (key, cipherMode, padding, random) {
		var result = new CryptoTransform();
		result.isEncryption = true;
		result.cipherMode = cipherMode;
		result.padding = padding;
		result.random = random;
		return result;
	};
	window.BlockCipher.prototype.createDecryptor = function (key, cipherMode, padding, random) {
		var result = new CryptoTransform();
		result.isEncryption = false;
		result.cipherMode = cipherMode;
		result.padding = padding;
		result.random = random;
		return result;
	};

	window.CipherMode = function () {};
	window.CipherMode.prototype.encrypt = function () {
		throw 'Not implemented';
	}
	window.CipherMode.prototype.decrypt = function () {
		throw 'Not implemented';
	};
	window.CipherMode.ECB = new CipherMode();
	window.CipherMode.ECB.encrypt = function (bytes, cryptoTransfrom) {
		var result = new Uint8Array(bytes.length);
		var blockCount = bytes.length / cryptoTransfrom.blockSize;
		for (var b = 0; b < blockCount; b++) {
			var position = b * cryptoTransfrom.blockSize;
			var block = bytes.subarray(position, position + cryptoTransfrom.blockSize);
			var encrypted = cryptoTransfrom.processBlock(block);
			result.set(encrypted, position);
		}
		return result;
	};
	window.CipherMode.ECB.decrypt = function (bytes, cryptoTransfrom) {
		var result = new Uint8Array(bytes.length);
		var blockCount = bytes.length / cryptoTransfrom.blockSize;
		for (var b = 0; b < blockCount; b++) {
			var position = b * cryptoTransfrom.blockSize;
			var block = bytes.subarray(position, position + cryptoTransfrom.blockSize);
			var decrypted = cryptoTransfrom.processBlock(block);
			result.set(decrypted, position);
		}
		return result;
	};
	window.CipherMode.CBC = new CipherMode();
	window.CipherMode.CBC.encrypt = function (bytes, cryptoTransfrom) {
		var result = new Uint8Array(bytes.length + cryptoTransfrom.blockSize);
		var iv = cryptoTransfrom.random.getUint8Array(cryptoTransfrom.blockSize);
		result.set(iv, 0);
		var xor = iv;
		var blockCount = bytes.length / cryptoTransfrom.blockSize;
		for (var b = 0; b < blockCount; b++) {
			var position = b * cryptoTransfrom.blockSize;
			var block = bytes.subarray(position, position + cryptoTransfrom.blockSize);
			for (var i = 0; i < cryptoTransfrom.blockSize; i++)
				block[i] = block[i] ^ xor[i];
			var encrypted = cryptoTransfrom.processBlock(block);
			result.set(encrypted, position + cryptoTransfrom.blockSize);
			xor = encrypted;
		}
		return result;
	};
	window.CipherMode.CBC.decrypt = function (bytes, cryptoTransfrom) {
		var result = new Uint8Array(bytes.length - cryptoTransfrom.blockSize);
		var iv = bytes.subarray(0, cryptoTransfrom.blockSize);
		var xor = iv;
		var blockCount = bytes.length / cryptoTransfrom.blockSize - 1;
		for (var b = 0; b < blockCount; b++) {
			var position = b * cryptoTransfrom.blockSize;
			var block = bytes.subarray(position + cryptoTransfrom.blockSize, position + 2 * cryptoTransfrom.blockSize);
			var decrypted = cryptoTransfrom.processBlock(block);
			for (var i = 0; i < cryptoTransfrom.blockSize; i++)
				decrypted[i] = decrypted[i] ^ xor[i];
			result.set(decrypted, position);
			xor = block;
		}
		return result;
	};
	window.CipherMode.CFB = new CipherMode();
	window.CipherMode.CTS = new CipherMode();
	window.CipherMode.OFB = new CipherMode();

	window.CryptoTransform = function () {};
	window.CryptoTransform.prototype.blockSize = 0;
	window.CryptoTransform.prototype.isEncryption = null;
	window.CryptoTransform.prototype.padding = new Padding();
	window.CryptoTransform.prototype.cipherMode = new CipherMode();
	window.CryptoTransform.prototype.random = new Random();
	window.CryptoTransform.prototype.processBlock = function (bytes) {
		throw 'Not implemented';
	};
	window.CryptoTransform.prototype.process = function (bytes) {
		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);

		if (this.isEncryption) {
			bytes = this.padding.pad(bytes, this.blockSize);
			return this.cipherMode.encrypt(bytes, this);
		} else {
			if (bytes.length % this.blockSize != 0)
				throw 'Invalid data length';
			var decrypted = this.cipherMode.decrypt(bytes, this);
			var padCount = this.padding.unpad(decrypted);
			if (padCount == -1)
				throw 'Invavid padding';
			return decrypted.subarray(0, decrypted.length - padCount)
		}
	};

})();