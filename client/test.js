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

	/*var n123 = BigInt.fromInt(123);
	var n156 = BigInt.fromInt(156);
	var n233 = BigInt.fromInt(233);
	var mr = BigInt.montgomeryReduction(n123, n156, n233);
	var tt = BigInt.mod(BigInt.mult(n123, n156), n233);
	console.log(mr.toString());
	console.log(tt.toString());*/
	var num1 = BigInt.parse(randomNumber(100));
	var num2 = BigInt.parse(randomNumber(100));

	for (var i = 0; i < 1000000; i++)
		BigInt.add(num1, num2);
}

function extEuclidean(a, b) {
	if (a < b)
		throw '';
	if (b == 0)
		return { d: a, x: 1, y: 0 };
	var x2 = 1, x1 = 0, y2 = 0, y1 = 1, x, y, r;
	while (b > 0) {
		q = Math.floor(a / b);
		r = a - q * b;
		x = x2 - q * x1;
		y = y2 - q * y1;
		a = b;
		b = r;
		x2 = x1;
		x1 = x;
		y2 = y1;
		y1 = y;
	}
	return { d: a, x: x2, y: y2 };
}

function binExtEuclidean(x, y) {
	var g = 1;
	while (x % 2 == 0 && y % 2 == 0) {
		x = x >> 1;
		y = y >> 1;
		g = g << 1;
	}

	var u = x, v = y, a = 1, b = 0, c = 0, d = 1;
	do {
		while (u % 2 == 0) {
			u = u >> 1;
			if (a % 2 == 0 && b % 2 == 0) {
				a = a >> 1;
				b = b >> 1;
			} else {
				a = (a + y) >> 1;
				b = (b - x) >> 1;
			}
		}
		while (v % 2 == 0) {
			v = v >> 1;
			if (c % 2 == 0 && d % 2 == 0) {
				c = c >> 1;
				d = d >> 1;
			} else {
				c = (c + y) >> 1;
				d = (d - x) >> 1;
			}
		}
		if (u >= v) {
			u = u - v;
			a = a - c;
			b = b - d;
		} else {
			v = v - u;
			c = c - a;
			d = d - b;
		}
	} while (u != 0);
	return { x: c, y: d, d: g * v };
}

window.qmQuote = function (b) {
	var a = 10;
	b = 10 - b;
	if (b == 0)
		return { d: a, x: 1, y: 0 };
	var x2 = 1, x1 = 0, y2 = 0, y1 = 1, x, y, r;
	while (b > 0) {
		q = Math.floor(a / b);
		r = a - q * b;
		x = x2 - q * x1;
		y = y2 - q * y1;
		a = b;
		b = r;
		x2 = x1;
		x1 = x;
		y2 = y1;
		y1 = y;
	}
	if (y2 < 0)
		y2 += 10;
	return y2;
}

function divideTest(a, b) {
	var div = a.divide(b);
	if (div.quotient.multiply(b).add(div.remainder).compareTo(a) != 0) {
		console.log('Failed');
		console.log('q: ' + div.quotient.toString());
		console.log('r: ' + div.remainder.toString());
	} else
		console.log('Passed')
}

function divideFuckingShit(check) {
	var num1 = '';
	for (var i = 0; i < 2000; i++)
		num1 += ((i * i * 7 + i * 31 + 3) % 16).toString(16);
	var num2 = '';
	for (var i = 0; i < 1000; i++)
		num2 += ((i * i * 5 + i * 29 + 11) % 16).toString(16);
	var a = BigInt.parse(num1, 16);
	var b = BigInt.parse(num2, 16);

	if (check) {
		var div = a.divide(b);
		if (div.quotient.toString(16) != '4e2215df8f603828f96a7cd8c26c2c003bd08a64932284203b3febccce00afdc99b8399fc54044a8e4e3016862bd0a8769825146870f5d1ddd34f8377a39a9d0963dd45131aad43712d43be6a5467690473ebe92e4af76aa388beb1c7567c53ba04d104234addb1be34e9b21216090795cfa2e741a5898702f149ca3a5f8490bf82e9491d321e58a8a6ce115e370e2ee61707b04c57c1aed7f63700b43e423956ff12b5a9905c685cacb4c84235471fac211f7caca2d40dc4d5517027a278d962f4a1af7a7e4e206446e694ca90c9ab1280a70f1c50bd1990306192236ac5671a47ea74d536ff4be3a1904dcebf6187bf4c60d6bde4a58c1cc546ee7e76ff5b2d21476cc95c296c82f850a835aa10a176d1443e5b2429bef9c5dc0b63b632f049afef9396e3c3f692707ba31a470b83bdb6e62ae3470386c8e01819b0ec43534dc9f53b4668e00c1a07b36452f328f0411e9f5a99d147232d9cd7ce84774d50884ec0f622f4aef4116c829ce8696519e15c302503709d071b8b9d7bd5130cb2be0f7b5ae2631c11ce5b78b9c89658bce70cefb7646e81b8153e98416281bf9b7ba9767366d82d048efbd0b09a5453fff1ee61f73c94b6800a1b011cba6316f8c45aec56c5ff9fd193cc868e9a0e4d04f2f3d972c0aafb3660ac6d5bf7942b6abc5010cb1351d90f09598de5efa4e15a667e9871d') {
			console.log('Failed');
			return;
		}
		if (div.remainder.toString(16) != 'aea94398f063f537cc1a42514646671a18b26d64031d032fcb7921b052c5e2fae04ada61b9459e08c480e20075f4ecc4bfbf2788f2572e516e5cb8ff32f14473d54beffb3341e3b549b441293b1b0cc985b106d7a3ebe213cf112aeb6bec34623f0c21e777ee9ae097728e1480c34b3cdd081202196b66f7e1a2f2f5a0cdb7ecc1ff6ae5e068e83808370fed019fd3ca9f28596597ffcf9eb5a21ae2e7ae03a92912ff07b6105fb7024e3d8607ca2ccc32324e676931c4a945e7587e862c19c430674c550cdae9f06181907b911428cf425f9ef51aabdefeec858a38536139c86718b2fe970c6ece273f3a195ddfa0234e352854a1c3b6534bcbab18cdfead72dd1c36aa7c5ff24fc04492889541415389271e2546ff979a20204a8d6f0b2c1e86367ff06492e9ff1cd99716621cc62053793b231cc53791643dca5ec399cb9c6e52e6b109f5c3d965cb2671edce39979f64b8a193f73efc0d7f1778f15604a0f3ff275a50da7926b1444c5290af4ff25c45146242c38483c2735c4bd0374ad782d13eebf7f9e3f2fd5383afc28f1ca4fb55f2e854538b5f002f65d20c396247233bae6d2e1fcb095f55e943792967ba07d14a10b47c62e055af7c9a368f36191418095639549b89bd6ba943468059a095d3fee183c82c199359d97b6b09e8980c4778e579c69cbd69f2c954eefd0ef45422aa4c') {
			console.log('Failed');
			return;
		}
	}

	var sw = new Stopwatch();
	sw.start();
	for (var i = 0; i < 300; i++)
		a.divide(b);
	sw.stop();
	console.log(sw.totalElapsed() + 'ms');
};

function profiling(my) {
	if (my)
		for (var i = 0; i < 100; i++)
			BigInt.randomPrime(128, random.default);
	else
		for (var i = 0; i < 100; i++)
			randProbPrime(128);
};

function fieldTest() {
	var o1 = { a: 0 };
	var o2 = { yuyoqytoiyrtqeyrtoeyriotyerityqeirytieurytweyrtouer: 0 };

	var sw = new Stopwatch();
	sw.start();
	for (var i = 0; i < 1000000000; i++)
		o1.a++;
	sw.stop();
	console.log(sw.totalElapsed());
	sw.reset();

	sw.start();
	for (var i = 0; i < 1000000000; i++)
		o2.yuyoqytoiyrtqeyrtoeyriotyerityqeirytieurytweyrtouer++;
	sw.stop();
	console.log(sw.totalElapsed());
}