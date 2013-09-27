function test() {
	
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

	var a = BigInt.parse(randomNumber(100));
	var b = BigInt.parse(randomNumber(50));

	console.log(BigInt.newMod(a, b).toString());
	console.log(BigInt.mod(a, b).toString());
}