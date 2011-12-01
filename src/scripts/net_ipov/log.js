define([], function () {

	//We want to always expose a basic interface so that our code doesn't need to do testg
	var _log = {};

	var hasConsole = (window) && (window.console);

	if ((hasConsole) && (console.log)) {
		_log.log = function (data) {
			console.log(data);
		};
	} else {
		_log.log = function (data) {};		// no-op
	}


	var ifuncs = ['debug', 'info', 'warn', 'error', 'dir'];	// these are the 'extra' functions in additon to console.log
	for (var i = 0; i < ifuncs.length; i++) {
		var n = ifuncs[i];
		if ((hasConsole) && (console[n])) {
			_log[n] = function (data) {
				console[n](data);
			};
		} else {
			_log[n] = function (data) {
				_log.log( "[" + n + "] : " + data);
			};
		}
	}


	return _log;
});