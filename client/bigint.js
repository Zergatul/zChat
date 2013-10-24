(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	window.BigInt = function () {
		this._data = null;
		this._length = 0;
		this._sign = 0;
	};

	window.BigInt.prototype.isBitSet = function (index) {
		if (index < 0)
			throw 'Invalid argument';

		var dataIndex = index >>> 4;
		if (dataIndex > this._length)
			return false;

		var bitIndex = index & 0xf;
		return (this._data[dataIndex] & (1 << bitIndex)) != 0;
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

	window.BigInt.prototype.compareTo = function (val) {
		var sign1 = this._sign;
		var sign2 = val._sign;
		if (sign1 < sign2)
			return -1;
		if (sign1 > sign2)
			return 1;
		if (sign1 == 0)
			return 0;
		return sign1 == 1 ? this.unsignedCompareTo(val) : -this.unsignedCompareTo(val);
	};

	window.BigInt.prototype.unsignedCompareTo = function (val) {
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
					int16 = zeros[digitsCount - int16.length] + int16;
				result += int16;
			}
			return result;
		} else {
			var radixLength = digitsPerUint16[radix];
			var radixUint16 = uint16Radix[radix];
			var length = this._length;
			var result = '';
			while (length > 0) {
				var div = divideByUint16(data, length, radixUint16);
				data = div.quotient;
				length = data.length;
				if (data[length - 1] == 0)
					length--;

				var rem = div.remainder.toString(radix);
				if (length > 0 && rem.length < radixLength)
					rem = zeros[radixLength - rem.length] + rem;
				result = rem + result;
			}
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
		var result = new Uint8Array(this._data.length << 1);
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
			var result = unsignedAdd(this, val);
			result._sign = sign1;
			return result;
		} else {
			var cmp = this.unsignedCompareTo(val);
			if (cmp == 0)
				return BigInt.ZERO;
			var result = cmp > 0 ? unsignedSubstract(this, val) : unsignedSubstract(val, this);
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
			var result = unsignedAdd(this, val);
			result._sign = sign1;
			return result;
		} else {
			var cmp = this.unsignedCompareTo(val);
			if (cmp == 0)
				return BigInt.ZERO;
			var result = cmp > 0 ? unsignedSubstract(this, val) : unsignedSubstract(val, this);
			result._sign = cmp == sign1 ? 1 : -1;
			return result;
		}
	};

	window.BigInt.prototype.multiply = function (val) {
		var sign1 = this._sign;
		var sign2 = val._sign;
		if (sign1 == 0 || sign2 == 0)
			return BigInt.ZERO;
		var length1 = this._length;
		var length2 = val._length;
		if (length1 >= length2)
			var data = multGeneral(this._data, length1, val._data, length2);
		else
			var data = multGeneral(val._data, length2, this._data, length1);
		var length = data.length;
		while (data[length - 1] == 0)
			length--;
		result = new BigInt();
		result._data = data;
		result._length = length;
		result._sign = sign1 == sign2 ? 1 : -1;
		return result;
	};

	window.BigInt.prototype.divide = function (val) {
		var sign1 = this._sign;
		var sign2 = val._sign;
		if (sign1 == 0)
			return { quotient: BigInt.ZERO, remainder: BigInt.ZERO };
		if (sign2 == 0)
			throw 'Division by zero';

		var cmp = this.unsignedCompareTo(val);
		if (cmp == -1)
			return { quotient: BigInt.ZERO, remainder: this };
		if (cmp == 0)
			return { quotient: BigInt.ONE, remainder: BigInt.ZERO };

		if (val._length == 1) {
			var div = divideByUint16(this._data, this._length, val._data[0]);
			var q = new BigInt();
			q._sign = 1;
			q._data = div.quotient;
			q._length = div.quotient.length;
			if (div.quotient[q._length - 1] == 0)
				q._length--;
			if (div.remainder != 0) {
				var r = new BigInt();
				r._sign = 1;
				r._data = new Uint16Array(1);
				r._data[0] = div.remainder;
				r._length = 1;
			} else
				var r = BigInt.ZERO;
			return { quotient: q, remainder: r };
		} else {
			var div = divide(this._data.subarray(0, this._length), val._data.subarray(0, val._length));
			var q = new BigInt();
			q._sign = 1;
			q._data = div.quotient;
			q._length = q._data.length;
			if (q._data[q._length - 1] == 0)
				q._length--;
			var r = new BigInt();
			r._length = div.remainder.length;
			if (r._length == 0) {
				r._sign = 0;
			} else {
				r._sign = 1;
				r._data = div.remainder;
			}
			return { quotient: q, remainder: r };
		}
	};

	var unsignedAdd = function (num1, num2) {
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

	var unsignedSubstract = function (num1, num2) {
		var result = new BigInt();
		var data1 = num1._data;
		var data2 = num2._data;
		var length1 = num1._length;
		var length2 = num2._length;
		var data = new Uint16Array(length1);
		result._data = data;

		var carry = 0;
		for (var i = 0; i < length2; i++) {
			var diff = carry + data1[i] - data2[i];
			data[i] = diff & 0xffff;
			carry = diff >> 16;
		};
		for (var i = length2; i < length1; i++) {
			var diff = carry + data1[i];
			data[i] = diff & 0xffff;
			carry = diff >> 16;
		}

		var length = length1;
		while (data[length - 1] == 0)
			length--;
		result._length = length;

		return result;
	};

	// assumes length1 >= length2
	var multGeneral = function (data1, length1, data2, length2) {
		if (length2 == 0)
			return new Uint16Array();

		var result = new Uint16Array(length1 + length2);
		if (length2 == 1) {
			var sum = 0;
			var int16 = data2[0];
			for (var i = 0; i < length1; i++) {
				sum = sum + int16 * data1[i];
				result[i] = sum & 0xffff;
				sum = sum >>> 16;
			}
			if (sum != 0)
				result[i] = sum;
			return result;
		}
		
		// constant can calculate from _multiplyPerfTest
		if (length2 <= 50) {
			// O(n^2) algo
			for (var s = 0; s < length1 + length2 - 1; s++)
				for (var i1 = s < length2 ? 0 : s - length2 + 1; i1 <= s && i1 < length1; i1++) {
					var i2 = s - i1;
					var product = data1[i1] * data2[i2];
					var sum = result[s] + (product & 0xffff);
					result[s] = sum & 0xffff;
					sum = result[s + 1] + (sum >>> 16) + (product >>> 16);
					result[s + 1] = sum & 0xffff;
					sum = sum >>> 16;
					var index = s + 2;
					while (sum != 0) {
						sum = sum + result[index];
						result[index++] = sum & 0xffff;
						sum = sum >>> 16;
					}
				}
			return result;
		} else {
			// O(n^1.59) algo, http://en.wikipedia.org/wiki/Karatsuba_algorithm
			var halfLen = length2 >>> 1;

			var low1 = data1.subarray(0, halfLen);
			var low2 = data2.subarray(0, halfLen);
			var high1 = data1.subarray(halfLen);
			var high2 = data2.subarray(halfLen);

			var z0 = multGeneral(low1, halfLen, low2, halfLen);
			var z0Length = z0.length;
			if (z0[z0Length - 1] == 0)
				z0Length--;

			var sum1 = new Uint16Array(length1 - halfLen + 1);
			sum1.set(high1);
			var sum = 0;
			for (var i = 0; i < halfLen; i++) {
				sum = sum + sum1[i] + low1[i];
				sum1[i] = sum & 0xffff;
				sum = sum >>> 16;
			}
			while (sum != 0) {
				sum = sum + sum1[i];
				sum1[i++] = sum & 0xffff;
				sum = sum >>> 16;
			}
			var sum1Length = sum1[length1 - halfLen] == 0 ? length1 - halfLen : length1 - halfLen + 1;
			var sum2 = new Uint16Array(length2 - halfLen + 1);
			sum2.set(high2);
			var sum = 0;
			for (var i = 0; i < halfLen; i++) {
				sum = sum + sum2[i] + low2[i];
				sum2[i] = sum & 0xffff;
				sum = sum >>> 16;
			}
			if (sum != 0)
				sum2[i++] += sum;
			var sum2Length = sum2[length2 - halfLen] == 0 ? length2 - halfLen : length2 - halfLen + 1;
			var z1 = multGeneral(sum1, sum1Length, sum2, sum2Length);
			var z1Length = z1.length;
			if (z1[z1Length - 1] == 0)
				z1Length--;

			var z2 = multGeneral(high1, length1 - halfLen, high2, length2 - halfLen);
			var z2Length = z2.length;
			if (z2[z2Length - 1] == 0)
				z2Length--;

			// result += z2 << (halfLen * 2)
			result.set(z2, halfLen << 1)
			// result += z0
			result.set(z0, 0);

			// z1 = z1 - z2 - z0
			var diff = 0;
			for (var i = 0; i < z1Length; i++) {
				var sum = diff + z1[i];
				if (i < z2Length)
					sum -= z2[i];
				if (i < z0Length)
					sum -= z0[i];
				if (sum >= 0) {
					z1[i] = sum;
					diff = 0;
				} else
					if (sum >= -0x10000) {
						z1[i] = sum + 0x10000;
						diff = -1;
					} else {
						z1[i] = sum + 0x20000;
						diff = -2;
					}
			}

			// result += z1 << halfLen
			var sum = 0;
			for (var i = 0; i < z1Length; i++) {
				sum = sum + result[i + halfLen] + z1[i];
				result[i + halfLen] = sum & 0xffff;
				sum = sum >>> 16;
			}
			while (sum != 0) {
				sum = sum + result[i + halfLen];
				result[(i++) + halfLen] = sum & 0xffff;
				sum = sum >>> 16;
			}

			return result;
		}
	};

	// assumes divisor is Uint16
	var divideByUint16 = function (data, length, divisor) {
		data = data.subarray(0, length);
		var buf = new Uint16Array(length);
		buf.set(data, 0);
		data = buf;
		var quotient = new Uint16Array(length);
		var index = length - 1;
		while (index >= 0) {
			var d = data[index];
			if (index != length - 1)
				d = d | (data[index + 1] << 16);
			var e = Math.floor(d / divisor);
			quotient[index] = e;

			var diff = data[index] - e * divisor;
			data[index] = diff & 0xffff;

			index--;
		}
		return { quotient: quotient, remainder: data[0] };
	};

	// x - Uint16Array
	// y - Uint16
	// z - Uint16
	// x = x * y + z
	var destructiveMulAdd = function (x, y, z) {
        var length = x.length;

        var carry = 0;
        for (var i = 0; i < length; i++) {
            var product = y * x[i] + carry;
            x[i] = product & 0xffff;
            carry = product >>> 16;
        }

        var sum = x[0] + z;
        x[0] = sum & 0xffff;
        carry = sum >>> 16;
        var index = 1;
        while (carry != 0) {
        	sum = x[index] + carry;
        	x[index++] = sum & 0xffff;
        	carry = sum >>> 16;
        }
	};

	// x - Uint16Array
	// xLen - integer
	// y - Uint16Array
	// yLen - integer
	// shift - integer
	var shiftCompare = function (x, xLen, y, yLen, shift) {
		if (xLen < yLen + shift)
			return -1;
		if (xLen > yLen + shift)
			return 1;
		for (var i = xLen - 1; i >= 0; i--) {
			var xPart = x[i];
			var yPart = y[i - shift];
			if (xPart < yPart)
				return -1;
			if (xPart > yPart)
				return 1;
		}
		return 0;
	};

	var shiftSubstract = function (x, xLen, y, yLen, shift) {
		var carry = 0;
		for (var i = 0; i < yLen; i++) {
			var diff = carry + x[i + shift] - y[i];
			x[i + shift] = diff & 0xffff;
			carry = diff >> 16;
		}
	};

	var multByInt = function (x, xLen, y) {
		var result = new Uint16Array(xLen + 1);
		var sum = 0;
		for (var i = 0; i < xLen; i++) {
			sum = sum + y * x[i];
			result[i] = sum & 0xffff;
			sum = sum >>> 16;
		}
		if (sum != 0) {
			result[i] = sum;
			return result;
		} else
			return result.subarray(0, xLen);
	};

	var divide = function (x, y) {
		var xLen = x.length;
		var yLen = y.length;
		var buf = new Uint16Array(xLen);
		buf.set(x, 0);
		x = buf;
		var q = new Uint16Array(xLen - yLen + 1);

		var shift = xLen - yLen;
		while (shiftCompare(x, xLen, y, yLen, shift) >= 0) {
			q[shift]++;
			shiftSubstract(x, xLen, y, yLen, shift);
			if (x[xLen - 1] == 0)
				xLen--;
		}

		for (var i = xLen - 1; i >= yLen; i--) {
			if (x[i] == y[yLen - 1]) {
				q[i - yLen] = 0xffff;
			} else {
				q[i - yLen] = Math.floor((x[i] * 0x10000 + x[i - 1]) / y[yLen - 1]);
			}
			while (q[i - yLen] * (y[yLen - 1] * 0x10000 + y[yLen - 2] > x[i] * 0x10000 * 0x10000 + x[i - 1] * 0x10000 + x[i - 2])) {
				q[i - yLen]--;
			}
			var delta = multByInt(y, yLen, q[i - yLen]);
			while (shiftCompare(x, xLen, delta, delta.length, i - yLen) < 0) {
				q[i - yLen]--;
				delta = multByInt(y, yLen, q[i - yLen]);
			}
			shiftSubstract(x, xLen, delta, delta.length, i - yLen)
			if (x[xLen - 1] == 0)
				xLen--;
		}

		return { quotient: q, remainder: x.subarray(0, xLen) };
	}

	// ******************************************

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

		return { quotient: div, remainder: num1 };
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

	window.BigInt.parse = function (val, radix) {
		if (radix == undefined)
			radix = 10;
		if (radix < 2 || radix > 36)
			throw 'Invalid parameter';

		if (val == '0')
			return new BigInt();

		var result = new BigInt();
		if (val.charAt(0) == '-') {
			result._sign = -1;
			val = val.substr(1);
		} else
			result._sign = 1;

		var numDigits = val.length;
		var numBits = (numDigits * bitsPerDigit[radix] >>> 10) + 1;
		var length = (numBits + 15) >>> 4;
		var data = new Uint16Array(length);

		var cursor = 0;
		var firstGroupLen = numDigits % digitsPerUint16[radix];
		if (firstGroupLen == 0)
			firstGroupLen = digitsPerUint16[radix];
		var group = val.substring(cursor, cursor += firstGroupLen);
		data[0] = parseInt(group, radix);

		var superRadix = uint16Radix[radix];
		while (cursor < numDigits) {
			group = val.substring(cursor, cursor += digitsPerUint16[radix]);
			var groupVal = parseInt(group, radix);
			destructiveMulAdd(data, superRadix, groupVal);
		}

		result._data = data;
		while (data[length - 1] == 0)
			length--;
		result._length = length;

		return result;
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

	// used by toString
	var digitsPerUint16 = new Uint8Array(37);
	var uint16Radix = new Uint16Array(37);
	for (var i = 2; i < 37; i++) {
		digitsPerUint16[i] = 1;
		uint16Radix[i] = i;
		while (uint16Radix[i] * i <= 0xffff) {
			uint16Radix[i] *= i;
			digitsPerUint16[i]++;
		}
	}
	var zeros = new Array(16);
	for (var i = 0; i < 16; i++)
		zeros[i] = new Array(i + 1).join('0');

	// used by parse
	var bitsPerDigit = new Uint16Array(37);
	for (var i = 2; i < 37; i++)
		bitsPerDigit[i] = Math.ceil(1024 * Math.log(i) / Math.LN2);

	// public constants
	window.BigInt.ZERO = new BigInt();
	window.BigInt.ONE = BigInt.fromInt(1);

})();