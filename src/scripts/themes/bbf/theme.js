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
define([
        "require",
        "jquery",
        "net_ipov/pubsub",
        "net_ipov/log",
        "net_ipov/wbt/wbt",
        "i18n!./nls/theme",
        "net_ipov/wbt/jsrender-tags",
        "./scripts/wbt-menu-fn",
        "./scripts/nav-ctrls-fn",
        "./scripts/breadcrumbs-fn",
        "./scripts/template-fn",
        "jsrender",							// This doesn't actually load a module, the code attaches itself to JQuery
        ], function (
                req,
                $,
                _pubsub,
                _log,
                _wbt,
                _i18n,
                jsrenderTags,
                menuFn,
                navCtrlsFn,
                breadcrumbsFn,
                templateFn
           ) {

    // here we're ready to setup the main theme material...

    var _cfg = net_ipov_cfg || { get: function(x,y) {return null;} };

    /** The theme is the central object that's actually returned out of the module. */
    var theme;

    /** This is a JQuery wrapped version of the portion of the body that the theme renders into, e.g. "#wbt-main". */
    var themeEle = null;
    var waitHtml = null;			// I don't know that I should rely on this, but heck, for now let's roll with it.
    var contentMainEle = null;

    // any ContentRenderer with the renderTo() function can return a 'handle' that we can then use to make sure its cleaned up.
    var crHandles = [];

    /** Render the currentTopic of the WBT. */
    var renderContent = function(wbt) {
        var tpc = wbt.currentTopic;
        var ctnt = tpc.content;			//TODO: check to see if this is an array or object and handle that.

        var r = theme.getRenderer( tpc, ctnt, {} );
        if (r.render) {
            var h = r.render();
            contentMainEle.html( h );
        } else if (r.renderTo) {
            var result = r.renderTo( theme, contentMainEle );
            crHandles.push( result );
        }

    };

    /** Give the existing content a chance to be cleaned up. */
    var clearContent = function (wbt) {
        $.each(crHandles, function (indx, handle) {
            if (handle.destroy) {
                handle.destroy(theme, wbt);
            }
        });
        crHandles = [];

        // remove this content panel
        contentMainEle.empty();
    };

    var _themeWidgets = [];

    /** Clear the content and show an 'exiting' message. */
    var fnBeforeExit = function () {
        $.each( _themeWidgets, function (i, w) {
            w.destroy();
        });
        _themeWidgets = null;

        contentMainEle.html(
            '<div style="margin-top:24px;"><center>' +
            '<h2>' + _i18n.ExitTitle + '</h2>' +
            '<br/><br/>' +
            '<p style="width: 400px">' + _i18n.ExitDesc + '</p>' +
            '</center></div>'
        );
    };

    var fnAddStyle = function (relUrl, id) {
        var lnEle = document.createElement( "link" );

        lnEle.id = id;
        lnEle.rel = "stylesheet";
        lnEle.type = "text/css";
        lnEle.href = req.toUrl(relUrl);

        document.getElementsByTagName( "head" )[ 0 ].appendChild( lnEle );
    };

    // This is the element, which is used when needed, that creates an 'overlay' effect -
    // e.g. to create a modal dialog or menu this 'overlay' is displayed under
    // the modal widget so that users see that they can't click on the main body content.
    var overlayEle = $('<div id="COver_' + $.now() + '">').addClass('content-overlay').appendTo('body');

    // loads (if needed) and processes the theme templates so that they are ready for use
    templateFn( $ );
    jsrenderTags.tmpl();	// register the 'tmpl' tag


    theme = {
        _name: "BannerBodyFooter",

        // Need to expose this so it can be read in and used in the WBT code.
        i18n: _i18n,

        // Represents the WBT, useful so that we can act directly on it when needed.
        getWbt : function () {
            return _wbt;
        },

        // Adds a renderer, this is type: Function(topic, content, data) and is set externally (typically in the 'main()' call).
        getRenderer: null,

        /** Configure takes the initial configuration of the singleton Object (as opposed to having a 'constructor').  */
        conf: function (getRendererFn /* Function */) {
            this.getRenderer = getRendererFn;

            themeEle = $("#wbt-main");
            waitHtml = themeEle.html();		// the initial content should be the 'loading' html

            themeEle.html( $.render['theme']( _wbt ) );

            contentMainEle = $("#content-main");

            // We're still loading things.
            contentMainEle.html( waitHtml );
        },

        init: function () {

            // Configure the CSS?
            // TODO: Move this to a separate utility function somewhere.
            fnAddStyle("./css/theme.css", "theme_css");
            if (window.__isIe6) {
                fnAddStyle("./css/fixie.css", "theme_css_ie6");
            }


            _pubsub.subscribe( _wbt.EVT_CONTENT_LOAD_ERROR, function (wbt) {
                this.handleError({
                    terminal: true,
                    title: _i18n.ContentLoadError ,
                    desc: _i18n.ContentLoadErrorDesc
                });
            });

            // Wait until the WBT content definition is loaded in order to render the main elements.
            _pubsub.subscribe( _wbt.EVT_CONTENT_LOADED, function (wbt) {
                _log.log('WBT contentLoaded, theme responding.');

                // the site menu..
                _themeWidgets.push( menuFn(theme, wbt) );

                // Attach the prev/next buttons
                _themeWidgets.push(
                    navCtrlsFn( theme, wbt, {parentEle: $('#banner-container .controls-right').first() } )
                );
                _themeWidgets.push(
                    navCtrlsFn( theme, wbt, {parentEle: $('#footer-container .footer-left').first() } )
                );
                /*
                _themeWidgets.push(
					progressButtonsFn( theme, wbt, {parentEle: $('#footer-container .footer-left').first() } )
				);
                */
                _themeWidgets.push(
                    breadcrumbsFn( theme, wbt, {parentEle: $('#content-top').first() } )
                );

                // render the main content:
                if (wbt.currentTopic) {
                    $('#header-text-title').html( wbt.currentTopic.title );
                    renderContent(wbt);
                }
            });

            _pubsub.subscribe( _wbt.EVT_WBT_NAVIGATE, function (wbt, tpc /* same as wbt.currentTopic */, oldTpc) {

                // de-activate any existing renderers
                clearContent(wbt);

                // TODO: Add some other items, maybe via  themeEle.find('.topic-title).html()  if we want to..
                // although in most cases it would probably be more efficient to use individual listeners
                $('#header-text-title').html( tpc.title );

                // This is where we would need to do anything about showing the item, updating the menus, etc...
                renderContent(wbt);
            });

            this.size();

            // attach the 'exit' button if we have a use for it (e.g. if this appears to be a popup window):
            try {
                var win = window;
                var xwin = ((win.top.opener) && (win.top.opener != win.self)) ? win.top : null;

                if ((_cfg.get('ex',0) == 1) || (xwin)) {		// || (null != wbt.persistence.getLMS())
                    // creat Exit button
                    var exit = $('<div id="wbtExit" title="' + _i18n.exitDesc + '"><span id="wbtExitTxt">' + _i18n.exit + '</span></div>');
                    exit.click(function () {
                        fnBeforeExit();
                        _wbt.exit();
                        if (xwin) {
                            setTimeout(function () { xwin.close(); }, 500);
                        }
                    });
                    $("#banner-container").append(exit);
                }
            } catch (ex) {
                _log.debug("Unable to attach Exit button for WBT.");
            }
        },

        block: function () {
            _pubsub.publish("net_ipov/wbt/Theme:block", [this]);

            // Get the main content area:
            var cc = $('#content-container');
            var offset = cc.offset();
            overlayEle.css({
                display: 'block',
                top: offset.top + "px",
                left: offset.left + "px",
                width: cc.outerWidth() + "px",
                height: ( $('#footer-container').offset().top - offset.top) + "px"
            });
        },

        unblock: function () {
            overlayEle.css({
                display: 'none'
            });
            _pubsub.publish("net_ipov/wbt/Theme:unblock", [this]);
        },

        /**
         * Open a themed 'confirm' dialog, currently only has 'Yes' and 'No' buttons
         *
         * @API
         * @return Object literal with:  .value = the 'name' of the button clicked, and .remember (only if the parameter remember is passed in a non-null)
         */
        confirm: function (fn, title, desc, remember, flags) {
            //this.block();

            var result = {};
            // Create basic dialog:
            var txt = $.render['confirmDlg']( { title: title, desc: desc });
            var dlg = $( txt );

            dlg.find(".dialog-yes").html( _i18n.yes ).click(function () {
                dlg.remove();
                result.value = "yes";
                fn(result);
            });
            dlg.find(".dialog-no").html( _i18n.no ).click(function () {
                dlg.remove();
                result.value = "no";
                fn(result);
            });

            if (remember) {
                // add a 'remember this decision' flag:
                var ckId = "cfmdlg_ck" + Math.ceil( Math.random() * 1000000);
                var ctrlCk = $('<input type="checkbox" id="' + ckId + '"/>');
                ctrlCk.change(function(evt) {
                    result.remember = ('checked' == ctrlCk.attr('checked'));
                });
                var lbl = $('<label for="' + ckId + '">' + remember + '</label>');
                dlg.find('.dialog-remember').first().append( ctrlCk, lbl );
            }

            // sizing..
            var cc = $('#content-container');
            var left = Math.floor( (cc.outerWidth() - 420) / 2);
            dlg.css({
                display: 'block',
                top: '100px',
                left: left + 'px'
            });

            $('body').append( dlg );

            //this.unblock();

            return { value: "no" };
        },

        /**
         * Called to display an error to the end user.
         * It is assumed that the error had been logged (if appropriate) BEFORE this function is called.
         *
         * @param args  Object consisting of a number of properties:
         *   @prop title String  The title or summary of the error.
         *   @prop desc  String  A string (possibly embedded HTML) to describe the error in more detail in terms that the user may understand.
         *   @prop terminal Boolean  True if the error can not be recovered from (e.g. can not load WBT definition), false or undefined if the error
         *                           is something that the user should be aware of but that may allow continued interaction with the WBT.
         */
        handleError: function () {
            _log.error( arguments );
        },

        /**
         * For now keep this function on the top level.
         * @see $().find()
         */
        //TODO: Look into having the theme BE the themeEle with mixin properties - e.g. theme = $.extend( true, themeDef, themeEle );
        find: function (query) {
            return themeEle.find(query);
        },

        /**
         * Set the size of the content area, for modern web browsers we use min-height and min-width, but for IE6 use height & width
         * @param size [optional] An object with .h (height), .w (width) (both optional) or .x (width), .y (height) (both optional) properties
         */
        size: function () {
            // Get the size, which should be passed-in unless this is a resize..
            var sz = (arguments.length > 0) ? arguments[0] : {};

            var height = sz.h || sz.y || (this.getMaxContentHeight() + 'px');
            var width = sz.w || sz.x || 'auto';

            $('#content-main').css({ width: width, height: height });
        },

        //TODO: Other than maybe IE6 issues, it should be possible to use CSS to create a '100%' height element and use either margin or abs-coords to manipulate its position...
        getMaxContentHeight: function() {
            var h_banner = $('#banner-container').outerHeight();
            var h_top = $('#content-top').outerHeight();
            var h_footer = $('#footer-container').outerHeight();
            var h_avail = $('#wbt-main').innerHeight();

            // add an extra 4px of space for now until I get the positioning tighended up a bit more.
            return h_avail - h_footer - h_top - h_banner - 4;
        }

    };

    return theme;
});