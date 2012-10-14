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
 * Defines the WBT Site Menu builder.
 *
 * @return Function( theme, wbt ) which builds the main site menu for the theme
 */
define(["jquery", "net_ipov/pubsub", "text!themes/bbf/tmpl/site_menu.html"], function ($, _pubsub, tmplSiteMenu) {
	return function(theme, wbt) {

		var eleMenuContainer = theme.find("#site-menu");
		var eleMenuTitle = theme.find("#site-menu-title");
		var isMenuOpen = false;		// state of the menu item (pulled in via closures)

		// First things first, register and then render the main site menu template into the theme.
		$.templates( { site_menu: tmplSiteMenu } );
		var t_html = $.render['site_menu'](wbt.contentModel.root);
		var eleMenuItems = eleMenuContainer.find(".menu-items")
			.first().html( t_html );

		var _menuIndicatorEles = {};

		// setup the mouseover events
		eleMenuTitle.hover( function (evtIn) {
			// function executed on hover
			if (!isMenuOpen) {
				eleMenuTitle.addClass('hover');
			}
		},
		function (evtOut) {
			// function executed on 'un' hover
			if (!isMenuOpen) {
				eleMenuTitle.removeClass('hover');
			}
		});

		// Function to toggle the menu open/close
		var fnToggleMenu = function (evt) {
			isMenuOpen = !isMenuOpen;
			if (isMenuOpen) {
				eleMenuContainer.removeClass("menu-closed").addClass("menu-open");

				theme.block();
			} else {
				eleMenuContainer.removeClass("menu-open").addClass("menu-closed");
				eleMenuTitle.removeClass('hover');

				theme.unblock();
			}
		};

		eleMenuTitle.click(fnToggleMenu);
		eleMenuContainer.find('.menu-close-button').click(fnToggleMenu);

		// onclick handler for menu items.
		var eleMenuCtnr = eleMenuContainer.find("#site-menu-container");
		var mnuEntries = eleMenuCtnr.find(".main-menu-entry");
		mnuEntries.click( function (evt) {
			fnToggleMenu(evt);
			wbt.navigate( $(this).data("topicId") );
		} ).find(".topic-progress-indicator").each(function (indx, ele) {
			// need to find the Topic based on the Id:
			ele = $(ele);
			var id = ele.parent().data("topicId");
			_menuIndicatorEles[ id ] = ele;
			var topic = wbt.contentModel.byId( id );
			ele.attr("title", topic.statusAsString() );
			ele.children('div').removeClass().addClass( topic.statusAsPropString() );
		});

		if (window.__isIe6) {
			setTimeout(function(){
				var maxWidth = 0;
				var tpc, w;
				mnuEntries.each(function (i, ele) {
					ele = $(ele);
					tpc = wbt._topicFromId( ele.data("topicId") );
					w = $(ele).width();
					if (tpc.depth) {
						w = w + (18 + tpc.depth);
					}
					maxWidth = Math.max(maxWidth, w);
				});
				eleMenuContainer.css('width', (maxWidth + 56) + "px");
			}, 50);
		} else {
			//eleMenuCtnr.css('display', 'none');
		}

		var hndl = _pubsub.subscribe("net_ipov/Topic:statusChange", function (topic, status, oldStatus) {
			var e = _menuIndicatorEles[topic.id];
			if (e) {
				e.attr("title", topic.statusAsString() );
				e.children('div').removeClass().addClass( topic.statusAsPropString() );
			}
		});

		/**
		 * This is the "Widget Function" return - its created when the widget is setup (above) and contains a function .destroy() which removes the 'widget' from the page.
		 */
		return {
			destroy: function () {
				try {
					_pubsub.unsubscribe(hndl);
					eleMenuContainer.empty();
				} catch (ex) {}
			}
		};
	};
});