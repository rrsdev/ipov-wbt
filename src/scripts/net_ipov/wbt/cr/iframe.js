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
define(["jquery", "net_ipov/log", "net_ipov/pubsub"], function ($, _log, _pubsub) {

    return [
        {
            filter: "text/html",
            renderTo: function (theme, parentEle, topic, content, data) {

                if (!(content.url)) {
                    // error out
                    alert('No url specified for iframe html in site.js');
                }

                // make sure we reset the size.
                theme.size();

                var tmpId = "iframe" + $.now();

                //FIXME: Add a utility function that can handle this
                var url = /^http(s)?:/.test( content.url ) ? content.url : 'site/' + content.url;

                // IE9 doesn't like setting the iframe height & width in css, so set it here..
                parentEle.html(
                    '<iframe id="' + tmpId + '" ' +
                        'name="' + tmpId + '" ' +
                        'class="wbt-iframe" ' +
                        'src="' + url + '" ' +
                        'width="100%" height="100%" ' +
                        'frameborder="0" ' +
                        '></iframe>'
                );

                // return the handle back to any manipulation
                return {}

            }
        }
    ];
});