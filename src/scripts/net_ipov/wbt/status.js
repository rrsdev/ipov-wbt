/* 
Copyright (C) 2011 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
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