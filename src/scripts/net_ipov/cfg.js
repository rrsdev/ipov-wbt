define([], function () {
	var cfg = window.net_ipov_cfg || {};

	cfg.get = function (key, dflt) {
		if (undefined != cfg[key]) {
			return cfg[key];
		} else {
			return dflt;
		}
	};

	return cfg;
});