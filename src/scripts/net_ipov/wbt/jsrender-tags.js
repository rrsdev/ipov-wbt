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
/**
 * A set of custom tags for the "JsRender" engine.
 *
 * Return Type: object w/ collection of functions which can be run to register a particluar 'tag'.
 *
 */
define(["jquery", "jsrender", "net_ipov/log"], function($, _r, _log) {
	return {

		tmpl: function () {
			$.views.tags({
				'tmpl': function (tmplName) {
					var t = $.render[tmplName];
					if (t) {
						var val = t(this.data, this.ctx);
						return (val) ? val : '';	//no 'undefined'..
					} else {
						_log.error('No definition of template "' + tmplName + '" found.');
						return '';
					}
				}
			});
		}

	};
});