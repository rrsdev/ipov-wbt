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
		eleMenuCtnr.bgiframe();		// Have to watch out for z-index bug or this won't work

		var mnuEntries = eleMenuCtnr.find(".menu-entry-container");

		// logic for clicking on the menu item.
        var fnMenuItemAction = function (evt, ele) {
    		fnToggleMenu(evt);
    		wbt.navigate( $(ele).parent().parent().data("topicId") );
        };
		mnuEntries.find(".menu-entry-title").click( function (evt) {
			var ele = this;
			fnMenuItemAction(evt, ele);
		} );

		// logic for clicking on the menu icon, for nested menus it should expand/collapse them
        mnuEntries.find(".menu-item-icon").click( function (evt) {
            var t = $(this);
            if (t.hasClass('mi-icon-leaf')) {
                var ele = this;
    			fnMenuItemAction(evt, ele);
            } else {
            	// $(this).parent().parent().parent().class("item-menu-closed")
            	//wbt.navigate( $(this).data("topicId") );
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
			destroy: function () {
				try {
					_pubsub.unsubscribe(hndl);
					eleMenuContainer.empty();
				} catch (ex) {}
			}
		};
	};
});