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