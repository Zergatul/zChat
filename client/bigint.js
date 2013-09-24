(function () {

	if (bh == undefined)
		throw 'bithelper.js not loaded';

	window.BigInt = function () {
		this._data = [];
	};

	window.BigInt.prototype.isZero = function () {
		return this._data.length == 0;
	};

	window.BigInt.prototype.isOne = function () {
		return this._data.length == 1 && this._data[0] == 1;
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
		return result;
	};

	var truncateZeros = function (bigint) {
		while (bigint._data.length > 0 && bigint._data[bigint._data.length - 1] == 0)
			bigint._data.pop();
	};

	var compareWithShift = function (bigint1, bigint2, shift) {
		if (bigint1._data.length < bigint2._data.length + shift)
			return -1;
		if (bigint1._data.length > bigint2._data.length + shift)
			return 1;
		for (var i = bigint2._data.length - 1; i >= 0; i--) {
			if (bigint1._data[i + shift] < bigint2._data[i])
				return -1;
			if (bigint1._data[i + shift] > bigint2._data[i])
				return 1;
		}
		return 0;
	};

	var binarySearchForDivision = function (bigint1, bigint2, shift) {
		var j1 = 0;
		var j2 = 0xffff;
		while (j1 + 1 != j2) {
			var mid = (j1 + j2)	>>> 1;
			var midValue = multByInt(bigint2, mid);
			var compareResult = compareWithShift(bigint1, midValue, shift);
			if (compareResult == 0)
				return mid;
			if (compareResult < 0) {
				j2 = mid;
			}
			if (compareResult > 0) {
				j1 = mid;
			}
		}

		return j1;
	};

	var shl16Bit = function (num, count) {
		var result = new BigInt();
		for (var i = 0; i < count; i++)
			result._data.push(0);
		for (var i = 0; i < num._data.length; i++)
			result._data.push(num._data[i]);
		return result;
	};

	var divMod = function (num1, num2) {
		var result = new BigInt();
		result._data = new Array(num1._data.length - num2._data.length + 1);
		for (var i = num1._data.length - num2._data.length; i >= 0; i--) {
			var val = binarySearchForDivision(num1, num2, i);
			var valbi = BigInt.fromInt(val);
			num1 = BigInt.sub(num1, shl16Bit(BigInt.mult(num2, valbi), i));
			result._data[i] = val;
		}

		truncateZeros(result);

		return { div: result, mod: num1 };
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
		if (num2._data.length <= 24)
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

	window.BigInt.fromInt = function (num) {
		if (typeof num != 'number')
			throw 'Invalid parameter';
		if (num < 0 || num > 4000000000)
			throw 'Integer value not in range';

		var result = new BigInt();

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

		var result = new BigInt();
		result._data = [];

		var len = Math.max(num1._data.length, num2._data.length);
		var rem = 0;
		for (var i = 0; i < len; i++) {
			var sum = rem;
			sum += i < num1._data.length  ? num1._data[i] : 0;
			sum += i < num2._data.length ? num2._data[i] : 0;
			result._data.push(sum & 0xffff);
			rem = sum >>> 16;
		};
		if (rem > 0)
			result._data.push(rem);

		return result;
	};

	window.BigInt.sub = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num1.compareTo(num2) < 0)
			throw 'Negative values not supported';

		var result = new BigInt();
		result._data = [];

		var rem = 0;
		for (var i = 0; i < num1._data.length; i++) {
			var sub = rem;
			sub += num1._data[i];
			sub -= i < num2._data.length ? num2._data[i] : 0;
			if (sub < 0) {
				rem = -1;
				sub = sub + 0x10000;
			} else
				rem = 0;
			result._data.push(sub);
		};

		truncateZeros(result);

		return result;
	};

	window.BigInt.mult = function (num1, num2) {
		if (!(num1 instanceof BigInt) || !(num2 instanceof BigInt))
			throw 'Invalid parameters';

		if (num1.isZero() || num2.isZero())
			return new BigInt();

		return multGeneral(num1, num2);
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

})();