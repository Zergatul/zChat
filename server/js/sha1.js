(function () {

	if (window.bh == undefined)
		throw 'bithelper.js not loaded';
	if (window.HashAlgorithm == undefined)
		throw 'hash.algorithm.js not loaded';

	window.HashAlgorithm.SHA1 = function () {};
	window.HashAlgorithm.SHA1.prototype = new HashAlgorithm();
	window.HashAlgorithm.SHA1.prototype.hashSize = 160;

	window.HashAlgorithm.SHA1.prototype.computeHash = function (bytes) {

		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid argument';

		var length = bytes.length;
		var withPadding = new Uint8Array(length + 8 + (64 - ((length + 8) & 0x3f)));
		withPadding.set(bytes, 0);
		var index = length;
		withPadding[index++] = 0x80;
		while ((index & 0x3f) != 56)
			withPadding[index++] = 0;

		length = length << 3;
		for (var i = 0; i < 8; i++) {
			withPadding[index + 7 - i] = length & 0xff;
			length = length >>> 8;
		}

		bytes = withPadding;

		var h0 = 0x67452301;
		var h1 = 0xefcdab89;
		var h2 = 0x98badcfe;
		var h3 = 0x10325476;
		var h4 = 0xc3d2e1f0;

		var w = new Int32Array(80);
		var chunksCount = bytes.length >>> 6;

		for (var chunk = 0; chunk < chunksCount; chunk++) {

			var index = chunk << 6;
			for (var i = 0; i < 16; i++) {
				w[i] = (bytes[index++] << 24) | (bytes[index++] << 16) | (bytes[index++] << 8) | bytes[index++];
			}

			for (var i = 16; i < 80; i++) {
				var buf = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
				w[i] = (buf << 1) | (buf >>> 31);
			}

			var a = h0;
			var b = h1;
			var c = h2;
			var d = h3;
			var e = h4;
			var f, k;

			for (var i = 0; i < 80; i++) {
				if (i <= 19) {
					f = (b & c) | (~b & d);
					k = 0x5a827999;
				} else if (i <= 39) {
					f = b ^ c ^ d;
					k = 0x6ed9eba1;
				} else if (i <= 59) {
					f = (b & c) | (b & d) | (c & d);
					k = 0x8f1bbcdc;
				} else {
					f = b ^ c ^ d;
					k = 0xca62c1d6;
				}

				var buf = ((a << 5) | (a >>> 27)) + f + e + k + w[i];
				e = d;
				d = c;
				c = (b << 30) | (b >>> 2);
				b = a;
				a = buf & 0xffffffff;
			}

			h0 = (h0 + a) & 0xffffffff;
			h1 = (h1 + b) & 0xffffffff;
			h2 = (h2 + c) & 0xffffffff;
			h3 = (h3 + d) & 0xffffffff;
			h4 = (h4 + e) & 0xffffffff;
		};

		var hash = new Uint8Array(20);
		hash[0] = h0 >>> 24;
		hash[1] = h0 >>> 16;
		hash[2] = h0 >>> 8;
		hash[3] = h0;
		hash[4] = h1 >>> 24;
		hash[5] = h1 >>> 16;
		hash[6] = h1 >>> 8;
		hash[7] = h1;
		hash[8] = h2 >>> 24;
		hash[9] = h2 >>> 16;
		hash[10] = h2 >>> 8;
		hash[11] = h2;
		hash[12] = h3 >>> 24;
		hash[13] = h3 >>> 16;
		hash[14] = h3 >>> 8;
		hash[15] = h3;
		hash[16] = h4 >>> 24;
		hash[17] = h4 >>> 16;
		hash[18] = h4 >>> 8;
		hash[19] = h4;
		return hash;
	};

})();