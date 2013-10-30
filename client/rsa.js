(function () {

	if (BigInt == undefined)
		throw 'bigint.js not loaded';

	window.rsa = {};

	window.rsa.generateKeys = function (keyLength) {
		if (typeof keyLength != 'number' || keyLength < 16)
			throw 'Invalid parameter';

		// generate primes, and check for difference must be > 2^(keyLength / 4)
		do {
			var p = BigInt.randomPrime(keyLength / 2, random.SHA2PRNG);
			var q = BigInt.randomPrime(keyLength / 2, random.SHA2PRNG);
			var delta = p.substract(q);
		} while (delta.bitLength() <= keyLength / 4);

		var n = p.multiply(q);
		var phi = p.substract(BigInt.ONE).multiply(q.substract(BigInt.ONE));

		var e = BigInt.fromInt(65537);
		var euResult = BigInt.extendedEuclidean(phi, e);
		var d = euResult.y;
		if (d.compareTo(BigInt.ZERO) < 0)
			d = d.add(phi);

		// checking
		if (!e.multiply(d).mod(phi).equals(BigInt.ONE))
			throw 'Something wrong';

		return {
			publicKey: { n: n, e: e },
			privateKey: { n: n, d: d }
		};
	};

	window.rsa.encrypt = function (message, publicKey) {
		if (!(message instanceof BigInt) || publicKey == undefined || !(publicKey.n instanceof BigInt) || !(publicKey.e instanceof BigInt))
			throw 'Invalid parameters';

		if (message.compareTo(publicKey.n) > 0)
			throw 'Cannot encrypt message which is greater than key';

		return message.modPow(publicKey.e, publicKey.n);
	};

	window.rsa.decrypt = function (cypher, privateKey) {
		if (!(cypher instanceof BigInt) || typeof privateKey == 'undefined' || !(privateKey.n instanceof BigInt) || !(privateKey.d instanceof BigInt))
			throw 'Invalid parameters';

		if (cypher.compareTo(privateKey.n) > 0)
			throw 'Invalid cypher';

		return cypher.modPow(privateKey.d, privateKey.n);
	};

})();