function test(n) {
	var x = BigInt.randomForBitLength(n);
	var y = BigInt.randomForBitLength(n);

	Stopwatch.measureFunction(function () { BigInt.mult(x, y); });
}