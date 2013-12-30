(function () {

	if (window.bh == undefined)
		throw 'bithelper.js not loaded';
	if (window.HashAlgorithm == undefined)
		throw 'hash.algorithm.js not loaded';

	window.HashAlgorithm.SHA224 = function () {};
	window.HashAlgorithm.SHA224.prototype = new HashAlgorithm();
	window.HashAlgorithm.SHA224.prototype.hashSize = 224;

	window.HashAlgorithm.SHA256 = function () {};
	window.HashAlgorithm.SHA256.prototype = new HashAlgorithm();
	window.HashAlgorithm.SHA256.prototype.hashSize = 256;

	window.HashAlgorithm.SHA384 = function () {};
	window.HashAlgorithm.SHA384.prototype = new HashAlgorithm();
	window.HashAlgorithm.SHA384.prototype.hashSize = 384;

	window.HashAlgorithm.SHA512 = function () {};
	window.HashAlgorithm.SHA512.prototype = new HashAlgorithm();
	window.HashAlgorithm.SHA512.prototype.hashSize = 512;

	var k32 = new Int32Array([
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
		0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
		0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
		0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
		0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
		0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
		0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
		0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);

	var k64 = [
		new Int64(0x428a2f98, 0xd728ae22), new Int64(0x71374491, 0x23ef65cd), new Int64(0xb5c0fbcf, 0xec4d3b2f), new Int64(0xe9b5dba5, 0x8189dbbc),
		new Int64(0x3956c25b, 0xf348b538), new Int64(0x59f111f1, 0xb605d019), new Int64(0x923f82a4, 0xaf194f9b), new Int64(0xab1c5ed5, 0xda6d8118),
		new Int64(0xd807aa98, 0xa3030242), new Int64(0x12835b01, 0x45706fbe), new Int64(0x243185be, 0x4ee4b28c), new Int64(0x550c7dc3, 0xd5ffb4e2),
		new Int64(0x72be5d74, 0xf27b896f), new Int64(0x80deb1fe, 0x3b1696b1), new Int64(0x9bdc06a7, 0x25c71235), new Int64(0xc19bf174, 0xcf692694),
		new Int64(0xe49b69c1, 0x9ef14ad2), new Int64(0xefbe4786, 0x384f25e3), new Int64(0x0fc19dc6, 0x8b8cd5b5), new Int64(0x240ca1cc, 0x77ac9c65),
		new Int64(0x2de92c6f, 0x592b0275), new Int64(0x4a7484aa, 0x6ea6e483), new Int64(0x5cb0a9dc, 0xbd41fbd4), new Int64(0x76f988da, 0x831153b5),
		new Int64(0x983e5152, 0xee66dfab), new Int64(0xa831c66d, 0x2db43210), new Int64(0xb00327c8, 0x98fb213f), new Int64(0xbf597fc7, 0xbeef0ee4),
		new Int64(0xc6e00bf3, 0x3da88fc2), new Int64(0xd5a79147, 0x930aa725), new Int64(0x06ca6351, 0xe003826f), new Int64(0x14292967, 0x0a0e6e70),
		new Int64(0x27b70a85, 0x46d22ffc), new Int64(0x2e1b2138, 0x5c26c926), new Int64(0x4d2c6dfc, 0x5ac42aed), new Int64(0x53380d13, 0x9d95b3df),
		new Int64(0x650a7354, 0x8baf63de), new Int64(0x766a0abb, 0x3c77b2a8), new Int64(0x81c2c92e, 0x47edaee6), new Int64(0x92722c85, 0x1482353b),
		new Int64(0xa2bfe8a1, 0x4cf10364), new Int64(0xa81a664b, 0xbc423001), new Int64(0xc24b8b70, 0xd0f89791), new Int64(0xc76c51a3, 0x0654be30),
		new Int64(0xd192e819, 0xd6ef5218), new Int64(0xd6990624, 0x5565a910), new Int64(0xf40e3585, 0x5771202a), new Int64(0x106aa070, 0x32bbd1b8),
		new Int64(0x19a4c116, 0xb8d2d0c8), new Int64(0x1e376c08, 0x5141ab53), new Int64(0x2748774c, 0xdf8eeb99), new Int64(0x34b0bcb5, 0xe19b48a8),
		new Int64(0x391c0cb3, 0xc5c95a63), new Int64(0x4ed8aa4a, 0xe3418acb), new Int64(0x5b9cca4f, 0x7763e373), new Int64(0x682e6ff3, 0xd6b2b8a3),
		new Int64(0x748f82ee, 0x5defb2fc), new Int64(0x78a5636f, 0x43172f60), new Int64(0x84c87814, 0xa1f0ab72), new Int64(0x8cc70208, 0x1a6439ec),
		new Int64(0x90befffa, 0x23631e28), new Int64(0xa4506ceb, 0xde82bde9), new Int64(0xbef9a3f7, 0xb2c67915), new Int64(0xc67178f2, 0xe372532b),
		new Int64(0xca273ece, 0xea26619c), new Int64(0xd186b8c7, 0x21c0c207), new Int64(0xeada7dd6, 0xcde0eb1e), new Int64(0xf57d4f7f, 0xee6ed178),
		new Int64(0x06f067aa, 0x72176fba), new Int64(0x0a637dc5, 0xa2c898a6), new Int64(0x113f9804, 0xbef90dae), new Int64(0x1b710b35, 0x131c471b),
		new Int64(0x28db77f5, 0x23047d84), new Int64(0x32caab7b, 0x40c72493), new Int64(0x3c9ebe0a, 0x15c9bebc), new Int64(0x431d67c4, 0x9c100d4c),
		new Int64(0x4cc5d4be, 0xcb3e42b6), new Int64(0x597f299c, 0xfc657e2a), new Int64(0x5fcb6fab, 0x3ad6faec), new Int64(0x6c44198c, 0x4a475817)
	];

	var b32 = function (bytes, is256) {

		var length = bytes.length;
		var withPadding = new Uint8Array(length + 8 + (64 - (length + 8) % 64));
		withPadding.set(bytes, 0);
		var index = length;
		withPadding[index++] = 0x80;
		while (index % 64 != 56)
			withPadding[index++] = 0;

		length *= 8;
		for (var i = 0; i < 8; i++) {
			withPadding[index + 7 - i] = length & 0xff;
			length = length >>> 8;
		}

		bytes = withPadding;

		if (is256) {
			var h0 = 0x6a09e667;
			var h1 = 0xbb67ae85;
			var h2 = 0x3c6ef372;
			var h3 = 0xa54ff53a;
			var h4 = 0x510e527f;
			var h5 = 0x9b05688c;
			var h6 = 0x1f83d9ab;
			var h7 = 0x5be0cd19;
		} else {
			var h0 = 0xc1059ed8;
			var h1 = 0x367cd507;
			var h2 = 0x3070dd17;
			var h3 = 0xf70e5939;
			var h4 = 0xffc00b31;
			var h5 = 0x68581511;
			var h6 = 0x64f98fa7;
			var h7 = 0xbefa4fa4;
		}

		var w = new Int32Array(64);
		var chunksCount = bytes.length / 64;

		for (var chunk = 0; chunk < chunksCount; chunk++) {

			for (var i = 0; i < 16; i++)
				w[i] = bh.bytesToIntBE(bytes, chunk * 64 + i * 4);

			for (var i = 16; i < 64; i++) {
				var s0 = bh.rotateRight(w[i - 15], 7) ^ bh.rotateRight(w[i - 15], 18) ^ bh.rotateRight(w[i - 15] >>> 3);
				var s1 = bh.rotateRight(w[i - 2], 17) ^ bh.rotateRight(w[i - 2], 19) ^ bh.rotateRight(w[i - 2] >>> 10);
				w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff;
			}

			var a = h0;
			var b = h1;
			var c = h2;
			var d = h3;
			var e = h4;
			var f = h5;
			var g = h6;
			var h = h7;

			for (var i = 0; i < 64; i++) {
				var sigma0 = bh.rotateRight(a, 2) ^ bh.rotateRight(a, 13) ^ bh.rotateRight(a, 22);
				var Ma = (a & b) ^ (a & c) ^ (b & c);
				var t2 = (sigma0 + Ma) & 0xffffffff;
				var sigma1 = bh.rotateRight(e, 6) ^ bh.rotateRight(e, 11) ^ bh.rotateRight(e, 25);
				var Ch = (e & f) ^ (~e & g);
				var t1 = (h + sigma1 + Ch + k32[i] + w[i]) & 0xffffffff;

				h = g;
				g = f;
				f = e;
				e = (d + t1) & 0xffffffff;
				d = c;
				c = b;
				b = a;
				a = (t1 + t2) & 0xFFFFFFFF;
			}

			h0 = (h0 + a) & 0xffffffff;
			h1 = (h1 + b) & 0xffffffff;
			h2 = (h2 + c) & 0xffffffff;
			h3 = (h3 + d) & 0xffffffff;
			h4 = (h4 + e) & 0xffffffff;
			h5 = (h5 + f) & 0xffffffff;
			h6 = (h6 + g) & 0xffffffff;
			h7 = (h7 + h) & 0xffffffff;
		}

		if (is256)
			var hash =
				[].concat(
				bh.intToBytesBE(h0)).concat(
				bh.intToBytesBE(h1)).concat(
				bh.intToBytesBE(h2)).concat(
				bh.intToBytesBE(h3)).concat(
				bh.intToBytesBE(h4)).concat(
				bh.intToBytesBE(h5)).concat(
				bh.intToBytesBE(h6)).concat(
				bh.intToBytesBE(h7));
		else
			var hash =
				[].concat(
				bh.intToBytesBE(h0)).concat(
				bh.intToBytesBE(h1)).concat(
				bh.intToBytesBE(h2)).concat(
				bh.intToBytesBE(h3)).concat(
				bh.intToBytesBE(h4)).concat(
				bh.intToBytesBE(h5)).concat(
				bh.intToBytesBE(h6));
		return hash;
	};

	var b64 = function (bytes, is512) {

		var length = bytes.length;
		var withPadding = new Uint8Array(length + 16 + (128 - (length + 16) % 128));
		withPadding.set(bytes, 0);
		var index = length;
		withPadding[index++] = 0x80;
		while (index % 128 != 112)
			withPadding[index++] = 0;

		length *= 8;
		for (var i = 0; i < 16; i++) {
			withPadding[index + 15 - i] = length & 0xff;
			length = length >>> 8;
		}

		bytes = withPadding;

		if (is512) {
			var h0 = new Int64(0x6a09e667, 0xf3bcc908);
			var h1 = new Int64(0xbb67ae85, 0x84caa73b);
			var h2 = new Int64(0x3c6ef372, 0xfe94f82b);
			var h3 = new Int64(0xa54ff53a, 0x5f1d36f1);
			var h4 = new Int64(0x510e527f, 0xade682d1);
			var h5 = new Int64(0x9b05688c, 0x2b3e6c1f);
			var h6 = new Int64(0x1f83d9ab, 0xfb41bd6b);
			var h7 = new Int64(0x5be0cd19, 0x137e2179);
		} else {
			var h0 = new Int64(0xcbbb9d5d, 0xc1059ed8);
			var h1 = new Int64(0x629a292a, 0x367cd507);
			var h2 = new Int64(0x9159015a, 0x3070dd17);
			var h3 = new Int64(0x152fecd8, 0xf70e5939);
			var h4 = new Int64(0x67332667, 0xffc00b31);
			var h5 = new Int64(0x8eb44a87, 0x68581511);
			var h6 = new Int64(0xdb0c2e0d, 0x64f98fa7);
			var h7 = new Int64(0x47b5481d, 0xbefa4fa4);
		}

		var w = new Array(80);
		var chunksCount = bytes.length / 128;

		for (var chunk = 0; chunk < chunksCount; chunk++) {

			for (var i = 0; i < 16; i++)
				w[i] = new Int64(bh.bytesToIntBE(bytes, chunk * 128 + i * 8), bh.bytesToIntBE(bytes, chunk * 128 + i * 8 + 4));

			for (var i = 16; i < 80; i++) {
				var s0 = Int64.xor(Int64.xor(w[i - 15].rotateRight(1), w[i - 15].rotateRight(8)), w[i - 15].shiftRight(7));
				var s1 = Int64.xor(Int64.xor(w[i - 2].rotateRight(19), w[i - 2].rotateRight(61)), w[i - 2].shiftRight(6));
				w[i] = Int64.add(Int64.add(w[i - 16], s0), Int64.add(w[i - 7], s1));
			}

			var a = h0;
			var b = h1;
			var c = h2;
			var d = h3;
			var e = h4;
			var f = h5;
			var g = h6;
			var h = h7;

			for (var i = 0; i < 80; i++) {
				var sigma0 = Int64.xor(Int64.xor(a.rotateRight(28), a.rotateRight(34)), a.rotateRight(39));
				var Ma = Int64.xor(Int64.xor(Int64.and(a, b), Int64.and(a, c)), Int64.and(b, c));
				var t2 = Int64.add(sigma0, Ma);
				var sigma1 = Int64.xor(Int64.xor(e.rotateRight(14), e.rotateRight(18)), e.rotateRight(41));
				var Ch = Int64.xor(Int64.and(e, f), Int64.and(e.not(), g));
				var t1 = Int64.add(Int64.add(Int64.add(h, sigma1), Int64.add(Ch, k64[i])), w[i]);

				h = g;
				g = f;
				f = e;
				e = Int64.add(d, t1);
				d = c;
				c = b;
				b = a;
				a = Int64.add(t1, t2);
			}

			h0 = Int64.add(h0, a);
			h1 = Int64.add(h1, b);
			h2 = Int64.add(h2, c);
			h3 = Int64.add(h3, d);
			h4 = Int64.add(h4, e);
			h5 = Int64.add(h5, f);
			h6 = Int64.add(h6, g);
			h7 = Int64.add(h7, h);
		}

		if (is512)
			var hash =
				[].concat(
				h0.toBytesBE()).concat(
				h1.toBytesBE()).concat(
				h2.toBytesBE()).concat(
				h3.toBytesBE()).concat(
				h4.toBytesBE()).concat(
				h5.toBytesBE()).concat(
				h6.toBytesBE()).concat(
				h7.toBytesBE());
		else
			var hash =
				[].concat(
				h0.toBytesBE()).concat(
				h1.toBytesBE()).concat(
				h2.toBytesBE()).concat(
				h3.toBytesBE()).concat(
				h4.toBytesBE()).concat(
				h5.toBytesBE());
		return hash;
	};

	var computeHash = function (bytes, version) {
		if (bytes instanceof Array)
			bytes = new Uint8Array(bytes);
		if (!(bytes instanceof Uint8Array))
			throw 'Invalid argument';
		if (version == undefined)
			version = 256;
		if ([224, 256, 384, 512].indexOf(version) == -1)
			throw 'Unsupported version of SHA-2';

		if (version <= 256)
			return new Uint8Array(b32(bytes, version == 256));
		else
			return new Uint8Array(b64(bytes, version == 512));
	};

	window.HashAlgorithm.SHA224.prototype.computeHash = function (bytes) { return computeHash(bytes, 224); };
	window.HashAlgorithm.SHA256.prototype.computeHash = function (bytes) { return computeHash(bytes, 256); };
	window.HashAlgorithm.SHA384.prototype.computeHash = function (bytes) { return computeHash(bytes, 384); };
	window.HashAlgorithm.SHA512.prototype.computeHash = function (bytes) { return computeHash(bytes, 512); };

})();