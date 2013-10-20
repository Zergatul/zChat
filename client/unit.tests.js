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

	window._bigintTest = function () {

		console.log('>>> BigInt.add test');
		console.log('>>> BigInt.sub test');
		console.log('>>> BigInt.mult test');
		console.log('>>> BigInt.mod test');
		for (var i = 0; i < 25; i++) {
			var len = 10 + Math.floor(Math.random() * 1000);
			var aStr = randomNumber(len * 2);
			var bStr = randomNumber(len);
			var a0 = BigInt.parse(aStr);
			var b0 = BigInt.parse(bStr);
			var a1 = str2bigInt(aStr, 10);
			var b1 = str2bigInt(bStr, 10);

			if (BigInt.mod(a0, b0).toString() != bigInt2str(mod(a1, b1), 10)) {
				console.log('Validation failed:');
				console.log('a = ' + aStr);
				console.log('b = ' + bStr);
				return;
			}
		}
		console.log('Passed!');

		console.log('>>> BigInt.extendedEuclidean test');
		for (var i = 0; i < 25; i++) {
			var len = 10 + Math.floor(Math.random() * 1000);
			var aStr = randomNumber(len + 2);
			var bStr = randomNumber(len);
			var a0 = BigInt.parse(aStr);
			var b0 = BigInt.parse(bStr);

			var res = BigInt.extendedEuclidean(a0, b0);
			if (BigInt.add(BigInt.mult(res.x, a0), BigInt.mult(res.y, b0)).compareTo(res.d) != 0) {
				console.log('Validation failed:');
				console.log('a = ' + aStr);
				console.log('b = ' + bStr);
				return;
			}
		}
		console.log('Passed!');
	};

	window._paddingsTest = function () {
		var test = function (padding) {
			for (var len = 0; len <= 32; len++) {
				var initialArray = random.default.getUint8Array(len);
				var padded = padding.pad(initialArray, 16, random.default);
				var padCount = padding.unpad(padded);
				if (padCount == -1) {
					console.log('Failed! 1');
					return;
				}

				var unpadded = padded.subarray(0, padded.length - padCount);
				if (initialArray.length != unpadded.length) {
					console.log('Failed! 2');
					return;
				}
				for (var i = 0; i < len; i++)
					if (initialArray[i] != unpadded[i]) {
						console.log('Failed! 3');
						return;
					}
			}
			console.log('passed');
		};

		console.log('ANSI X.923 test');
		test(paddings['ANSI X.923']);

		console.log('ISO 10126 test');
		test(paddings['ISO 10126']);

		console.log('PKCS7 test');
		test(paddings['PKCS7']);

		console.log('ISO/IEC 7816-4 test');
		test(paddings['ISO/IEC 7816-4']);
	};

	window._sha2Test = function () {
		var test = function (bytes, ver, hex) {
			if (bh.byteArrayToHex(sha2(new Uint8Array(bytes), ver)) != hex) {
				console.log('Failed!');
			}
		};

		var a40 = [25, 215, 226, 12, 106, 44, 159, 200, 49, 56, 86, 185, 11, 129, 90, 44, 125, 56, 126, 161, 114, 118, 212, 181, 23, 207, 189, 3, 55, 60, 7, 51, 5, 40, 199, 63, 151, 19, 88, 63];

		console.log('SHA-224');
		test([], 224, 'd14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f');
		test([255], 224, 'e33f9d75e6ae1369dbabf81b96b4591ae46bba30b591a6b6c62542b5');
		test(a40, 224, '4beabeb77adf912c2270c455dd215f818662c0d61b85508c7def6a73');
		console.log('passed');

		console.log('SHA-256');
		test([], 256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
		test([255], 256, 'a8100ae6aa1940d0b663bb31cd466142ebbdbd5187131b92d93818987832eb89');
		test(a40, 256, '9792f39846b22bee11dbaa2a34014141c90cb4ef2f2c16dc83a48b0456f4705d');
		console.log('passed');

		console.log('SHA-384');
		test([], 384, '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b');
		test([255], 384, '43950796d9883503655e35b5190aee687a2dd99f265012625b95753978e4efff3e8414d178a6e2318480d8eb6ddee643');
		test(a40, 384, '1fde9ca46c6d627edfbda629ce47e9101e803674e9156f9706d7a9406e5fe1c91e981e4276b37c78ce8c329b4a30a765');
		console.log('passed');

		console.log('SHA-512');
		test([], 512, 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
		test([255], 512, '6700df6600b118ab0432715a7e8a68b0bf37cdf4adaf0fb9e2b3ebe04ad19c7032cbad55e932792af360bafaa09962e2e690652bc075b2dad0c30688ba2f31a3');
		test([97, 98, 99], 512, 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
		test(a40, 512, 'a8e64de4f5fa72e7a1a1bee705d87acc50748a810482a088535e53ad741ed68fb0c7cb08035802f63d466ba629b13823705db763f5ec043918f20c2266c0a783');
		console.log('passed');
	};
})();