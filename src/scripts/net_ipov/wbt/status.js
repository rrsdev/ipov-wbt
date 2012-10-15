/*
Copyright (C) 2011-2012 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License v2 or higher.

*/
/**
 * Simply defines the status codes that the WBT uses.
 */
define([], function () {

	var STATUS_NAMES = ['NOT_ATTEMPTED', 'BROWSED', 'INCOMPLETE', 'FAILED', 'COMPLETED', 'PASSED'];

	var Status = {
		_NAMES: STATUS_NAMES,
		name: function (i) {
			return STATUS_NAMES[i];
		}
	};

	/**
	 * @param   name  String  A 'name' of one of the status values, will be 'normalized' internally (coverted to uppercas).
	 * @return  Int  The status-value for 'name' as an Int, or zero.
	 */
	Status.get = function (name) {
		name = name.toUpperCase();
		if (Status[name]) {
			return Status[name];
		} else {
			return 0;
		}
	}

	for (var i = 0; i < STATUS_NAMES.length; i++) {
		var n = STATUS_NAMES[i];
		Status[ n ] = i;	//fnMakeVal(i);
	}

	return Status;

});
