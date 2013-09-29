(function () {

	if (BigInt == undefined)
		throw 'bigint.js not loaded';

	window.rsa = {};

	window.rsa.generateKeys = function (keyLength) {
		if (typeof keyLength != 'number' || keyLength < 16)
			throw 'Invalid parameter';

		// generate primes, and check for difference must be > 2^(keyLength / 4)
		do {
			var p = BigInt.randomPrime(keyLength / 2);
			var q = BigInt.randomPrime(keyLength / 2);
			var delta = BigInt.sub(p, q);
		} while (delta.bitLength() <= keyLength / 4);

		var one = BigInt.fromInt(1);

		var n = BigInt.mult(p, q);
		var phi = BigInt.mult(BigInt.sub(p, one), BigInt.sub(q, one));

		var e = BigInt.fromInt(65537);
		var euResult = BigInt.extendedEuclidean(phi, e);
		var d = euResult.y;
		if (d.lessThanZero())
			d = BigInt.add(d, phi);

		// checking
		if (BigInt.mod(BigInt.mult(e, d), phi).compareTo(one) != 0)
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

		return BigInt.modPow(message, publicKey.e, publicKey.n);
	};

	window.rsa.decrypt = function (cypher, privateKey) {
		if (!(cypher instanceof BigInt) || typeof privateKey == 'undefined' || !(privateKey.n instanceof BigInt) || !(privateKey.d instanceof BigInt))
			throw 'Invalid parameters';

		if (cypher.compareTo(privateKey.n) > 0)
			throw 'Invalid cypher';

		return BigInt.modPow(cypher, privateKey.d, privateKey.n);
	};

})();