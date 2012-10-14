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
/** Definition of CSP-1 releated rendering. */
define(["jquery", "net_ipov/log", "net_ipov/pubsub", "./get", "net_ipov/csp/csp", "net_ipov/wbt/status"], function ($, _log, _pubsub, _G, CSP1, _Status) {

    return [
        {
            // I'm really unsure if a passive or active approach would be better here, I guess I can always refactor later.
            filter: "application/x-ipov-media-catalog",
            renderTo: function (theme, parentEle, topic, content, data) {

                //FIXME: Probably want to make the text come from the theme.

                var tmpId = "tmp" + $.now();
                parentEle.html('<div id="' + tmpId + '" class="loading-indicator"></div>');

                var catalogUrl = 'site/' + topic.content.url;
                var cspId = null;
                var isReady = false;
                var _interval = null;

                var fnCspFromSiteCatalog = function (catalogXml, status, jqXHR) {
                    // Because we use our custom _G.xml() call we should be getting XML that has been parsed and wrapped by JQuery (we may want to look at other alternatives as it seems like its taking a bit longer than I'd like).
                    var baseCatalogURI = (catalogXml.baseURI) ? catalogXml.baseURI : catalogUrl;

                    //TODO: This screams "simple utility Fn"
                    var iwhr = baseCatalogURI.lastIndexOf('/');
                    var baseURI = baseCatalogURI.substring(0, iwhr+1);

                    //TODO: this is the site.config section
                    var showScripts = false;			// so that we can 'OR' it

                    // videoNames will be an array of the video names to load (these names must be found in the catalogXml)
                    var videoNames = content.video;
                    if ("string" == typeof videoNames) {
                        videoNames = [videoNames];	// make it into an array.
                    }

                    var vitems = [];	// the array of media items (object literal format) to load
                    var maxVideoSize = [0,0];
                    $.each( videoNames, function (i, vidName) {
                        var vid = catalogXml.find('video[filename="' + vidName + '"]');
                        if (null == vid) return false;

                        var scriptName = vid.attr('script');
                        var hasScript = (scriptName) ? true : false;
                        //var showScript = hasScript && showScripts;
                        showScripts = showScripts || hasScript;		// if any of the videos have scripts then show a script panel.

                        var videoSize = [ parseInt(vid.attr('width')), parseInt(vid.attr('height')) ];

                        // keep score of a maximum:
                        maxVideoSize[0] = Math.max( maxVideoSize[0], videoSize[0] );
                        maxVideoSize[1] = Math.max( maxVideoSize[1], videoSize[1] );

                        var media = {
                            id: 1 + vitems.length,
                            layer: 'video',
                            realWidth: videoSize[0],
                            realHeight: videoSize[1],
                            fps: vid.attr('fps'),
                            url: baseURI + vidName
                        };
                        if (vid.attr('variant')) {
                            media['variant'] = vid.attr('variant');
                        } else {
                            media['variant'] = (parseInt(vid.attr('version')) > 8) ? "avm2" : "avm1";		//best guess, not totally acurate
                        }

                        if (vid.attr('start')) {
                            media['start'] = vid.attr('start');
                        }
                        if (vid.attr('end')) {
                            media['end'] = vid.attr('end');
                        }
                        vitems.push(media);

                        if (hasScript) {
                            var script = {
                                id: 1 + vitems.length,
                                layer: 'script',
                                url: baseURI + scriptName,
                                linkTo: media.id
                            };
                            vitems.push(script);
                        }
                    });

                    // Now we need to know the size of the <object> tag which has to take into account the max-video size + the 'chrome' of the player.
                    var playerSize = [
                          (showScripts) ? maxVideoSize[0] + 200 : maxVideoSize[0] + 2,
                          maxVideoSize[1] + 24
                      ];

                    //FIXME: This should be a) something the theme might want to 'know about', and b) something that is 'undone' when the content is released...
                    // theme.size( { y: (playerSize[1] + 4) } );
                    if (window.__isIe6) {
                        $('#content-main').css('height', (playerSize[1] + 24) + "px");
                    } else {
                        $('#content-main').css('minHeight', (playerSize[1] + 4) + "px");
                    }

                    // This uses the CSP1 module, which I made different from the content-renderer
                    cspId = CSP1( tmpId, vitems, maxVideoSize, playerSize, topic.id );

                    // Need to register the function to process video completion information:
                    var loadCount = 0;
                    // window.csp_callbacksRegistered = function () {};		// csp_callbacksRegistered is when the CSP is 'ready'
                    window.csp_totalTimeUpdate = function (data) {
                        loadCount++;
                        if (loadCount < 4) {
                            return;
                        }
                        window.csp_totalTimeUpdate = null;
                        delete window['csp_totalTimeUpdate'];

                        // FIXME: There should be some (theme/wbt) framework level 'interval' register system - someway to clear the thing when we remove the renderer
                        var videoObj = $('#' + cspId);
                        if ((videoObj) && (videoObj = videoObj[0])) {
                            // we track the duration - 2.5 seconds to try and give the user a little lee-way.
                            if (videoObj.csp_currentTime) {
                                isReady = true;
                                var _videoDuration = videoObj.csp_totalPlaybackTime() - 2500;

                                _interval = setInterval(function() {
                                    if (videoObj.csp_currentTime) {
                                        var time = videoObj.csp_currentTime();
                                        if (time >= _videoDuration) {
                                            topic.setStatusVal( _Status.COMPLETED );
                                        }
                                    } else {
                                        // We get here if we manage to navigate away from the 'page' without deactivating the interval (which then has a 'stale' ref to the old video object).
                                        clearInterval( _interval );
                                    }
                                }, 1000);
                            }
                        } else {
                            _log.error("Could not locate SWF player.");
                        }
                    };
                };

                // FIXME: Decide on theme based error handler for asset loading issues.
                _G.xml( catalogUrl, {
                    success: fnCspFromSiteCatalog,
                    error: function (errorData) { theme.handleError('Could not load requested Media.', errorData); }
                });

                var hndl1 = _pubsub.subscribe("net_ipov/wbt/Theme:block", function (theme) {
                    var csp = $('#' + cspId);
                    if ((csp) && (csp.length == 1)) {
                        // wasPlaying = csp.csp_isPlaying();
                        csp[0].csp_pause();
                    }
                });
                //_pubsub.subscribe("net_ipov/wbt/Theme:unblock", function (theme) {});

                return {
                    id: cspId,
                    isReady: isReady,
                    destroy: function(theme, wbt) {
                        if (_interval) clearInterval( _interval );
                        _pubsub.unsubscribe(hndl1);
                    }
                };
            }
        }
    ];
});