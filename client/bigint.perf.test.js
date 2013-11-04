(function () {

	window._BigIntPerfTest = {};

	var randomNumber = function (len) {
		do {
			var result = random.default.nextBefore(10).toString(); 
		} while (result == '0');
		for (var i = 1; i < len; i++)
			result += random.default.nextBefore(10).toString();
		return result;
	};

	var printResults = function (s, t1, t2, t3) {
		var addInfo;
		var min = Math.min(t1, t2, t3);
		var s1, s2, s3;
		if (min == 0) {
			s1 = '';
			s2 = '';
			s3 = '';
		} else {
			s1 = t1 == min ? '0' : '+' + Math.round(100 * (t1 - min) / min) + '%';
			s2 = t2 == min ? '0' : '+' + Math.round(100 * (t2 - min) / min) + '%';
			s3 = t3 == min ? '0' : '+' + Math.round(100 * (t3 - min) / min) + '%';
		}
		console.log(s + 'my: ' + t1 + ' ms (' + s1 + '); BigInt.js: ' + t2 + ' ms (' + s2 + '); jsbn.js: ' + t3 + ' ms (' + s3 + ');');
	};

	window._BigIntPerfTest.add = function () {

		var foo = function (len, count) {
			var num1 = randomNumber(len);
			var num2 = randomNumber(len);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);
			var e = new BigInteger(num1, 10);
			var f = new BigInteger(num2, 10);

			if (a.add(b).toString() != bigInt2str(add(c, d), 10) || a.add(b).toString() != e.add(f).toString()) {
				console.log('Validation failed');
				console.log('a: ' + a.toString());
				console.log('b: ' + b.toString());
				return;
			}

			var sw = new Stopwatch();

			sw.start();
			for (var i = 0; i < count; i++)
				a.add(b);
			sw.stop();
			var t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				add(c, d);
			sw.stop();
			var t2 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				e.add(f);
			sw.stop();
			var t3 = sw.totalElapsed();
			sw.reset();

			printResults('Bits: ' + a.bitLength() + '; ', t1, t2, t3);
		};

		foo(10, 5000000);
		foo(20, 3500000);
		foo(50, 2000000);
		foo(100, 4000000);
		foo(200, 2000000);
		foo(500, 400000);
		foo(1000, 800000);
	};

	window._BigIntPerfTest.subtract = function () {

		var foo = function (len, count) {
			var num1 = '5' + randomNumber(len - 1);
			var num2 = '4' + randomNumber(len - 1);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);
			var e = new BigInteger(num1, 10);
			var f = new BigInteger(num2, 10);

			if (a.subtract(b).toString() != bigInt2str(sub(c, d), 10) || a.subtract(b).toString() != e.subtract(f).toString()) {
				console.log('Validation failed');
				console.log('a: ' + a.toString());
				console.log('b: ' + b.toString());
				return;
			}

			var sw = new Stopwatch();

			sw.start();
			for (var i = 0; i < count; i++)
				a.subtract(b);
			sw.stop();
			var t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				sub(c, d);
			sw.stop();
			var t2 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				e.subtract(f);
			sw.stop();
			var t3 = sw.totalElapsed();
			sw.reset();

			printResults('Bits: ' + a.bitLength() + '; ', t1, t2, t3);
		};

		foo(10, 5000000);
		foo(20, 3500000);
		foo(50, 2000000);
		foo(100, 4000000);
		foo(200, 2000000);
		foo(500, 400000);
		foo(1000, 800000);
	};

	window._BigIntPerfTest.multiply = function () {

		var foo = function (len, count) {
			var num1 = randomNumber(len);
			var num2 = randomNumber(len);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);
			var e = new BigInteger(num1, 10);
			var f = new BigInteger(num2, 10);

			var r1 = a.multiply(b).toString();
			var r2 = bigInt2str(mult(c, d), 10);
			var r3 = e.multiply(f).toString();

			if (r1 != r2 || r1 != r3) {
				console.log('Validation failed');
				console.log('a: ' + a.toString());
				console.log('b: ' + b.toString());
				return;
			}

			var sw = new Stopwatch();

			sw.start();
			for (var i = 0; i < count; i++)
				a.multiply(b);
			sw.stop();
			var t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				mult(c, d);
			sw.stop();
			var t2 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				e.multiply(f);
			sw.stop();
			var t3 = sw.totalElapsed();
			sw.reset();

			printResults('Bits: ' + a.bitLength() + '; ', t1, t2, t3);
		};

		foo(10, 1000000);
		foo(20, 800000);
		foo(50, 500000);
		foo(100, 100000);
		foo(200, 50000);
		foo(500, 20000);
		foo(1000, 10000);
	};

	window._BigIntPerfTest.divide = function () {

		var foo = function (len, count) {
			var num1 = randomNumber(len * 2);
			var num2 = randomNumber(len);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);

			if (a.divide(b).remainder.toString() != bigInt2str(mod(c, d), 10)) {
				console.log('Validation failed');
				console.log('a: ' + a.toString());
				console.log('b: ' + b.toString());
				return;
			}

			var sw = new Stopwatch();

			sw.start();
			for (var i = 0; i < count; i++)
				a.divide(b);
			sw.stop();
			t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				mod(c, d);
			sw.stop();
			t2 = sw.totalElapsed();

			printResults('Number length: ' + len + '; ', t1, t2);
		};

		foo(10, 400000);
		foo(20, 200000);
		foo(50, 100000);
		foo(100, 100000);
		foo(200, 50000);
		foo(500, 8000);
		foo(1000, 2000);
	};

	window._BigIntPerfTest.randomPrime = function (bitLen, rounds) {
		bitLen = bitLen | 512;
		rounds = rounds | 10;

		var sw = new Stopwatch();
		sw.start();
		for (var i = 0; i < rounds; i++)
			BigInt.randomPrime(bitLen, random.default);
		sw.stop();
		console.log('My: ' + sw.totalElapsed() + 'ms');

		sw.reset();
		sw.start();
		for (var i = 0; i < rounds; i++)
			randProbPrime(bitLen);
		sw.stop();
		console.log('Other: ' + sw.totalElapsed() + 'ms');
	};

	window._BigIntPerfTest.karatsubaParameterTuning = function (karParamFrom, karParamTo) {

		var a = new BigInt();
		a._sign = 1;
		a._length = random.default.nextRange(1000, 2000);
		a._data = random.default.getUint16Array(a._length);

		var b = new BigInt();
		b._sign = 1;
		b._length = random.default.nextRange(1000, 2000);
		b._data = random.default.getUint16Array(b._length);	

		var sw = new Stopwatch();
		for (window.kp = karParamFrom; window.kp <= karParamTo; window.kp += 5) {
			console.log('Param = ' + window.kp);
			sw.reset();
			sw.start();
			for (var i = 0; i < 100; i++)
				a.multiply(b);
			sw.stop();
			console.log(sw.totalElapsed() + 'ms');
		}
	};

})();