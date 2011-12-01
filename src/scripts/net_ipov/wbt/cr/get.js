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
define(["jquery"], function ($) {

	// FIXME: Implement some form of FIFO list w/ 50 or so entries just to make sure we don't create a memory leak.
	var _cache = {};

	return {

		/**
		 * Return a loaded (and possibly post-processed) asset using JQuery.get, caches the object so that we don't reload and reprocess.
		 *
		 * @param url   The URL to load, this must be a value URL string, no 'magic' is done on it.
		 * @param settings  The settings to use (see $.ajax), the two main sub-properties are:
		 *   - success : Function(data:*, textStatus, jqXHR) which is the callback to receive the returned value
		 *   -
		 *
		 */
		//TODO: Look at converting this to use $.ajax  ...
		xml: function (url, settings) {
			if ((true != settings.nocache) && (_cache[url])) {
				var d = _cache[url];
				settings.success( d.xml, d.textStatus, d.jqXHR );
			} else {

				// First we make sure settings is none-null and then mixin the dataType (default is "xml"):
				settings = settings || {};
				settings = $.extend( {
					dataType: "xml"
				}, settings);


				var fnSuccess = settings.success;
				settings.success = function (data, textStatus, jqXHR) {
					var xml = $(data);
					_cache[url] = { xml: xml, textStatus: textStatus, jqXHR: jqXHR };
					fnSuccess(xml, textStatus, jqXHR);
				};

				$.ajax(url, settings);
			}
		}
	};

});