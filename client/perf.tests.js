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

	window._md5PerfTest = function () {
		var array = new Uint8Array(16);
		for (var i = 0; i < array.length; i++)
			array[i] = random.default.nextUint8();
		var count = 100000;
		var sw = new Stopwatch();
		sw.start();
		for (var i = 0; i < count; i++)
			md5(array);
		sw.stop();

		console.log(count + ' hashes from ' + array.length + ' byte messages in ' + sw.totalElapsed() + ' ms');
	};

	window._sha1PerfTest = function () {
		var array = new Uint8Array(20);
		for (var i = 0; i < array.length; i++)
			array[i] = random.default.nextUint8();
		var count = 100000;
		var sw = new Stopwatch();
		sw.start();
		for (var i = 0; i < count; i++)
			sha1(array);
		sw.stop();

		console.log(count + ' hashes from ' + array.length + ' byte messages in ' + sw.totalElapsed() + ' ms');
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