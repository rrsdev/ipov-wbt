/* 
Copyright (C) 2011 iPOV.net
Author: Robert Sanders (dotperson@gmail.com)

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