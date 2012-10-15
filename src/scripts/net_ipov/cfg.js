/*
Copyright (C) 2011-2012 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License v2 or higher.

*/
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
