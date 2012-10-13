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
require.config({
    locale: net_ipov_cfg.locale     // .locale is determined and set in _init.js which is run BEFORE require.js is loaded
});

var currentTheme = "themes/" + net_ipov_cfg.theme + "/theme";
require([
          'domReady',
          'jquery',
          'net_ipov/wbt/wbt',
          'net_ipov/wbt/loader-json',
          'net_ipov/wbt/cr',
          'net_ipov/wbt/lms/scorm_1p2',		//'net_ipov/wbt/lms/scorm_1p2',		'persistor'
          'i18n!net_ipov/wbt/nls/wbt',
          currentTheme		// Must be specified in configuration (typically on index.html)
      ],
      function (domReady, $, wbt, loader, getRendererFn, persistor, i18n, theme) {
	      domReady(function () {

	    	  if (window.__isIe6) {
	    		  $('body').addClass("ie6");
	    	  }

	    	  $("#wbt-main .loading-indicator").first().html( i18n.loading );

	    	  theme.conf( getRendererFn );
		      theme.init();

		      // Configure and initialize the WBT.
		      // Note that due to the way this currently works there is no 'guard' on calling this from elsewhere.
		      wbt.i18n = $.extend({}, i18n, theme.i18n);
              wbt.init(loader, theme, persistor);
  		});
      }
);

//To get a relative URL, require(["require"], function (req) { var cssPath = req.toUrl("./fileAtSameLevel.css");    });