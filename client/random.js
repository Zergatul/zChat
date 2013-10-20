(function () {

	window.random = {};

	window.Random = function () { };
	window.Random.prototype.nextUint8 = function () { throw 'Not implemented'; };
	window.Random.prototype.nextUint16 = function () { throw 'Not implemented'; };
	window.Random.prototype.nextInt32 = function () { throw 'Not implemented'; };
	window.Random.prototype.nextBefore = function (max) { throw 'Not implemented'; };
	window.Random.prototype.nextRange = function (min, max) { throw 'Not implemented'; };
	window.Random.prototype.getUint8Array = function (length) {
		var array = new Uint8Array(length);
		for (var i = 0; i < length; i++)
			array[i] = this.nextUint8();
		return array;
	};
	window.Random.prototype.getUint16Array = function (length) {
		var array = new Uint16Array(length);
		for (var i = 0; i < length; i++)
			array[i] = this.nextUint16();
		return array;
	};

	window.random.default = new Random();
	window.Random.prototype.nextUint8 = function () { return Math.floor(Math.random() * 0x100); };
	window.Random.prototype.nextUint16 = function () { return Math.floor(Math.random() * 0x10000); };
	window.Random.prototype.nextInt32 = function () { return Math.floor(Math.random() * 0x100000000); };
	window.Random.prototype.nextBefore = function (max) { return Math.floor(Math.random() * max); };
	window.Random.prototype.nextRange = function (min, max) { return min + Math.floor(Math.random() * (max - min)); };

})();