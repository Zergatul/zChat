(function () {

	var randomDigit = function () {
		return Math.floor(Math.random() * 10);
	};

	var randomNumber = function (len, firstDigit) {
		if (firstDigit == undefined)
			firstDigit = randomDigit();
		var result = firstDigit.toString();
		for (var i = 1; i < len; i++)
			result += randomDigit().toString();
		return result;
	};

	var printResults = function (s, t1, t2) {
		var addInfo;
		if (t1 > t2)
			addInfo = 'other is faster by ' + Math.round(100 * (t1 - t2) / t2) + '%';
		if (t1 < t2)
			addInfo = 'my is faster by ' + Math.round(100 * (t2 - t1) / t1) + '%';
		if (t1 == t2)
			addInfo = 'speed is equal';
		console.log(s + 'my: ' + t1 + ' ms; other: ' + t2 + ' ms; ' + addInfo);
	};

	window._addPerfTest = function () {

		var foo = function (len, count) {
			var num1 = randomNumber(len);
			var num2 = randomNumber(len);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);

			if (a.add(b).toString() != bigInt2str(add(c, d), 10)) {
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
			t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				add(c, d);
			sw.stop();
			t2 = sw.totalElapsed();

			printResults('Number length: ' + len + '; ', t1, t2);
		};

		foo(10, 5000000);
		foo(50, 2000000);
		foo(100, 4000000);
		foo(500, 400000);
		foo(1000, 800000);
	};

	window._substractPerfTest = function () {

		var foo = function (len, count) {
			var num1 = randomNumber(len, 5);
			var num2 = randomNumber(len, 4);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);

			if (a.substract(b).toString() != bigInt2str(sub(c, d), 10)) {
				console.log('Validation failed');
				console.log('a: ' + a.toString());
				console.log('b: ' + b.toString());
				return;
			}

			var sw = new Stopwatch();

			sw.start();
			for (var i = 0; i < count; i++)
				a.substract(b);
			sw.stop();
			t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				sub(c, d);
			sw.stop();
			t2 = sw.totalElapsed();

			printResults('Number length: ' + len + '; ', t1, t2);
		};

		foo(10, 5000000);
		foo(50, 5000000);
		foo(100, 2500000);
		foo(500, 1000000);
		foo(1000, 500000);
	};

	window._multiplyPerfTest = function () {

		var foo = function (len, count) {
			var num1 = randomNumber(len);
			var num2 = randomNumber(len);
			var a = BigInt.parse(num1);
			var b = BigInt.parse(num2);
			var c = str2bigInt(num1, 10);
			var d = str2bigInt(num2, 10);

			if (a.multiply(b).toString() != bigInt2str(mult(c, d), 10)) {
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
			t1 = sw.totalElapsed();
			sw.reset();

			sw.start();
			for (var i = 0; i < count; i++)
				mult(c, d);
			sw.stop();
			t2 = sw.totalElapsed();

			printResults('Number length: ' + len + '; ', t1, t2);
		};

		foo(10, 1000000);
		foo(50, 500000);
		foo(100, 100000);
		foo(500, 20000);
		foo(1000, 10000);
	};

	window._multiplyKaratsubaTest = function (karParamFrom, karParamTo) {

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

	window._tmp = function () {
		var sw = new Stopwatch();

		sw.reset();
		sw.start();
		var x = 123456789;
		for (var i = 0; i < 1000000000; i++)
			var y = x >>> 16;
		sw.stop();
		window.qq = y;
		console.log(sw.totalElapsed());

		sw.reset();
		sw.start();
		var x = 123456789;
		for (var i = 0; i < 1000000000; i++)
			var y = x >> 16;
		sw.stop();
		window.qq = y;
		console.log(sw.totalElapsed());
	};

})();