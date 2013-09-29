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

	window.unitTest = function () {

		console.log('>>> BigInt.add test');
		console.log('>>> BigInt.sub test');
		console.log('>>> BigInt.mult test');
		console.log('>>> BigInt.mod test');
		for (var i = 0; i < 25; i++) {
			var len = 10 + Math.floor(Math.random() * 1000);
			var aStr = randomNumber(len * 2);
			var bStr = randomNumber(len);
			var a0 = BigInt.parse(aStr);
			var b0 = BigInt.parse(bStr);
			var a1 = str2bigInt(aStr, 10);
			var b1 = str2bigInt(bStr, 10);

			if (BigInt.mod(a0, b0).toString() != bigInt2str(mod(a1, b1), 10)) {
				console.log('Validation failed:');
				console.log('a = ' + aStr);
				console.log('b = ' + bStr);
				return;
			}
		}
		console.log('Passed!');

		console.log('>>> BigInt.extendedEuclidean test');
		for (var i = 0; i < 25; i++) {
			var len = 10 + Math.floor(Math.random() * 1000);
			var aStr = randomNumber(len + 2);
			var bStr = randomNumber(len);
			var a0 = BigInt.parse(aStr);
			var b0 = BigInt.parse(bStr);

			var res = BigInt.extendedEuclidean(a0, b0);
			if (BigInt.add(BigInt.mult(res.x, a0), BigInt.mult(res.y, b0)).compareTo(res.d) != 0) {
				console.log('Validation failed:');
				console.log('a = ' + aStr);
				console.log('b = ' + bStr);
				return;
			}
		}
		console.log('Passed!');
	};
})();