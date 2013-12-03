(function () {

	window.HashAlgorithm = function () {};

	window.HashAlgorithm.prototype.hashSize = 0;
	window.HashAlgorithm.prototype.computeHash = function () {
		throw 'Not implemented';
	};

	window.hashAlgorithms = {};

})();