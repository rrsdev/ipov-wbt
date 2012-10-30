/*
Copyright (C) 2011-2012 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License v2 or higher.

*/
/**
 * Defines the WBT Site Menu builder.
 *
 * @return Function( theme, wbt ) which builds the main site menu for the theme
 */
//
define(["jquery", "net_ipov/pubsub", "text!themes/bbf/tmpl/site_menu.html", "jquery.bgiframe"], function ($, _pubsub, tmplSiteMenu) {
    /**
     * @param theme The jQuery object representing the theme's DOM
     * @param wbt   The WBT javascript controller object
     */
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
		var fnToggleMenu = function () {
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
		eleMenuCtnr.bgiframe();		// Have to watch out for z-index bug or this won't work

		var mnuEntries = eleMenuCtnr.find(".menu-entry-container");

		// logic for clicking on the menu item.
        var fnMenuItemAction = function (ele) {
    		fnToggleMenu();
    		wbt.navigate( $(ele).parent().parent().data("topicId") );
        };
		mnuEntries.on("click", ".menu-entry-title", function (evt) {
			var ele = this;
			fnMenuItemAction(ele);
		} );

		var fnToggleSubMenu = function (mnuItem) {
		    if (mnuItem.hasClass("menu-open")) {
		        mnuItem.removeClass("menu-open").addClass("menu-closed");
		        mnuItem.find(".menu-item-icon").first().removeClass("icon-open").addClass("icon-closed");
		    } else {
		        mnuItem.removeClass("menu-closed").addClass("menu-open");
		        mnuItem.find(".menu-item-icon").first().removeClass("icon-closed").addClass("icon-open");
		    }
		};

		// logic for clicking on the menu icon, for nested menus it should expand/collapse them
        mnuEntries.on("click", ".menu-item-icon", function (evt) {
            var t = $(this);
            if (t.hasClass('mi-icon-leaf')) {
                var ele = this;
    			fnMenuItemAction(ele);
            } else {
            	var mnuContainer = t.parent().parent().parent();
            	fnToggleSubMenu(mnuContainer);
            }
        } );

		// logic for the progress indicator icon
		mnuEntries.find(".topic-progress-indicator").each(function (indx, ele) {
			// need to find the Topic based on the Id:
			ele = $(ele);
			var id = ele.parent().data("topicId");
			_menuIndicatorEles[ id ] = ele;
			var topic = wbt.contentModel.byId( id );
			ele.attr("title", topic.statusAsString() );
			ele.children('div').removeClass().addClass( topic.statusAsPropString() );
		});

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

			/**
			 * Is the site-level menu currently in an 'open' state or not (boolean).
			 */
		    isOpen: function() {
		    	return isMenuOpen;
			},

			toggleMenu: fnToggleMenu,

			destroy: function () {
    			try {
    				_pubsub.unsubscribe(hndl);
    				eleMenuContainer.empty();
    			} catch (ex) {}
    		}
    	};
	};
});