(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	var s = new Uint8Array([
		7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
		5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
		4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
		6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21]);

	var k = new Uint32Array([
		0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
		0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
		0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
		0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
		0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
		0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
		0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
		0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
		0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
		0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
		0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
		0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
		0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
		0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
		0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391]);

	window.md5 = function (bytes) {
		
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

		var a0 = 0x67452301;
		var b0 = 0xefcdab89;
		var c0 = 0x98badcfe;
		var d0 = 0x10325476;

		var m = new Int32Array(16);
		var chunksCount = bytes.length >>> 6;

		for (var chunk = 0; chunk < chunksCount; chunk++) {

			var a = a0;
			var b = b0;
			var c = c0;
			var d = d0;

			for (var i = 0; i < 16; i++)
				m[i] = bh.bytesToIntLE(bytes, (chunk << 6) + (i << 2));

			for (var i = 0; i < 64; i++) {
				var f, g;
				if (i <= 15) {
					f = (b & c) | (~b & d);
					g = i;
				} else if (i <= 31) {
					f = (d & b) | (~d & c);
					g = (5 * i + 1) & 0xf;
				} else if (i <= 47) {
					f = b ^ c ^ d;
					g = (3 * i + 5) & 0xf;
				} else {
					f = c ^ (b | ~d);
					g = (7 * i) & 0xf;
				}
				var buf = d;
				d = c;
				c = b;
				b = (b + bh.rotateLeft(a + f + k[i] + m[g], s[i])) & 0xffffffff;
				a = buf;
			}

			a0 = (a0 + a) & 0xffffffff;
			b0 = (b0 + b) & 0xffffffff;
			c0 = (c0 + c) & 0xffffffff;
			d0 = (d0 + d) & 0xffffffff;
		}

		return new Uint8Array([].concat(
			bh.intToBytesLE(a0)).concat(
			bh.intToBytesLE(b0)).concat(
			bh.intToBytesLE(c0)).concat(
			bh.intToBytesLE(d0)));
	};

})();