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
 * Loads the various content renderers and then returns an anonymous function to select one based on the content.
 * @return  Function( topic, content, data )
 * 	@param topic The Topic who's content is being rendered.
 *  @param content The content item (belonging to the topic) to render.
 *  @param data A name/value pairing of arguments to influence the renderer.
 *
 * Each renderer will be returned as wrapped object with a method of either render() or renderTo();
 */
define(
[
    "net_ipov/wbt/cr/csp-sc-1"
],
function () {
	var _renderers = {};

	var args = arguments;	// the array of other arguments, these are the renderer plugins.
	for (var i = 0; i < args.length; i++) {
		var m = [].concat(  args[i]  );		// We can return an array of renderers from each plugin module, if it wasn't an array it is now
		for (var j = 0; j < m.length; j++) {
			_renderers[ m[j].filter ] = m[j];
		}
	}
	_renderers['*'] = function (topic, content, data) {
		return "";
	};

	return function ( topic, content, data ) {
		// return either the specific match or a default '*' match (which may not be present either...)
		var obj = _renderers[ content._type ] || _renderers['*'];

		// Essentially this is returning a 'partial'
		// I am really divided: should the 'raw' renderer function be returned (as above), or should we 'wrap' it to create a closure which can then be invoked without repeating the parameters?
		if (obj) {

			if (obj.render) {
				return {
					render: function(theme) {
						return obj.render(theme, topic, content, data);
					}
				};
			} else if (obj.renderTo) {
				return {
					renderTo: function(theme, parentEle) {
						return obj.renderTo(theme, parentEle, topic, content, data);
					}
				};
			}

		} else {
			return null;
		}
	};

});