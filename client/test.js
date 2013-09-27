function test() {
	var len = 1000;
	var ns1 = '7';
	for (var i = 0; i < 2 * len; i++)
		ns1 += Math.floor(Math.random() * 10).toString();
	var ns2 = '3';
	for (var i = 0; i < len; i++)
		ns2 += Math.floor(Math.random() * 10).toString();

	var num1 = BigInt.parse(ns1);
	var num2 = BigInt.parse(ns2);

	var nb1 = str2bigInt(ns1, 10);
	var nb2 = str2bigInt(ns2, 10);

	var numRes = BigInt.mod(num1, num2).toString();
	var nbRes = bigInt2str(mod(nb1, nb2), 10);
	if (numRes == nbRes)
		console.log('Correct!');
	else {
		console.log('Incorrect!');
		return;
	}

	var sw = new Stopwatch();
	var repeatCount = 100;
	sw.start();
	for (var i = 0; i < repeatCount; i++)
		BigInt.mod(num1, num2);
	sw.stop();
	var my = sw.totalElapsed();
	sw.reset();

	sw.start();
	for (var i = 0; i < repeatCount; i++)
		mod(nb1, nb2);
	sw.stop();
	var other = sw.totalElapsed();

	console.log("My: " + my);
	console.log("Other: " + other);
	console.log("Percent: " + Math.round(100 * (my - other) / other) + "%");
}