(function () {

	if (window.bh == undefined)
		throw 'bithelper.js not loaded';
	if (window.HashAlgorithm == undefined)
		throw 'hash.algorithm.js not loaded';

	window.HashAlgorithm.RIPEMD160 = function () {};
	window.HashAlgorithm.RIPEMD160.prototype = new HashAlgorithm();
	window.HashAlgorithm.RIPEMD160.prototype.hashSize = 160;

	window.HashAlgorithm.RIPEMD160.prototype.computeHash = function (bytes) {

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
			withPadding[index + i] = length & 0xff;
			length = length >>> 8;
		}

		bytes = withPadding;

		var h0 = 0x67452301;
		var h1 = 0xefcdab89;
		var h2 = 0x98badcfe;
		var h3 = 0x10325476;
		var h4 = 0xc3d2e1f0;

		var f = function (j, x, y, z) {
			if (j < 16) return x ^ y ^ z;
			if (j < 32) return (x & y) | (~x & z);
			if (j < 48) return (x | ~y) ^ z;
			if (j < 64) return (x & z) | (y & ~z);
			if (j < 80) return x ^ (y | ~z);
		};

		var k = function (j) {
			if (j < 16) return 0;
			if (j < 32) return 0x5a827999;
			if (j < 48) return 0x6ed9eba1;
			if (j < 64) return 0x8f1bbcdc;
			if (j < 80) return 0xa953fd4e;
		};

		var kp = function (j) {
			if (j < 16) return 0x50a28be6;
			if (j < 32) return 0x5c4dd124;
			if (j < 48) return 0x6d703ef3;
			if (j < 64) return 0x7a6d76e9;
			if (j < 80) return 0;
		};

		var r = [
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
			7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
			3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
			1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
			4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13];

		var rp = [
			5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
			6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
			15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
			8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
			12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11];

		var s = [
			11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
			7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
			11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
			11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
			9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6];

		var sp = [
			8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
			9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
			9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
			15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
			8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11]

		var chunksCount = bytes.length >>> 6;
		var m = new Int32Array(16);

		for (var chunk = 0; chunk < chunksCount; chunk++) {

			var a = h0;
			var b = h1;
			var c = h2;
			var d = h3;
			var e = h4;
			var ap = h0;
			var bp = h1;
			var cp = h2;
			var dp = h3;
			var ep = h4;

			for (var i = 0; i < 16; i++)
				m[i] = bh.bytesToIntLE(bytes, (chunk << 6) + (i << 2));

			for (var j = 0; j < 80; j++) {

				var t = bh.rotateLeft(a + f(j, b, c, d) + m[r[j]] + k(j), s[j]) + e;
				t = t & 0xffffffff;
				a = e;
				e = d;
				d = bh.rotateLeft(c, 10);
				c = b;
				b = t;

				var t = bh.rotateLeft(ap + f(79 - j, bp, cp, dp) + m[rp[j]] + kp(j), sp[j]) + ep;
				t = t & 0xffffffff;
				ap = ep;
				ep = dp;
				dp = bh.rotateLeft(cp, 10);
				cp = bp;
				bp = t;
			}

			var t = h1 + c + dp;
			h1 = h2 + d + ep;
			h2 = h3 + e + ap;
			h3 = h4 + a + bp;
			h4 = h0 + b + cp;
			h0 = t;

			h0 = h0 & 0xffffffff;
			h1 = h1 & 0xffffffff;
			h2 = h2 & 0xffffffff;
			h3 = h3 & 0xffffffff;
			h4 = h4 & 0xffffffff;
		}

		return new Uint8Array([].concat(
			bh.intToBytesLE(h0)).concat(
			bh.intToBytesLE(h1)).concat(
			bh.intToBytesLE(h2)).concat(
			bh.intToBytesLE(h3)).concat(
			bh.intToBytesLE(h4)));
	};
})();