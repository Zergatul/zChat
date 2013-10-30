(function () {

	if (BigInt == undefined)
		throw 'bigint.js not loaded';

	window.RSAParameters = function () {
		this.publicKey = null;
		this.privateKey = null;
		this.keyLength = 0;
	};

	window.rsa = {};

	window.rsa.generateKeys = function (keyLength) {
		if (typeof keyLength != 'number' || keyLength < 16)
			throw 'Invalid parameter';

		// generate primes, and check for difference must be > 2^(keyLength / 4)
		do {
			var p = BigInt.randomPrime(keyLength / 2 + random.default.nextRange(1, 4), random.SHA2PRNG);
			var q = BigInt.randomPrime(keyLength / 2 + random.default.nextRange(1, 4), random.SHA2PRNG);
			var delta = p.substract(q);
		} while (delta.bitLength() <= keyLength / 4);

		var n = p.multiply(q);
		var phi = p.substract(BigInt.ONE).multiply(q.substract(BigInt.ONE));

		var e = BigInt.fromInt(65537);
		var euResult = BigInt.extendedEuclidean(phi, e);
		var d = euResult.y;
		if (d.compareTo(BigInt.ZERO) < 0)
			d = d.add(phi);

		var result = new RSAParameters();
		result.keyLength = keyLength;
		result.publicKey = { n: n, e: e };
		result.privateKey = { n: n, d: d };
		return result;
	};

	window.rsa.encode = function (message, params) {
		if (message instanceof Array)
			message = new Uint8Array(message);
		if (!(message instanceof Uint8Array) || !(params instanceof RSAParameters))
			throw 'Invalid parameters';
		if (message.length != 16)
			throw 'Not implemented';

		if (message.length > params.keyLength / 8)
			throw 'Cannot encrypt message which is greater than key';

		var oaep = new OAEP(params.keyLength >> 3, 16, 32);
		var data = oaep.encode(message, random.SHA2PRNG);

		return BigInt.fromUint8Array(data).modPow(params.publicKey.e, params.publicKey.n).toUint8Array();
	};

	window.rsa.decode = function (cypher, params) {
		if (cypher instanceof Array)
			cypher = new Uint8Array(cypher);
		if (!(cypher instanceof Uint8Array) || !(params instanceof RSAParameters))
			throw 'Invalid parameters';

		var data = BigInt.fromUint8Array(cypher).modPow(params.privateKey.d, params.privateKey.n);

		var oaep = new OAEP(params.keyLength >> 3, 16, 32);
		var message = oaep.decode(data.toUint8Array(params.keyLength >> 3));

		return message;
	};

})();