(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	var s = [
		7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
		5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
		4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
		6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21];

	var k = [
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
		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];

	var appendLength = function (bytes, length) {
		length *= 8;
		for (var i = 0; i < 8; i++) {
			bytes.push(length % 256);
			length = Math.floor(length / 256);
		}
	};

	var getChunk = function (bytes) {
		var chunkBytes = bytes.splice(0, 64);
		var chunk = [];
		for (var i = 0; i < 16; i++) {
			var integer =
				chunkBytes[i * 4 + 3] << 24 |
				chunkBytes[i * 4 + 2] << 16 |
				chunkBytes[i * 4 + 1] << 8 |
				chunkBytes[i * 4 + 0];
			chunk.push(integer);
		}
		return chunk;
	};	

	window.md5 = function (data) {
		
		var bytes = bh.getByteArray(data);
		var length = bytes.length;
		bh.padding(bytes);
		appendLength(bytes, length);

		var a0 = 0x67452301;
		var b0 = 0xefcdab89;
		var c0 = 0x98badcfe;
		var d0 = 0x10325476;

		while (bytes.length) {
			var a = a0;
			var b = b0;
			var c = c0;
			var d = d0;

			var m = getChunk(bytes);

			for (var i = 0; i < 64; i++) {
				var f, g;
				if (0 <= i && i <= 15) {
					f = (b & c) | (~b & d);
					g = i;
				} else if (16 <= i && i <= 31) {
					f = (d & b) | (~d & c);
					g = (5 * i + 1) % 16;
				} else if (32 <= i && i <= 47) {
					f = b ^ c ^ d;
					g = (3 * i + 5) % 16;
				} else if (48 <= i && i <= 63) {
					f = c ^ (b | ~d);
					g = (7 * i) % 16;
				}
				var buf = d;
				d = c;
				c = b;
				b = (b + bh.rotateLeft(a + f + k[i] + m[g], s[i])) & 0xFFFFFFFF;
				a = buf;
			}

			a0 = (a0 + a) & 0xFFFFFFFF;
			b0 = (b0 + b) & 0xFFFFFFFF;
			c0 = (c0 + c) & 0xFFFFFFFF;
			d0 = (d0 + d) & 0xFFFFFFFF;
		}

		return bh.intToBytesLE(a0).concat(
			bh.intToBytesLE(b0)).concat(
			bh.intToBytesLE(c0)).concat(
			bh.intToBytesLE(d0));
	};

})();