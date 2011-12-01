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
 *  A MimeType utility Function.
 *  Returns an anonymous Function, which takes a mimeType string (e.g. "text/html") and parse it into its various components, returning these as an object.
 *  The resulting object has the properties:
 *  	- mimetype : The full mime type string that was passed in.
 *  	- type     : The base type (the portion before the '/'), e.g. "text"
 *  	- subtype  : The subtype is the portion after the '/' but before any '+' or ';', e.g. "html"
 *  	- extradata : If there is any 'extra data' appended by a '+' to the mimetype then it is accessible here.
 *
 *  Useage:
 *
 *  define(['net_ipov/mimetype'], function (MimeType) {
 *  	...
 *  	var mime = new MimeType('text/html');
 *  	...
 *  });
 *
 */
define(function () {

	// format is  "levelOne/levelTwo+extended"
	var rgex = /([\w-\.]+)\/([\w-\.]+)\+?([\w-\.]+)?/;

	// TODO: What I really would like to do is something like "new mimetype(string);"
	return function ( mimeType /* MimeType as a string, e.g. "text/plain" */ ) {
		var match = rgex.exec(mimeType);

		this.mimetype = mimeType;

		this.type = (match) ? match[1] : null;
		this.subtype = (match) ? match[2] : null;
		this.extradata = ((match) && (4 == match.length)) ? match[3] : null;
	}
});