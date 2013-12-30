(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	// ****************************************************************************************
	// ****************************************************************************************
	// constructor
	// ****************************************************************************************
	// ****************************************************************************************

	window.BigInt = function () {
		this._data = null;
		this._length = 0;
		this._sign = 0;
	};

	// ****************************************************************************************
	// ****************************************************************************************
	// instance methods
	// ****************************************************************************************
	// ****************************************************************************************

	window.BigInt.prototype.isBitSet = function (index) {
		if (index < 0)
			throw 'Invalid argument';

		var dataIndex = index >>> 4;
		if (dataIndex > this._length)
			return false;

		var bitIndex = index & 0xf;
		return (this._data[dataIndex] & (1 << bitIndex)) != 0;
	};

	window.BigInt.prototype.bitLength = function () {
		if (this._sign == 0)
			return 0;
		var length = this._length;
		var bitLength = length << 4;
		var lastInt16 = this._data[length - 1];
		var mask = 1 << 15;
		while (mask > lastInt16) {
			mask = mask >>> 1;
			bitLength--;
		}

		return bitLength;
	};

	window.BigInt.prototype.isProbablePrime = function () {
		if (this._sign <= 0)
			return false;
		if (this._length <= 2)
			return this.isPrime();
		if (!this.isBitSet(0))
			return false;

		// skip firstPrimes[0] == 2, i begins from 1
		for (var i = 1; i < firstPrimes.length; i++)
			if (divideByUint16(this._data, this._length, firstPrimes[i]).remainder == 0)
				return false;

		var bitLength = this._length * 16;
		var repeatCount;
		// probability < 1 / (2^80)
		if (bitLength >= 600)
			repeatCount = 2;
		else if (bitLength >= 550)
			repeatCount = 4;
		else if (bitLength >= 500)
			repeatCount = 5;
		else if (bitLength >= 400)
			repeatCount = 6;
		else if (bitLength >= 350)
			repeatCount = 7;
		else if (bitLength >= 300)
			repeatCount = 9;
		else if (bitLength >= 250)
			repeatCount = 12;
		else if (bitLength >= 200)
			repeatCount = 15;
		else if (bitLength >= 150)
			repeatCount = 18;
		else if (bitLength >= 100)
			repeatCount = 27;
		else
			repeatCount = 50;

		return passesMillerRabin(this, repeatCount) && passesLucasLehmer(this);
	};

	window.BigInt.prototype.isPrime = function () {
		if (this._sign == 0)
			return false;
		if (this._length <= 2) {
			var intValue = this._data[0];
			if (this._length == 2)
				intValue = intValue | (this._data[1] << 16);
			if (intValue <= firstPrimes[firstPrimes.length - 1]) {
				for (var i = 0; i < firstPrimes.length; i++)
					if (firstPrimes[i] == intValue)
						return true;
				return false;
			}
			var sqrt = Math.floor(Math.sqrt(intValue));
			for (var i = 2; i <= sqrt; i++)
				if (intValue % i == 0)
					return false;
			return true;
		} else
			throw 'Not implemented';
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
	};

	window.BigInt.prototype.equals = function (val) {
		//
		return this.compareTo(val) == 0;
	};

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
			return this._sign == -1 ? '-' + result : result;
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
			return this._sign == -1 ? '-' + result : result;
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

	window.BigInt.prototype.toUint8Array = function (length) {
		var dataLength = this._length << 1;
		if (this._data[this._length - 1] < 256)
			dataLength--;
		var result = new Uint8Array(length || dataLength);
		for (var i = result.length - 1; i >= 0; i--) {
			var index = result.length - i - 1;
			if (index >= 0 && (index >> 1) < this._length)
				if ((index & 1) == 1)
					result[i] = this._data[index >> 1] >> 8;
				else
					result[i] = this._data[index >> 1] & 0xff;
		}
		return result;
	};

	window.BigInt.prototype.negate = function () {
		if (this._sign == 0)
			return BigInt.ZERO;
		var result = new BigInt();
		var length = this._length;
		var data = new Uint16Array(length);
		for (var i = 0; i < length; i++)
			data[i] = this._data[i];
		result._data = data;
		result._sign = -this._sign;
		result._length = length;
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
			var result = cmp > 0 ? unsignedSubtract(this, val) : unsignedSubtract(val, this);
			result._sign = cmp == sign1 ? 1 : -1;
			return result;
		}
	};

	window.BigInt.prototype.subtract = function (val) {
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
			var result = cmp > 0 ? unsignedSubtract(this, val) : unsignedSubtract(val, this);
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
			q._length = div.quotient.length;
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

	window.BigInt.prototype.mod = function (val) {
		//
		return this.divide(val).remainder;
	};

	window.BigInt.prototype.modPow = function (exponent, m) {
		if (m._sign <= 0)
			throw 'Modulus not positive';
		if (exponent._sign == 0)
			return m.compareTo(BigInt.ONE) == 0 ? BigInt.ZERO : BigInt.ONE;
		if (this.compareTo(BigInt.ONE) == 0)
			return m.compareTo(BigInt.ONE) == 0 ? BigInt.ZERO : BigInt.ONE;
        var base = this.compareTo(m) >= 0 ? this.mod(m) : this;

        if (m.isBitSet(0)) {
        	// if modulus is odd - use montgomery exponentiation
	    	var l = m._length;
			var r = new BigInt();
			r._length = l + 1;
			r._data = new Uint16Array(l + 1);
			r._data[l] = 1;
			r._sign = 1;

			var x = new Uint16Array(l);
			x.set(this._data.subarray(0, l), 0);

			var mPrime = -extendedEuclideanInt32(0x10000, m._data[0]).y;
			if (mPrime < 0)
				mPrime = mPrime + 0x10000;

			var xPrime = this.multiply(r).mod(m)._data;
			var buf = new Uint16Array(l);
			buf.set(xPrime, 0);
			xPrime = buf;

			var a = r.mod(m)._data;
			var buf = new Uint16Array(l);
			buf.set(a, 0);
			a = buf;

			m = m._data.subarray(0, m._length);

			for (var i = exponent.bitLength() - 1; i >= 0; i--) {
				a = montgomeryMultiplication(a, a, m, mPrime);
				if (exponent.isBitSet(i))
					a = montgomeryMultiplication(a, xPrime, m, mPrime);
			}
			var one = new Uint16Array(l);
			one[0] = 1;
			a = montgomeryMultiplication(a, one, m, mPrime);
			
			while (a[l - 1] == 0)
				l--;
			var result = new BigInt();
			result._sign = 1;
			result._data = a;
			result._length = l;
        } else {
	    	var result = BigInt.ONE;
			for (var i = exponent.bitLength() - 1; i >= 0; i--) {
				result = result.multiply(result).mod(m);
				if (exponent.isBitSet(i))
					result = result.multiply(base).mod(m);
			}
		}

		return result;
	};

	window.BigInt.prototype.shiftRight = function (shift) {
		if (shift == 0)
			return this;

		var result = new BigInt();
		result._sign = 1;
		var shift16 = shift >>> 4;
		var shiftBits = shift & 0xf;
		var length = this._length;
		var resultLength = length - shift16;
		var data = new Uint16Array(length - shift16);
		for (var i = 0; i < resultLength; i++) {
			var item1 = this._data[i + shift16];
			var item2 = i + shift16 + 1 < this._data.length ? this._data[i + shift16 + 1] : 0;
			data[i] = (item1 >>> shiftBits) | (item2 << (16 - shiftBits));
		}

		if (data[resultLength - 1] == 0)
			resultLength--;
		result._length = resultLength;
		result._data = data;

		return result;
	};

	// ****************************************************************************************
	// ****************************************************************************************
	// private methods
	// ****************************************************************************************
	// ****************************************************************************************

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

	var unsignedSubtract = function (num1, num2) {
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

	// data - Uint16Array
	// length - Int32
	// divisor - Uint16
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
				d = d + data[index + 1] * 0x10000;
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
	// xLen - Int32
	// y - Uint16Array
	// yLen - Int32
	// shift - Int32
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
		if (carry != 0)
			x[i + shift] += carry;
	};

	// x - Uint16Array
	// xLen - Int32
	// y - Uint16Array
	// yLen - Int32
	// m - Uint16
	// shift - Int32
	// x = x - ((y * m) << shift)
	// returns:
	//		true - if x >= 0
	//		false - if x < 0
	var shiftSubstractLinComb = function (x, xLen, y, yLen, m, shift) {
		var carry = 0;
		for (var i = 0; i < yLen; i++) {
			var mult = y[i] * m + carry;
			var diff = x[i + shift] - (mult & 0xffff);
			x[i + shift] = diff & 0xffff;
			carry = (mult >>> 16) - (diff >> 16);
		}
		if (carry != 0)
			if (i + shift == xLen)
				return false;
			else {
				var diff = x[i + shift] - carry;
				x[i + shift] = diff & 0xffff;
				return diff >= 0;
			}
		else
			return true;
	};

	var shiftNegativeAdd = function (x, xLen, y, yLen, shift) {
		var carry = 0;
		for (var i = 0; i < yLen; i++) {
			var sum = carry + x[i + shift] + y[i];
			x[i + shift] = sum & 0xffff;
			carry = sum >>> 16;
		}
		if (i + shift < xLen)
			x[i + shift] += carry;
	};

	var divide = function (x, y) {
		var xLen = x.length + 1;
		var yLen = y.length;

		// clone arrays
		var buf = new Uint16Array(xLen);
		buf.set(x, 0);
		x = buf;
		buf = new Uint16Array(yLen);
		buf.set(y, 0);
		y = buf;

		// calculate normalizing shift
		var gamma = 0;
		var yLead = y[yLen - 1];
		while ((yLead & 0x8000) == 0) {
			yLead = yLead << 1;
			gamma++;
		}

		// shift y
		y[yLen - 1] = y[yLen - 1] << gamma;
		for (var i = yLen - 2; i >= 0; i--) {
			y[i + 1] = y[i + 1] | (y[i] >>> (16 - gamma));
			y[i] = y[i] << gamma;
		}
		// shift x
		for (var i = xLen - 2; i >= 0; i--) {
			x[i + 1] = x[i + 1] | (x[i] >>> (16 - gamma));
			x[i] = x[i] << gamma;
		}
		while (x[xLen - 1] == 0)
			xLen--;

		var q = new Uint16Array(xLen - yLen + 1);

		while (shiftCompare(x, xLen, y, yLen, xLen - yLen) >= 0) {
			q[xLen - yLen]++;
			shiftSubstract(x, xLen, y, yLen, xLen - yLen);
			if (x[xLen - 1] == 0)
				xLen--;
		}

		var yFirst = y[yLen - 1];
		var ySecond = y[yLen - 2];
		var qNext;
		for (var i = xLen - 1; i >= yLen; i--) {
			if (x[i] == yFirst)
				qNext = 0xffff;
			else
				qNext = Math.floor((x[i] * 0x10000 + x[i - 1]) / yFirst);
			while (true) {
				var left2 = ySecond * qNext;
				var left1 = (left2 >>> 16) + yFirst * qNext;
				var left0 = (left1 >>> 16) - x[i];
				left1 = (left1 & 0xffff) - x[i - 1];
				left2 = (left2 & 0xffff) - x[i - 2];
				if (left0 < 0)
					break;
				else
					if (left0 == 0)
						if (left1 < 0)
							break;
						else
							if (left1 == 0 && left2 <= 0)
								break;
				qNext--;
			}
			if (!shiftSubstractLinComb(x, xLen, y, yLen, qNext, i - yLen)) {
				qNext--;
				shiftNegativeAdd(x, xLen, y, yLen, i - yLen);
			}
			q[i - yLen] = qNext;
			while (x[xLen - 1] == 0)
				xLen--;
		}

		var qLen = q.length;
		while (q[qLen - 1] == 0)
			qLen--;

		// shift back normalization of x
		x[0] = x[0] >>> gamma;
		for (var i = 1; i < xLen; i++) {
			x[i - 1] = x[i - 1] | (x[i] << (16 - gamma));
			x[i] = x[i] >>> gamma;
		}
		while (x[xLen - 1] == 0)
			xLen--;

		return { quotient: q.subarray(0, qLen), remainder: x.subarray(0, xLen) };
	};

	var passesMillerRabin = function (x, count) {
		var xMinusOne = x.subtract(BigInt.ONE);
		var shift = 1;
		while (!x.isBitSet(shift))
			shift++;
		var m = x.shiftRight(shift);
		var bitLength = x.bitLength();

		for (var i = 0; i < count; i++) {
			do {
				var b = BigInt.random(bitLength, Random.Default);
			} while (b._sign == 0 || b.compareTo(x) >= 0);

			var j = 0;
			var z = b.modPow(m, x);
			while (!((j == 0 && z.compareTo(BigInt.ONE) == 0) || z.compareTo(xMinusOne) == 0)) {
				if (j > 0 && z.compareTo(BigInt.ONE) == 0 || ++j == shift)
					return false;
				z = z.multiply(z).mod(x);
			}
		}

		return true;
	};

	var passesLucasLehmer = function (x) {
		return true;
	};

	// x - Uint16Array
	// y - Uint16Array
	// m - Uint16Array (odd)
	// x, y, m - have equal length
	// mInv - Uint16 (mInv = -(1 / m) mod 0x10000)
	var montgomeryMultiplication = function (x, y, m, mInv) {
		var length = m.length;
		var result = new Uint16Array(length + 2);
		for (var i = 0; i < length; i++) {
			// u = (a0 + xi * y0) * mInv mod b
			var u = (((result[0] + x[i] * y[0]) & 0xffff) * mInv) & 0xffff;
			// A = A + xi * y
			var carry = 0;
			for (var j = 0; j < length; j++) {
				var sum = carry + result[j] + x[i] * y[j];
				carry = sum >>> 16;
				result[j] = sum & 0xffff;
			}
			var sum = result[length] + carry;
			result[length] = sum & 0xffff;
			result[length + 1] += sum >>> 16;
			// A = A + u * m
			var carry = 0;
			for (var j = 0; j < length; j++) {
				var sum = carry + result[j] + u * m[j];
				carry = sum >>> 16;
				result[j] = sum & 0xffff;
			}
			var sum = result[length] + carry;
			result[length] = sum & 0xffff;
			result[length + 1] += sum >>> 16;
			// A = A / b
			if (result[0] != 0)
				console.log('error detected!');
			for (var j = 0; j <= length; j++)
				result[j] = result[j + 1];
			result[length + 1] = 0;
		}
		// check if result > m
		var greater = false;
		if (result[length] > 0)
			greater = true;
		else
			for (var i = length - 1; i >= 0; i--)
				if (result[i] > m[i]) {
					greater = true;
					break;
				} else
					if (result[i] < m[i])
						break;
		if (greater) {
			carry = 0;
			for (var i = 0; i < length; i++) {
				var diff = carry + result[i] - m[i];
				result[i] = diff & 0xffff;
				carry = diff >> 16;
			}
			result[length] += carry;
		}
		return result.subarray(0, length);
	};

	// a, b - Int32 (a >= b)
	// returns { x, y, d }, where d = gcd(a, b), ax + by = d
	var extendedEuclideanInt32 = function (a, b) {
		if (a < b)
			throw 'Invalid parameter';
		if (b == 0)
			return { d: a, x: 1, y: 0 };
		var x2 = 1, x1 = 0, y2 = 0, y1 = 1;
		while (b > 0) {
			var q = Math.floor(a / b);
			var r = a - b * q;
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
	};

	// ****************************************************************************************
	// ****************************************************************************************
	// static members
	// ****************************************************************************************
	// ****************************************************************************************

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

	window.BigInt.fromUint8Array = function (bytes) {
		var result = new BigInt();
		result._sign = 1;
		result._length = Math.ceil(bytes.length / 2);
		var data = new Uint16Array(result._length);
		for (var i = 0; i < data.length; i++) {
			data[i] = 0;
			if (bytes.length - 1 - i * 2 >= 0)
				data[i] = data[i] | (bytes[bytes.length - 1 - i * 2]);
			if (bytes.length - 2 - i * 2 >= 0)
				data[i] = data[i] | (bytes[bytes.length - 2 - i * 2] << 8);
		}
		result._data = data;
		while (data[result._length - 1] == 0)
			result._length--;
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

	// generate random number:
	// when strict == true --> bitLength will be strictly equal to bitLength
	// when strict == false --> bitLength will be less or equal to bitLength
	window.BigInt.random = function (bitLength, rnd, strict) {
		var result = new BigInt();
		result._sign = 1;
		var length = bitLength >>> 4;
		var leadBits = bitLength & 0xf;
		if (leadBits != 0)
			length++;
		var data = rnd.getUint16Array(length);
		if (strict) {
			if (leadBits != 0)
				data[length - 1] = data[length - 1] & ((1 << leadBits) - 1) | (1 << (leadBits - 1));
			else
				data[length - 1] = data[length - 1] | 0x8000;
		} else {
			if (leadBits != 0)
				data[length - 1] = data[length - 1] & ((1 << leadBits) - 1);
			while (data[length - 1] == 0)
				length--;
		}
		result._length = length;
		if (length != 0)
			result._data = data;
		else
			result._sign = 0;
		return result;
	};

	window.BigInt.randomPrime = function (bitLength, rnd) {
		while (true) {
			var randomNumber = BigInt.random(bitLength, rnd, true);
			randomNumber._data[0] = randomNumber._data[0] | 1;
			if (randomNumber.isProbablePrime())
				break;
		}
		return randomNumber;
	};

	// a >= b
	// returns { x, y, d }, where d = gcd(a, b), ax + by = d
	window.BigInt.extendedEuclidean = function (a, b) {
		if (a.compareTo(b) < 0)
			throw 'a must be greater than b';

		if (b._sign == 0)
			return { d: a, x: BigInt.ONE, y: BigInt.ZERO };

		var x2 = BigInt.ONE, x1 = BigInt.ZERO, y2 = BigInt.ZERO, y1 = BigInt.ONE, x, y, r;
		while (b._sign != 0) {
			var div = a.divide(b);
			q = div.quotient;
			r = div.remainder;
			x = x2.subtract(q.multiply(x1));
			y = y2.subtract(q.multiply(y1));
			a = b;
			b = r;
			x2 = x1;
			x1 = x;
			y2 = y1;
			y1 = y;
		}
		return { d: a, x: x2, y: y2 };
	};

	// ****************************************************************************************
	// ****************************************************************************************
	// private constants
	// ****************************************************************************************
	// ****************************************************************************************

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

	// used by isProbablePrime; first primes < 256
	var firstPrimes = new Array();
	firstPrimes.push(2);
	for (var i = 3; i < 0x100; i++) {
		var isPrime = true;
		for (var j = 0; j < firstPrimes.length; j++)
			if (i % firstPrimes[j] == 0) {
				isPrime = false;
				break;
			}
		if (isPrime)
			firstPrimes.push(i);
	}
	firstPrimes = new Uint16Array(firstPrimes);

	// public constants
	window.BigInt.ZERO = new BigInt();
	window.BigInt.ONE = BigInt.fromInt(1);
	window.BigInt.TWO = BigInt.fromInt(2);

})();