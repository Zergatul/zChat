(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	var k = [
		0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
		0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
		0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
		0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
		0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
		0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
		0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
		0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

	var appendLength = function (bytes, length) {
		length *= 8;
		var a = [];
		for (var i = 0; i < 8; i++) {
			a.push(length % 256);
			length = Math.floor(length / 256);
		}
		for (var i = 7; i >= 0; i--)
			bytes.push(a[i]);
	};

	var getChunk = function (bytes) {
		var chunkBytes = bytes.splice(0, 64);
		var chunk = [];
		for (var i = 0; i < 16; i++) {
			var integer =
				chunkBytes[i * 4 + 0] << 24 |
				chunkBytes[i * 4 + 1] << 16 |
				chunkBytes[i * 4 + 2] << 8 |
				chunkBytes[i * 4 + 3];
			chunk.push(integer);
		}
		return chunk;
	};

	var b32 = function (bytes, is256) {

		var length = bytes.length;
		bh.padding(bytes);
		appendLength(bytes, length);

		if (is256) {
			var h0 = 0x6A09E667;
			var h1 = 0xBB67AE85;
			var h2 = 0x3C6EF372;
			var h3 = 0xA54FF53A;
			var h4 = 0x510E527F;
			var h5 = 0x9B05688C;
			var h6 = 0x1F83D9AB;
			var h7 = 0x5BE0CD19;
		} else {
			var h0 = 0xC1059ED8;
			var h1 = 0x367CD507;
			var h2 = 0x3070DD17;
			var h3 = 0xF70E5939;
			var h4 = 0xFFC00B31;
			var h5 = 0x68581511;
			var h6 = 0x64F98FA7;
			var h7 = 0xBEFA4FA4;
		}

		while (bytes.length) {
			var w = getChunk(bytes);
			for (var i = 16; i < 64; i++) {
				var s0 = bh.rotateRight(w[i - 15], 7) ^ bh.rotateRight(w[i - 15], 18) ^ bh.rotateRight(w[i - 15] >>> 3);
				var s1 = bh.rotateRight(w[i - 2], 17) ^ bh.rotateRight(w[i - 2], 19) ^ bh.rotateRight(w[i - 2] >>> 10);
				w.push((w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF);
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
				var t2 = (sigma0 + Ma) & 0xFFFFFFFF;
				var sigma1 = bh.rotateRight(e, 6) ^ bh.rotateRight(e, 11) ^ bh.rotateRight(e, 25);
				var Ch = (e & f) ^ (~e & g);
				var t1 = (h + sigma1 + Ch + k[i] + w[i]) & 0xFFFFFFFF;

				h = g;
				g = f;
				f = e;
				e = (d + t1) & 0xFFFFFFFF;
				d = c;
				c = b;
				b = a;
				a = (t1 + t2) & 0xFFFFFFFF;
			}

			h0 = (h0 + a) & 0xFFFFFFFF;
			h1 = (h1 + b) & 0xFFFFFFFF;
			h2 = (h2 + c) & 0xFFFFFFFF;
			h3 = (h3 + d) & 0xFFFFFFFF;
			h4 = (h4 + e) & 0xFFFFFFFF;
			h5 = (h5 + f) & 0xFFFFFFFF;
			h6 = (h6 + g) & 0xFFFFFFFF;
			h7 = (h7 + h) & 0xFFFFFFFF;
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

	window.sha2 = function (data, version) {

		if (version == undefined)
			version = 256;
		if ([224, 256, 384, 512].indexOf(version) == -1)
			throw 'Unsupported version of SHA-2';

		var bytes = bh.getByteArray(data);
		if (version <= 256)
			return b32(bytes, version == 256);
		else
			throw 'Not implemented';
	};

})();