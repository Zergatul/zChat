(function () {

	window._BigIntUnitTest = {};

	var applet;

	var findApplet = function () {
		if (!applet)
			applet = document.applets[0];
	};

	var randomNumber = function (len) {
		do {
			var result = random.default.nextBefore(10).toString(); 
		} while (result == '0');
		for (var i = 1; i < len; i++)
			result += random.default.nextBefore(10).toString();
		return result;
	};

	window._BigIntUnitTest.add = function (from, to, count) {
		findApplet();
		from = from || 10;
		to = to || 500;
		count = count || 1000;

		var failed = false;
		for (var i = 0; i < count; i++) {
			var val1 = randomNumber(random.default.nextRange(from, to + 1));
			var val2 = randomNumber(random.default.nextRange(from, to + 1));
			var num1 = BigInt.parse(val1);
			var num2 = BigInt.parse(val2);
			if (num1.add(num2).toString() != applet.add(val1, val2)) {
				console.log('Test ' + (i + 1) + ' failed.');
				console.log(val1);
				console.log(val2);
				failed = true;
				break;
			}
		}
		if (!failed)
			console.log(count + ' tests passed.');
	};

	window._BigIntUnitTest.substract = function (from, to, count) {
		findApplet();
		from = from || 10;
		to = to || 500;
		count = count || 1000;

		var failed = false;
		for (var i = 0; i < count; i++) {
			var val1 = randomNumber(random.default.nextRange(from, to + 1));
			var val2 = randomNumber(random.default.nextRange(from, to + 1));
			var num1 = BigInt.parse(val1);
			var num2 = BigInt.parse(val2);
			if (num1.substract(num2).toString() != applet.substract(val1, val2)) {
				console.log('Test ' + (i + 1) + ' failed.');
				console.log(val1);
				console.log(val2);
				failed = true;
				break;
			}
		}
		if (!failed)
			console.log(count + ' tests passed.');
	};

	window._BigIntUnitTest.multiply = function (from, to, count) {
		findApplet();
		from = from || 1;
		to = to || 100;
		count = count || 1000;

		var failed = false;
		for (var i = 0; i < count; i++) {
			var val1 = randomNumber(random.default.nextRange(from, to + 1));
			var val2 = randomNumber(random.default.nextRange(from, to + 1));
			var num1 = BigInt.parse(val1);
			var num2 = BigInt.parse(val2);
			if (num1.multiply(num2).toString() != applet.multiply(val1, val2)) {
				console.log('Test ' + (i + 1) + ' failed.');
				console.log(val1);
				console.log(val2);
				failed = true;
				break;
			}
		}
		if (!failed)
			console.log(count + ' tests passed.');
	};

	window._BigIntUnitTest.divide = function (from, to, count) {
		findApplet();
		from = from || 1;
		to = to || 100;
		count = count || 1000;

		var failed = false;
		for (var i = 0; i < count; i++) {
			var val1 = randomNumber(random.default.nextRange(from, to + 1));
			var val2 = randomNumber(random.default.nextRange(from, to + 1));
			var num1 = BigInt.parse(val1);
			var num2 = BigInt.parse(val2);
			if (num1.divide(num2).quotient.toString() != applet.divide(val1, val2)) {
				console.log('Test ' + (i + 1) + ' failed.');
				console.log(val1);
				console.log(val2);
				failed = true;
				break;
			}
		}
		if (!failed)
			console.log(count + ' tests passed.');
	};

	window._BigIntUnitTest.mod = function (from, to, count) {
		findApplet();
		from = from || 1;
		to = to || 100;
		count = count || 1000;

		var failed = false;
		for (var i = 0; i < count; i++) {
			var val1 = randomNumber(random.default.nextRange(from, to + 1));
			var val2 = randomNumber(random.default.nextRange(from, to + 1));
			var num1 = BigInt.parse(val1);
			var num2 = BigInt.parse(val2);
			if (num1.mod(num2).toString() != applet.mod(val1, val2)) {
				console.log('Test ' + (i + 1) + ' failed.');
				console.log(val1);
				console.log(val2);
				failed = true;
				break;
			}
		}
		if (!failed)
			console.log(count + ' tests passed.');
	};

	window._BigIntUnitTest.modPow = function (from, to, count) {
		findApplet();
		from = from || 3;
		to = to || 100;
		count = count || 1000;

		var failed = false;
		for (var i = 0; i < count; i++) {
			var len = random.default.nextRange(from, to + 1);
			var val1 = randomNumber(len);
			var val2 = randomNumber(len);
			var val3 = randomNumber(len + 1);
			var num1 = BigInt.parse(val1);
			var num2 = BigInt.parse(val2);
			var num3 = BigInt.parse(val3);
			if (num1.modPow(num2, num3).toString() != applet.modPow(val1, val2, val3)) {
				console.log('Test ' + (i + 1) + ' failed.');
				console.log(val1);
				console.log(val2);
				failed = true;
				break;
			}
		}
		if (!failed)
			console.log(count + ' tests passed.');
	};

})();