(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';
	if (HashAlgorithm == undefined)
		throw 'hash.algorithm.js not loaded';

	window.MD4 = function () {};
	window.MD4.prototype = new HashAlgorithm();
	window.MD4.prototype.hashSize = 128;

	window.hashAlgorithms.md4 = new MD4();

	//
	// round 1 left rotates
	//
	var S11 = 3;
	var S12 = 7;
	var S13 = 11;
	var S14 = 19;

	//
	// round 2 left rotates
	//
	var S21 = 3;
	var S22 = 5;
	var S23 = 9;
	var S24 = 13;

	//
	// round 3 left rotates
	//
	var S31 = 3;
	var S32 = 9;
	var S33 = 11;
	var S34 = 15;

	// functions
	var F = function (u, v, w) {
		return (u & v) | (~u & w);
	}
	var G = function (u, v, w) {
		return (u & v) | (u & w) | (v & w);
	};
	var H = function (u, v, w) {
		return u ^ v ^ w;
	};

	window.MD4.prototype.computeHash = function (bytes) {

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

		var a = 0x67452301;
        var b = 0xefcdab89;
        var c = 0x98badcfe;
        var d = 0x10325476;

        var x = new Int32Array(16);
		var chunksCount = bytes.length >>> 6;

		for (var chunk = 0; chunk < chunksCount; chunk++) {

			for (var i = 0; i < 16; i++)
				x[i] = bh.bytesToIntLE(bytes, (chunk << 6) + (i << 2));

			var aa = a;
			var bb = b;
			var cc = c;
			var dd = d;

			a = bh.rotateLeft((a + F(b, c, d) + x[ 0]), S11);
            d = bh.rotateLeft((d + F(a, b, c) + x[ 1]), S12);
            c = bh.rotateLeft((c + F(d, a, b) + x[ 2]), S13);
            b = bh.rotateLeft((b + F(c, d, a) + x[ 3]), S14);
            a = bh.rotateLeft((a + F(b, c, d) + x[ 4]), S11);
            d = bh.rotateLeft((d + F(a, b, c) + x[ 5]), S12);
            c = bh.rotateLeft((c + F(d, a, b) + x[ 6]), S13);
            b = bh.rotateLeft((b + F(c, d, a) + x[ 7]), S14);
            a = bh.rotateLeft((a + F(b, c, d) + x[ 8]), S11);
            d = bh.rotateLeft((d + F(a, b, c) + x[ 9]), S12);
            c = bh.rotateLeft((c + F(d, a, b) + x[10]), S13);
            b = bh.rotateLeft((b + F(c, d, a) + x[11]), S14);
            a = bh.rotateLeft((a + F(b, c, d) + x[12]), S11);
            d = bh.rotateLeft((d + F(a, b, c) + x[13]), S12);
            c = bh.rotateLeft((c + F(d, a, b) + x[14]), S13);
            b = bh.rotateLeft((b + F(c, d, a) + x[15]), S14);

            //
            // Round 2 - G cycle, 16 times.
            //
            a = bh.rotateLeft((a + G(b, c, d) + x[ 0] + 0x5a827999), S21);
            d = bh.rotateLeft((d + G(a, b, c) + x[ 4] + 0x5a827999), S22);
            c = bh.rotateLeft((c + G(d, a, b) + x[ 8] + 0x5a827999), S23);
            b = bh.rotateLeft((b + G(c, d, a) + x[12] + 0x5a827999), S24);
            a = bh.rotateLeft((a + G(b, c, d) + x[ 1] + 0x5a827999), S21);
            d = bh.rotateLeft((d + G(a, b, c) + x[ 5] + 0x5a827999), S22);
            c = bh.rotateLeft((c + G(d, a, b) + x[ 9] + 0x5a827999), S23);
            b = bh.rotateLeft((b + G(c, d, a) + x[13] + 0x5a827999), S24);
            a = bh.rotateLeft((a + G(b, c, d) + x[ 2] + 0x5a827999), S21);
            d = bh.rotateLeft((d + G(a, b, c) + x[ 6] + 0x5a827999), S22);
            c = bh.rotateLeft((c + G(d, a, b) + x[10] + 0x5a827999), S23);
            b = bh.rotateLeft((b + G(c, d, a) + x[14] + 0x5a827999), S24);
            a = bh.rotateLeft((a + G(b, c, d) + x[ 3] + 0x5a827999), S21);
            d = bh.rotateLeft((d + G(a, b, c) + x[ 7] + 0x5a827999), S22);
            c = bh.rotateLeft((c + G(d, a, b) + x[11] + 0x5a827999), S23);
            b = bh.rotateLeft((b + G(c, d, a) + x[15] + 0x5a827999), S24);

            //
            // Round 3 - H cycle, 16 times.
            //
            a = bh.rotateLeft((a + H(b, c, d) + x[ 0] + 0x6ed9eba1), S31);
            d = bh.rotateLeft((d + H(a, b, c) + x[ 8] + 0x6ed9eba1), S32);
            c = bh.rotateLeft((c + H(d, a, b) + x[ 4] + 0x6ed9eba1), S33);
            b = bh.rotateLeft((b + H(c, d, a) + x[12] + 0x6ed9eba1), S34);
            a = bh.rotateLeft((a + H(b, c, d) + x[ 2] + 0x6ed9eba1), S31);
            d = bh.rotateLeft((d + H(a, b, c) + x[10] + 0x6ed9eba1), S32);
            c = bh.rotateLeft((c + H(d, a, b) + x[ 6] + 0x6ed9eba1), S33);
            b = bh.rotateLeft((b + H(c, d, a) + x[14] + 0x6ed9eba1), S34);
            a = bh.rotateLeft((a + H(b, c, d) + x[ 1] + 0x6ed9eba1), S31);
            d = bh.rotateLeft((d + H(a, b, c) + x[ 9] + 0x6ed9eba1), S32);
            c = bh.rotateLeft((c + H(d, a, b) + x[ 5] + 0x6ed9eba1), S33);
            b = bh.rotateLeft((b + H(c, d, a) + x[13] + 0x6ed9eba1), S34);
            a = bh.rotateLeft((a + H(b, c, d) + x[ 3] + 0x6ed9eba1), S31);
            d = bh.rotateLeft((d + H(a, b, c) + x[11] + 0x6ed9eba1), S32);
            c = bh.rotateLeft((c + H(d, a, b) + x[ 7] + 0x6ed9eba1), S33);
            b = bh.rotateLeft((b + H(c, d, a) + x[15] + 0x6ed9eba1), S34);

            a = (a + aa) & 0xffffffff;
            b = (b + bb) & 0xffffffff;
            c = (c + cc) & 0xffffffff;
            d = (d + dd) & 0xffffffff;
		}

		return new Uint8Array([].concat(
			bh.intToBytesLE(a)).concat(
			bh.intToBytesLE(b)).concat(
			bh.intToBytesLE(c)).concat(
			bh.intToBytesLE(d)));
	};

})();