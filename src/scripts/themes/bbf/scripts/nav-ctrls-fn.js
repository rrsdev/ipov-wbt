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
 * Module which returns a Function used to create 'navigation controls' - in this case the 'prev/next' style buttons.
 * Function can be called more than once.
 */
define(["jquery", "net_ipov/pubsub"], function ($, _pubsub) {
	return function(theme, wbt, data) {

		//FIXME: Pull in i18n for 'previous' and 'next' tooltips
		// first we need to create the element HTML:
		var parentEle = $(data.parentEle);
		var domNode = $('<span class="wbt-navbar">' +
                '<span class="nav-btn prev" title="' + theme.i18n.prev + '"><span class="nav-arrow prev"></span><span class="text">' + theme.i18n.prev + '</span></span>' +
                '<span class="page-numbering"></span>' +
                '<span class="nav-btn next" title="' + theme.i18n.next + '"><span class="text">' + theme.i18n.next + '</span><span class="nav-arrow next"></span></span>' +
            '</span>');
		parentEle.append( domNode );

		var fnOnNav = function (wbt, tpc, oldTpc) {

			if (tpc.parent) {
				// TODO: Note that depending on if content and non-content Topics are mixed this may not be totally 'accurate' from a user's perspective.
				parentEle.find(".page-numbering").html( (1 + tpc.childIndx) + ' / ' + tpc.parent.children.length );
			} else {
				parentEle.find(".page-numbering").html('');
			}

			var tpcPrev = wbt.prevContentTopic(tpc);
			parentEle.find('.nav-btn.prev').css('visibility', ((tpcPrev) && (tpcPrev != tpc)) ? 'visible' : 'hidden' );

			var tpcNext = wbt.nextContentTopic(tpc);
			parentEle.find('.nav-btn.next').css('visibility', ((tpcNext) && (tpcNext != tpc)) ? 'visible' : 'hidden' );

		};

		var hndl = _pubsub.subscribe("net_ipov/wbt:navigate", fnOnNav);

		parentEle.find('.nav-btn.prev').click(function () {
			// For now just tell the WBT to go to the 'previous' topic:
			wbt.navigate( wbt.prevContentTopic() );
		});

		parentEle.find('.nav-btn.next').click(function () {
			// For now just tell the WBT to go to the 'next' topic:
			wbt.navigate( wbt.nextContentTopic() );
		});

		if (wbt.currentTopic) {
			fnOnNav(wbt, wbt.currentTopic, null);
		}

		/**
		 * This is the "Widget Function" return - its created when the widget is setup (above) and contains a function .destroy() which removes the 'widget' from the page.
		 */
		return {
			destroy: function () {
				try {
					_pubsub.unsubscribe(hndl);
					parentEle.find('.wbt-navbar').each(function (i, e) {
						e.parentNode.removeChild(e);
					});
				} catch (ex) {}
			}
		};

	};
});