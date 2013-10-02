(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	window.BigInt = function () {
		this._data = [];
		this._sign = 1;
	};

	window.BigInt.prototype.isZero = function () {
		return this._data.length == 0;
	};

	window.BigInt.prototype.isOne = function () {
		return this._data.length == 1 && this._data[0] == 1;
	};

	window.BigInt.prototype.lessThanZero = function () {
		return !this.isZero() && this._sign == 0;
	};

	window.BigInt.prototype.isBitSet = function (index) {
		if (index < 0)
			throw 'Invalid argument';

		var dataIndex = index >>> 4;
		if (dataIndex > this._data.length)
			return false;

		var bitIndex = index & 0xf;
		return (this._data[dataIndex] & (1 << bitIndex)) != 0;
	};

	window.BigInt.prototype.setBit = function (index, value) {
		if (index < 0)
			throw 'Invalid argument';
		if (value != 0 && value != 1)
			throw 'Invalid argument';

		var dataIndex = index >>> 4;
		while (dataIndex > this._data.length)
			this._data.push(0);

		var bitIndex = index & 0xf;
		if (value == 0) {
			this._data[dataIndex] = this._data[dataIndex] & ~(1 << bitIndex);
			truncateZeros(this);
		} else
			this._data[dataIndex] = this._data[dataIndex] | (1 << bitIndex);
	};

	window.BigInt.prototype.trailingZerosCount = function () {
		var count = 0;
		while (!this.isBitSet(count))
			count++;
		return count;
	};

	window.BigInt.prototype.bitLength = function () {
		if (this.isZero())
			return 0;

		var length = this._data.length * 16;
		var mask = 1 << 15;
		while (mask > this._data[this._data.length - 1]) {
			mask = mask >>> 1;
			length--;
		}

		return length;
	};

	window.BigInt.prototype.isPrime = function () {
		var repeatCount = 20;
		for (var repeat = 0; repeat < repeatCount; repeat++) {
			var a = BigInt.random(this);
			if (!millerRabinPass(a, this))
				return false;
		}

		return true;
	};

	window.BigInt.prototype.compareTo = function (other) {
		if (this._data.length < other._data.length)
			return -1;
		if (this._data.length > other._data.length)
			return 1;
		for (var i = this._data.length - 1; i >= 0; i--) {
			if (this._data[i] < other._data[i])
				return -1;
			if (this._data[i] > other._data[i])
				return 1;
		}
		return 0;
	};

	window.BigInt.prototype.toString = function (radix) {
		if (radix == undefined)
			radix = 10;
		if (radix > 16)
			throw 'Unsupported parameter value';
		if (this.isZero())
			return '0';

		var radixBigInt = BigInt.fromInt(radix);
		var result = '';
		var num = this;
		var length = BigInt.logFloor(this, radix) + 1;
		for (var i = 0; i < length; i++) {
			var dm = divMod(num, radixBigInt);
			result = (dm.mod.isZero() ? '0' : dm.mod._data[0].toString(16)) + result;
			num = dm.div;
		}
		if (this._sign == 0)
			result = '-' + result;
		return result;
	};

	window.BigInt.prototype.clone = function () {
		var result = new BigInt();
		var length = this._data.length;
		result._data = new Array(length);
		for (var i = 0; i < length; i++)
			result._data[i] = this._data[i];
		return result;
	};

	window.BigInt.prototype.toByteArray = function () {
		var result = new Array(this._data.length * 2);
		var index = 0;
		for (var i = this._data.length - 1; i >= 0; i--) {
			result[index++] = this._data[i] >>> 8;
			result[index++] = this._data[i] & 0xff;
		}
		return result;
	};

	var truncateZeros = function (num) {
		while (num._data.length > 0 && num._data[num._data.length - 1] == 0)
			num._data.pop();
	};

	var addAbs = function (num1, num2) {
		var result = new BigInt();
		if (num1._data.length < num2._data.length) {
			var buf = num1;
			num1 = num2;
			num2 = buf;
		}

		var arr1 = num1._data;
		var arr2 = num2._data;
		var n1length = arr1.length;
		var n2length = arr2.length;
		var arr = new Array(n1length);
		result._data = arr;
		var rem = 0;
		for (var i = 0; i < n2length; i++) {
			var sum = rem + arr1[i] + arr2[i];
			arr[i] = sum & 0xffff;
			rem = sum >> 16;
		};
		for (var i = n2length; i < n1length; i++) {
			var sum = rem + arr1[i];
			arr[i] = sum & 0xffff;
			rem = sum >> 16;
		}
		if (rem > 0)
			arr.push(rem);

		return result;
	};

	var subAbs = function (num1, num2) {
		var result = new BigInt();
		result._data = new Array(num1._data.length);

		var rem = 0;
		for (var i = 0; i < num1._data.length; i++) {
			var sub = rem + num1._data[i];
			sub -= i < num2._data.length ? num2._data[i] : 0;
			if (sub < 0) {
				rem = -1;
				sub = sub + 0x10000;
			} else
				rem = 0;
			result._data[i] = sub;
		};

		truncateZeros(result);

		return result;
	};

	var compareAbs = function (num1, num2) {
		if (num1._data.length < num2._data.length)
			return -1;
		if (num1._data.length > num2._data.length)
			return 1;
		for (var i = num1._data.length - 1; i >= 0; i--) {
			if (num1._data[i] < num2._data[i])
				return -1;
			if (num1._data[i] > num2._data[i])
				return 1;
		}
		return 0;
	};

	var cmpWithShift = function (num1, num2, shift) {
		var intPart = shift >>> 4;
		var bitPart = shift & 0xf;
		var num1bl = num1.bitLength();
		var num2bl = num2.bitLength();
		if (num1bl < num2bl + shift)
			return -1;
		if (num1bl > num2bl + shift)
			return 1;
		var n1length = num1._data.length;
		var n2length = num2._data.length;
		for (var i = n1length - 1; i >= 0; i--) {
			var num1Part = num1._data[i];
			var num2Part = 0;
			if (i - intPart < n2length)
				num2Part = (num2._data[i - intPart] << bitPart) & 0xffff;
			if (i - intPart - 1 >= 0)
				num2Part = num2Part | (num2._data[i - intPart - 1] >>> (16 - bitPart));
			if (num1Part > num2Part)
				return 1;
			if (num1Part < num2Part)
				return -1;
		}
		return 0;
	};

	var _subWithShift = function (num1, num2, shift) {
		var intPart = shift >>> 4;
		var bitPart = shift & 0xf;
		var n1length = num1._data.length;
		var n2length = num2._data.length;
		for (var i = 0; i < n2length; i++) {
			num1._data[i + intPart] -= (num2._data[i] << bitPart) & 0xffff;
			if (bitPart != 0 && i + intPart + 1 < n1length)
				num1._data[i + intPart + 1] -= num2._data[i] >>> (16 - bitPart);
		}
		for (var i = intPart; i < n2length + intPart; i++)
			if (num1._data[i] < 0) {
				num1._data[i] += 0x10000;
				num1._data[i + 1]--;
			}
		truncateZeros(num1);
	};

	var shl16Bit = function (num, count) {
		if (num.isZero())
			return num;
		var result = new BigInt();
		for (var i = 0; i < count; i++)
			result._data.push(0);
		for (var i = 0; i < num._data.length; i++)
			result._data.push(num._data[i]);
		return result;
	};

	var divMod = function (num1, num2) {
		var mults = new Array(16);
		for (var i = 0; i < 16; i++)
			mults[i] = multByInt(num2, i);
		num1 = num1.clone();

		var div = new BigInt();
		div._data = new Array(num1._data.length - num2._data.length + 1);
		for (var i = 4 * div._data.length - 1; i >= 0; i--) {
			var nextByte;
			var cmp8 = cmpWithShift(num1, mults[8], i << 2);
			if (cmp8 == 0)
				nextByte = 8;
			else if (cmp8 < 0) {
				var cmp4 = cmpWithShift(num1, mults[4], i << 2);
				if (cmp4 == 0)
					nextByte = 4;
				else if (cmp4 < 0) {
					var cmp2 = cmpWithShift(num1, mults[2], i << 2);
					if (cmp2 == 0)
						nextByte = 2;
					else if (cmp2 < 0) {
						var cmp1 = cmpWithShift(num1, mults[1], i << 2);
						nextByte = cmp1 >= 0 ? 1 : 0;
					} else {
						var cmp3 = cmpWithShift(num1, mults[3], i << 2);
						nextByte = cmp3 >= 0 ? 3 : 2;
					}
				} else { // cmp4 > 0
					var cmp6 = cmpWithShift(num1, mults[6], i << 2);
					if (cmp6 == 0)
						nextByte = 6
					else if (cmp6 < 0) {
						var cmp5 = cmpWithShift(num1, mults[5], i << 2);
						nextByte = cmp5 >= 0 ? 5 : 4;
					} else {
						var cmp7 = cmpWithShift(num1, mults[7], i << 2);
						nextByte = cmp7 >= 0 ? 7 : 6;
					}
				}
			} else { // cmp8 > 0
				var cmp12 = cmpWithShift(num1, mults[12], i << 2);
				if (cmp12 == 0)
					nextByte = 12;
				else if (cmp12 < 0) {
					var cmp10 = cmpWithShift(num1, mults[10], i << 2);
					if (cmp10 == 0)
						nextByte = 10;
					else if (cmp10 < 0) {
						var cmp9 = cmpWithShift(num1, mults[9], i << 2);
						nextByte = cmp9 >= 0 ? 9 : 8;
					} else {
						var cmp11 = cmpWithShift(num1, mults[11], i << 2);
						nextByte = cmp11 >= 0 ? 11 : 10;
					}
				} else { // cmp12 > 0
					var cmp14 = cmpWithShift(num1, mults[14], i << 2);
					if (cmp14 == 0)
						nextByte = 14;
					else if (cmp14 < 0) {
						var cmp13 = cmpWithShift(num1, mults[13], i << 2);
						nextByte = cmp13 >= 0 ? 13 : 12;
					} else {
						var cmp15 = cmpWithShift(num1, mults[15], i << 2);
						nextByte = cmp15 >= 0 ? 15 : 14;
					}
				}
			}

			div._data[i >>> 2] = div._data[i >>> 2] | (nextByte << ((i & 3) << 2));
			_subWithShift(num1, mults[nextByte], i << 2);
		}

		return { div: div, mod: num1 };
	};

	var millerRabinPass = function (a, n) {
		var nMinus1 = BigInt.sub(n, BigInt.fromInt(1));
		var zeroBits = nMinus1.trailingZerosCount();
		var d = BigInt.shr(nMinus1, zeroBits);

		var aToPower = BigInt.modPow(a, d, n);
		if (aToPower.isOne())
			return true;

		for (var i = 0; i < zeroBits - 1; i++) {
			if (aToPower.compareTo(nMinus1) == 0)
				return true;
			aToPower = BigInt.mod(BigInt.mult(aToPower, aToPower), n);
		}
		if (aToPower.compareTo(nMinus1) == 0)
			return true;
		return false;
	};

	var multGeneral = function (num1, num2) {
		if (num1._data.length < num2._data.length) {
			var buf = num1;
			num1 = num2;
			num2 = buf;
		};

		if (num2._data.length == 1)
			return multByInt(num1, num2._data[0]);
		if (num2._data.length <= 16)
			return multn2(num1, num2);
		else
			return multKaratsuba(num1, num2);
	};

	var multn2 = function (num1, num2) {
		var result = new BigInt();
		result._data = new Array(num1._data.length + num2._data.length + 1);
		for (var i = 0; i < result._data.length; i++)
			result._data[i] = 0;

		for (var i1 = 0; i1 < num1._data.length; i1++)
			for (var i2 = 0; i2 < num2._data.length; i2++) {
				var mult = num1._data[i1] * num2._data[i2];
				var index = i1 + i2;
				var val = result._data[index] + mult;
				while (val) {
					result._data[index++] = val & 0xffff;
					val = (val >>> 16) + result._data[index];
				}
			}

		truncateZeros(result);

		return result;
	};

	var multKaratsuba = function (num1, num2) {
		var digits = num2._data.length >>> 1;
		var s1 = split(num1, digits);
		var s2 = split(num2, digits);
		var a0 = s1.n1, a1 = s1.n0, b0 = s2.n1, b1 = s2.n0;

		var a0b0 = multGeneral(a0, b0);
		var a1b1 = multGeneral(a1, b1);
		var m = multGeneral(BigInt.add(a0, a1), BigInt.add(b0, b1));
		m = BigInt.sub(BigInt.sub(m, a0b0), a1b1);
		return BigInt.add(BigInt.add(a0b0, shl16Bit(m, digits)), shl16Bit(a1b1, 2 * digits));
	};

	var multByInt = function (num, intValue) {
		if (intValue == 0)
			return new BigInt();

		var result = new BigInt();
		result._data = new Array(num._data.length + 1);
		for (var i = 0; i < result._data.length; i++)
			result._data[i] = 0;

		for (var i = 0; i < num._data.length; i++) {
			var mult = num._data[i] * intValue;
			var index = i;
			var val = result._data[index] + mult;
			while (val) {
				result._data[index++] = val & 0xffff;
				val = (val >>> 16) + result._data[index];
			}
		}

		truncateZeros(result);

		return result;
	};

	var split = function (num, digits) {
		var n0 = new BigInt();
		n0._data = new Array(num._data.length - digits);
		var n1 = new BigInt();
		n1._data = new Array(digits);

		for (var i = 0; i < digits; i++)
			n1._data[i] = num._data[i];
		for (var i = 0; i < n0._data.length; i++)
			n0._data[i] = num._data[digits + i];

		return { n0: n0, n1: n1 };
	};

	var mQuote = function (b) {
		var a = 0x10000;
		b = 0x10000 - b;
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
			y2 += 0x10000;
		return y2;
	}

	window.BigInt.fromInt = function (num) {
		if (typeof num != 'number')
			throw 'Invalid parameter';
		if (num < -4000000000 || num > 4000000000)
			throw 'Integer value not in range';

		var result = new BigInt();
		if (num < 0) {
			result._sign = 0;
			num = Math.abs(num);
		}

		num = Math.ceil(num);
		result._data = [];
		while (num) {
			result._data.push(num & 0xffff);
			num = num >>> 16;
		}

		return result;
	};

	window.BigInt.fromHex = function (str) {
		var byteArray = bh.hexToByteArray(str);
		if (byteArray.length % 2 == 1)
			byteArray.push(0);
		var result = new BigInt();
		for (var i = byteArray.length / 2 - 1; i >= 0; i--)
			result._data.push((byteArray[(i << 1) + 1] << 8) + byteArray[i << 1]);
		return result;
	};

	window.BigInt.parse = function (str, radix) {
		if (typeof str != 'string')
			throw 'Invalid parameter';
		if (radix == undefined)
			radix = 10;
		if (radix < 2 || radix > 16)
			throw 'Invalid parameter';

		var power = BigInt.fromInt(1);
		var result = new BigInt();
		if (str.charAt(0) == '-') {
			result._sign = 0;
			str = str.substr(1);
		}
		for (var i = str.length - 1; i >= 0; i--) {
			var digit = parseInt(str.charAt(i), 16);
			if (digit >= radix)
				throw 'Invalid symbol';
			result = BigInt.add(result, multByInt(power, digit));
			power = multByInt(power, radix);
		}

		return result;
	};

	window.BigInt.random = function (maxValue) {
		if (!(maxValue instanceof BigInt))
			throw 'Invalid parameter';

		if (maxValue.isZero())
			return new BigInt();

		maxValue = BigInt.sub(maxValue, BigInt.fromInt(1));

		var result = new BigInt();
		var length = maxValue._data.length;
		result._data = new Array(length);
		var canBeAny = false;
		for (var i = length - 1; i >= 0; i--)
			if (canBeAny) {
				result._data[i] = Math.floor(Math.random() * 0x10000);
			} else {
				var part = Math.floor(Math.random() * (maxValue._data[i] + 1));
				if (part < maxValue._data[i])
					canBeAny = true;
				result._data[i] = part;
			}

		truncateZeros(result);

		return result;
	};

	window.BigInt.randomFromInterval = function (minValue, maxValue) {
		if (!(minValue instanceof BigInt) || !(maxValue instanceof BigInt))
			throw 'Invalid parameter';
		if (minValue.compareTo(maxValue) >= 0)
			throw 'First parameter must be smaller then second';

		return BigInt.add(minValue, BigInt.random(BigInt.sub(maxValue, minValue)));
	};

	window.BigInt.randomForBitLength = function (bitLength) {
		var from = new BigInt();
		from.setBit(bitLength, 1);
		var to = new BigInt();
		to.setBit(bitLength + 1, 1);
		return BigInt.randomFromInterval(from, to);
	};

	window.BigInt.randomPrime = function (bitLength) {
		do {
			var bi = BigInt.randomForBitLength(bitLength);
			bi.setBit(0, 1);
		} while (!bi.isPrime());
		return bi;
	};

	window.BigInt.shl = function (num, count) {
		if (!(num instanceof BigInt) || count < 0)
			throw 'Invalid parameters';

		if (count % 16)
			return shl16Bit(num, count / 16);

		throw 'Not implemented';
	};

	window.BigInt.shr = function (num, count) {
		if (!(num instanceof BigInt) || count < 0)
			throw 'Invalid parameters';

		if (count == 0)
			return num;

		var result = new BigInt();
		var count16 = count >>> 4;
		var shift = count & 0xf;
		for (var i = 0; i < num._data.length - count16; i++) {
			var item1 = num._data[i + count16];
			var item2 = i + count16 + 1 < num._data.length ? num._data[i + count16 + 1] : 0;
			result._data.push((item1 >>> shift) | (item2 << (16 - shift)));
		}

		truncateZeros(result);

		return result;
	};

	window.BigInt.add = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num1._sign == num2._sign) {
			var result = addAbs(num1, num2);
			result._sign = num1._sign;
		} else {
			var cmpResult = compareAbs(num1, num2);
			if (cmpResult == 0)
				return new BigInt();
			if (cmpResult < 0) {
				result = subAbs(num2, num1);
				result._sign = num1._sign == 0 ? 1 : 0;
			} else {
				result = subAbs(num1, num2);
				result._sign = num1._sign == 0 ? 0 : 1;
			}
		}

		return result;
	};

	window.BigInt.sub = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num1._sign == num2._sign) {
			var cmpResult = compareAbs(num1, num2);
			if (cmpResult == 0)
				return new BigInt();
			if (cmpResult < 0) {
				result = subAbs(num2, num1);
				result._sign = num1._sign == 0 ? 1 : 0;
			} else {
				result = subAbs(num1, num2);
				result._sign = num1._sign == 0 ? 0 : 1;
			}
		} else {
			var result = addAbs(num1, num2);
			result._sign = num1._sign;
		}

		return result;
	};

	window.BigInt.mult = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num1.isZero() || num2.isZero())
			return new BigInt();

		var result = multGeneral(num1, num2);
		result._sign = num1._sign == num2._sign ? 1 : 0;
		return result;
	};

	window.BigInt.div = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num2.isZero())
			throw 'Division by zero';
		if (num1.compareTo(num2) < 0)
			return new BigInt();

		return divMod(num1, num2).div;
	};

	window.BigInt.mod = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num2.isZero())
			throw 'Division by zero';
		if (num1.compareTo(num2) < 0)
			return num1;

		return divMod(num1, num2).mod;
	};

	window.BigInt.logFloor = function (num, base) {
		if (!(num instanceof BigInt) || !(typeof base == 'number'))
			throw 'Invalid parameters';

		var baseBigInt = BigInt.fromInt(base);
		var power = baseBigInt;
		var result = 0;
		while (power.compareTo(num) <= 0) {
			power = multGeneral(power, baseBigInt);
			result++;
		}

		return result;
	};

	window.BigInt.modPow = function (num, exponent, modulus) {
		if (!(num instanceof BigInt) || !(exponent instanceof BigInt) || !(modulus instanceof BigInt))
			throw 'Invalid parameters';

		var result = BigInt.fromInt(1);
		for (var i = exponent._data.length * 16; i >= 0; i--) {
			result = BigInt.mod(multGeneral(result, result), modulus);
			if (exponent.isBitSet(i))
				result = BigInt.mod(multGeneral(result, num), modulus);
		}

		return result;
	};

	window.BigInt.extendedEuclidean = function (a, b) {
		if (!(a instanceof BigInt) || !(b instanceof BigInt))
			throw 'Invalid arguments';
		if (a.compareTo(b) < 0)
			throw 'a must be greater than b';

		var zero = new BigInt();
		var one = BigInt.fromInt(1);

		if (b.isZero())
			return { d: a, x: one, y: zero };

		var x2 = one, x1 = zero, y2 = zero, y1 = one, x, y, r;
		while (!b.isZero()) {
			var dm = divMod(a, b);
			q = dm.div;
			r = dm.mod;
			x = BigInt.sub(x2, BigInt.mult(q, x1));
			y = BigInt.sub(y2, BigInt.mult(q, y1));
			a = b;
			b = r;
			x2 = x1;
			x1 = x;
			y2 = y1;
			y1 = y;
		}
		return { d: a, x: x2, y: y2 };
	};

	window.BigInt.montgomeryReduction = function (a, b, m) {
		if (!(a instanceof BigInt) || !(b instanceof BigInt) || !(m instanceof BigInt))
			throw 'Invalid argument';

		var modLength = m._data.length;
		var A = new BigInt();
		/*A._data = new Array(modLength);
		for (var i = 0; i < modLength; i++)
			A._data[i] = 0;*/
		var mq = mQuote(m._data[0]);

		for (var i = 0; i < modLength; i++) {
			var a0 = A._data.length > 0 ? A._data[0] : 0;
			var u = ((a0 + a._data[i] * b._data[0]) * mq) & 0xffff;
			A = addAbs(addAbs(A, multByInt(b, a._data[i])), multByInt(m, u));
			A = BigInt.shr(A, 16);
		}
		if (A.compareTo(m) > 0)
			A = subAbs(A, m);
		return A;
	};

})();