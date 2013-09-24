(function () {

	window.Stopwatch = function () {
		this.reset();
	};

	window.Stopwatch.prototype.start = function () {
		if (this._state == 0) {
			this._state = 1;
			this._startDate = new Date();
		}
	};

	window.Stopwatch.prototype.stop = function () {
		if (this._state == 1) {
			this._elapsed += new Date() - this._startDate;
			this._state = 0;
		}
	};

	window.Stopwatch.prototype.reset = function () {
		this._state = 0;
		this._elapsed = 0;
	};

	window.Stopwatch.prototype.totalElapsed = function () {
		return this._elapsed;
	}

	window.Stopwatch.measureFunction = function (func) {
		if (typeof func != 'function')
			throw 'Invalid argument';

		var sw = new Stopwatch();
		sw.start();
		var result = func();
		sw.stop();
		console.log('Elapsed time: ' + sw.totalElapsed() + ' ms');
		return result;
	};

})();