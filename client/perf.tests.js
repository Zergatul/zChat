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

	window.perfTest = function () {

		var num1, num2, a, b, c, d, t1, t2, foo;
		var sw = new Stopwatch();

		console.log('>>> BigInt.add test');
		foo = function (len, count) {
			num1 = randomNumber(len);
			num2 = randomNumber(len);
			a = BigInt.parse(num1);
			b = BigInt.parse(num2);
			c = str2bigInt(num1, 10);
			d = str2bigInt(num2, 10);

			if (BigInt.add(a, b).toString() != bigInt2str(add(c, d), 10)) {
				console.log('Validation failed');
				return;
			}

			sw.start();
			for (var i = 0; i < count; i++)
				BigInt.add(a, b);
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
		/*foo(10, 10000000);
		foo(100, 1000000);
		foo(1000, 100000);*/

		console.log('>>> BigInt.sub test');
		foo = function (len, count) {
			num1 = randomNumber(len, 2);
			num2 = randomNumber(len, 1);
			a = BigInt.parse(num1);
			b = BigInt.parse(num2);
			c = str2bigInt(num1, 10);
			d = str2bigInt(num2, 10);

			if (BigInt.sub(a, b).toString() != bigInt2str(sub(c, d), 10)) {
				console.log('Validation failed');
				return;
			}

			sw.start();
			for (var i = 0; i < count; i++)
				BigInt.sub(a, b);
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
		/*foo(10, 10000000);
		foo(100, 1000000);
		foo(1000, 100000);*/

		console.log('>>> BigInt.mult test');
		foo = function (len, count) {
			num1 = randomNumber(len);
			num2 = randomNumber(len);
			a = BigInt.parse(num1);
			b = BigInt.parse(num2);
			c = str2bigInt(num1, 10);
			d = str2bigInt(num2, 10);

			if (BigInt.mult(a, b).toString() != bigInt2str(mult(c, d), 10)) {
				console.log('Validation failed');
				return;
			}

			sw.start();
			for (var i = 0; i < count; i++)
				BigInt.mult(a, b);
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
		foo(100, 10000);
		foo(1000, 100);

		console.log('>>> BigInt.mod test');
		foo = function (len, count) {
			num1 = randomNumber(len * 2);
			num2 = randomNumber(len);
			a = BigInt.parse(num1);
			b = BigInt.parse(num2);
			c = str2bigInt(num1, 10);
			d = str2bigInt(num2, 10);

			if (BigInt.mod(a, b).toString() != bigInt2str(mod(c, d), 10)) {
				console.log('Validation failed');
				return;
			}

			sw.start();
			for (var i = 0; i < count; i++)
				BigInt.mod(a, b);
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
		foo(10, 1000000);
		foo(100, 10000);
		foo(1000, 100);
	};

})();