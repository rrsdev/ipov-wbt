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
define(["jquery", "swfobject"], function ($, undefined) {
	return function (eleId, vitems, videoSize, playerSize, id, cfg) {
		cfg = cfg || {};
		cfg = $.extend({
			debug: true,
			trackUsage: true,
			ui: {trackUsage: true},
	        autoplay: "true",
	        loopplay: "false",
	        vitems: vitems
	    }, cfg );

		var flashvars = {
			JSON: escape( JSON.stringify(cfg) )
		};
		//,
        //videoWidth: videoSize[0],
        //videoHeight: videoSize[1]
		var params = {
	        swfliveconnect: "true",
	        allowScriptAccess: "always",
	        allowFullScreen: "true",
	        salign: "lt",
	        scale: "noscale",
	        loop: "false",
	        wmode: 'opaque'
	    };
		var attrs = {
			id: 'csp_' + id,
			name: 'csp_obj_' + id
		};

		swfobject.embedSWF("scripts/csp-1.4.1.swf", eleId, playerSize[0], playerSize[1], "10.0.0", "expressInstall.swf", flashvars, params, attrs);
		return attrs.id;
	};
});