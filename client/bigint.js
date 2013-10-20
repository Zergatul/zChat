(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	window.BigInt = function () {
		this._data = null;
		this._length = 0;
		this._sign = 0;
	};

	window.BigInt.prototype.isZero = function () {
		return this._sign == 0;
	};

	window.BigInt.prototype.isOne = function () {
		return this._length == 1 && this._data[0] == 1;
	};

	window.BigInt.prototype.isBitSet = function (index) {
		if (index < 0)
			throw 'Invalid argument';

		var dataIndex = index >>> 4;
		var data = this._data;
		var length = data.length;
		if (dataIndex > length)
			return false;

		var bitIndex = index & 0xf;
		return (data[dataIndex] & (1 << bitIndex)) != 0;
	};

	window.BigInt.prototype._setBit = function (index, value) {
		throw 'Not implemented';

		if (index < 0)
			throw 'Invalid argument';
		if (value != 0 && value != 1)
			throw 'Invalid argument';

		var dataIndex = index >>> 4;
		var data = this._data;
		var length = data.length;
		if (dataIndex > length)
			throw 'Not implemented';

		var bitIndex = index & 0xf;
		if (value == 0) {
			data[dataIndex] = data[dataIndex] & ~(1 << bitIndex);
			truncateZeros(this);
		} else
			data[dataIndex] = data[dataIndex] | (1 << bitIndex);
	};

	window.BigInt.prototype.trailingZerosCount = function () {
		var count = 0;
		while (!this.isBitSet(count))
			count++;
		return count;
	};

	window.BigInt.prototype.bitLength = function () {
		var length = this._length;
		if (length == 0)
			return 0;
		var bitLength = length * 16;
		var lastInt16 = this._data[length - 1];
		var mask = 1 << 15;
		while (mask > lastInt16) {
			mask = mask >>> 1;
			bitLength--;
		}

		return bitLength;
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
		var length1 = this._length;
		var length2 = other._length;		
		if (length1 < length2)
			return -1;
		if (length1 > length2)
			return 1;
		var data1 = this._data;
		var data2 = other._data;
		for (var i = length1 - 1; i >= 0; i--) {
			if (data1[i] < data2[i])
				return -1;
			if (data1[i] > data2[i])
				return 1;
		}
		return 0;
	};

	window.BigInt.prototype.absCompareTo = function (val) {
		var length1 = this._length;
		var length2 = val._length;
		if (length1 < length2)
			return -1;
		if (length1 > length2)
			return 1;
		var data1 = this._data;
		var data2 = val._data;
		for (var i = length1 - 1; i >= 0; i--) {
			if (data1[i] < data2[i])
				return -1;
			if (data1[i] > data2[i])
				return 1;
		}
		return 0;
	}

	window.BigInt.prototype.toString = function (radix) {
		if (radix == undefined)
			radix = 10;
		if (radix > 36)
			throw 'Unsupported parameter value';
		if (this._sign == 0)
			return '0';

		var data = this._data;
		if (radix == 2 || radix == 16) {
			var result = '';
			var index = this._length - 1;
			result += data[index--].toString(radix);
			var digitsCount = radix == 2 ? 16 : 4;
			while (index >= 0) {
				var int16 = data[index--].toString(radix);
				if (int16.length < digitsCount)
					int16 = new Array(digitsCount + 1 - int16.length).join('0') + int16;
				result += int16;
			}
			return result;
		}
		{
			throw 'Not implemented';
			// general case
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
		}
	};

	window.BigInt.prototype.clone = function () {
		var result = new BigInt();
		result._data = new Uint16Array(this._length);
		result._data.set(this._data, this._length);
		result._length = this._length;
		result._sign = this._sign;
		return result;
	};

	window.BigInt.prototype.toByteArray = function () {
		var result = new Uint8Array(this._data.length * 2);
		var index = 0;
		for (var i = this._data.length - 1; i >= 0; i--) {
			result[index++] = this._data[i] >>> 8;
			result[index++] = this._data[i] & 0xff;
		}
		return result;
	};

	window.BigInt.prototype.negate = function () {
		if (this._sign == 0)
			return BigInt.ZERO;
		var result = new BigInt();
		var length = this._length;
		var data = new Uint16Array(length);
		data.set(this._data, length);
		result._data = data;
		result._sign = -this._sign;
		return result;
	};

	window.BigInt.prototype.add = function (val) {
		var sign1 = this._sign;
		var sign2 = val._sign;
		if (sign2 == 0)
			return this;
		if (sign1 == 0)
			return val;
		if (sign1 == sign2) {
			var result = absAdd(this, val);
			result._sign = sign1;
			return result;
		} else {
			var cmp = this.absCompareTo(val);
			if (cmp == 0)
				return BigInt.ZERO;
			var result = cmp > 0 ? absSub(this, val) : absSub(val, this);
			result._sign = cmp == sign1 ? 1 : -1;
			return result;
		}
	};

	window.BigInt.prototype.substract = function (val) {
		var sign1 = this._sign;
		var sign2 = val._sign;
		if (sign2 == 0)
			return this;
		if (sign1 == 0)
			return val.negate();
		if (sign1 != sign2) {
			var result = absAdd(this, val);
			result._sign = sign1;
			return result;
		} else {
			var cmp = this.absCompareTo(val);
			if (cmp == 0)
				return BigInt.ZERO;
			var result = cmp > 0 ? absSub(this, val) : absSub(val, this);
			result._sign = cmp == sign1 ? 1 : -1;
			return result;
		}
	};

	window.BigInt.prototype.multiply = function (val) {
		var sign1 = this._sign;
		var sign2 = val._sign;
		if (sign1 == 0 || sign2 == 0)
			return BigInt.ZERO;
		var length = this._length + val._length;
		var data = new Uint16Array(length);
		multGeneral(this, val, data, 0);
		while (data[length - 1] == 0)
			length--;
		result = new BigInt();
		result._data = data;
		result._length = length;
		result._sign = sign1 == sign2 ? 1 : -1;
		return result;
	};

	window.BigInt.ZERO = new BigInt();

	var absAdd = function (num1, num2) {
		var result = new BigInt();
		if (num1._length < num2._length) {
			var buf = num1;
			num1 = num2;
			num2 = buf;
		}

		var data1 = num1._data;
		var data2 = num2._data;
		var length1 = num1._length;
		var length2 = num2._length;
		var data = new Uint16Array(length1 + 1);
		result._data = data;

		var sum = 0;
		for (var i = 0; i < length2; i++) {
			sum = sum + data1[i] + data2[i];
			data[i] = sum & 0xffff;
			sum = sum >>> 16;
		};
		for (var i = length2; i < length1; i++) {
			sum = sum + data1[i];
			data[i] = sum & 0xffff;
			sum = sum >>> 16;
		}
		if (sum > 0) {
			data[length1] = sum;
			result._length = length1 + 1;
		} else
			result._length = length1;

		return result;
	};

	var absSub = function (num1, num2) {
		var result = new BigInt();
		var data1 = num1._data;
		var data2 = num2._data;
		var length1 = num1._length;
		var length2 = num2._length;
		var data = new Uint16Array(length1);
		result._data = data;

		var diff = 0;
		for (var i = 0; i < length1; i++) {
			var diff = diff + data1[i];
			if (i < length2)
				diff -= data2[i];
			if (diff < 0) {
				data[i] = diff + 0x10000;
				diff = -1;
			} else {
				data[i] = diff;
				diff = 0;
			}	
		};

		var length = length1;
		while (data[length - 1] == 0)
			length--;
		result._length = length;

		return result;
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

	var multGeneral = function (num1, num2, acc, shift) {
		var length1 = num1._length;
		var length2 = num2._length;
		if (length1 < length2) {
			var buf = num1;
			num1 = num2;
			num2 = buf;
			buf = length1;
			length1 = length2;
			length2 = buf;
		};

		if (length2 == 0)
			return;
		if (length2 == 1) {
			var sum = 0;
			var int16 = num2._data[0];
			var data1 = num1._data;
			for (var i = 0; i < length1; i++) {
				sum = sum + acc[i + shift] + int16 * data1[i];
				acc[i + shift] = sum & 0xffff;
				sum = sum >>> 16;
			}
			return;
		}
		
		var data1 = num1._data;
		var data2 = num2._data;
		if (length2 <= 16) {
			// O(n^2) algo
			for (var s = 0; s < length1 + length2 - 1; s++)
				for (var i1 = s < length2 ? 0 : s - length2 + 1; i1 <= s && i1 < length1; i1++) {
					var i2 = s - i1;
					var sum = acc[shift + s] + data1[i1] * data2[i2];
					acc[shift + s] = sum & 0xffff;
					acc[shift + s + 1] += sum >>> 16;
				}
		} else {
			// O(n^1.59) algo, http://en.wikipedia.org/wiki/Karatsuba_algorithm
			throw 'Not implemented';
			return multKaratsuba(num1, num2);
		}
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

	window.BigInt.fromInt = function (val) {
		if (val == 0)
			return BigInt.ZERO;

		var result = new BigInt();
		var data = new Uint16Array(2);
		result._data = data;
		if (val < 0) {
			result._sign = -1;
			val = -val;
		} else
			result._sign = 1;

		var length = 0;
		while (val) {
			data[length++] = val & 0xffff;
			val = val >>> 16;
		}
		result._length = length;

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