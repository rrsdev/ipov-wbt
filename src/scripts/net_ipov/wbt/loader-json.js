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
 * Defines our basic JSON based loader for WBT Content.
 * Currently this assumes a location (relative to top-level html) of  ./site/site.js  but we will be adding configuration options.
 */
define(["require", "jquery", "net_ipov/wbt/Topic"], function(reqjs, $, TopicCtr) {

	// This is where we walk the object tree and set up _next, _prev, _parent, and assign the whole shebang into a object w/ correct tree interface...
	var processRawJson = function (persistor, data, callback) {

		var _topicIdMap = {};

		var parentItem = null, tmpItem = null;
		var fnMakeId = function (item) {
			// we might return hash code of the title if it where present,  but since JS doesn't support that...
			return ((item._parent) ? item._parent.id + "-" : "")  + item.title.replace(/\s+/g, "").replace(/\.+/g, "-");
		};

		var fnScan = function (indx, item) {
			if ((null == item.id) || (item.id.length == 0)) {
				item.id = fnMakeId(item);
			}

			// this essentially attaches extra functions to the topic/item
			TopicCtr.makeTopic(item);

			//  Setup heirarchy linkages:
			item.root = data;
			item.parent = parentItem;
			item.childIndx = indx;	// the 'index' that the item occupies it its parent item's children[] array.
			item.depth = (null == parentItem) ? 1 : 1 + parentItem.depth;
			if (indx > 0) {
				parentItem.children[ indx - 1 ].next = item;
				item.prev = parentItem.children[ indx - 1 ];
			} else {
				item.prev = null;
				item.next = null;
			}

			// TODO: Should this check to see if the item Id already exists and throw an error if it does?
			_topicIdMap[ item.id ] = item;

			if ((item.children) && (item.children.length > 0)) {
				tmpItem = parentItem;
				parentItem = item;
				$.each(item.children, fnScan);
				parentItem = tmpItem;
			}

			// Recover the initial status (if there is one, or zero if not):
			if (persistor) {
				persistor.onTopicLoad( item );
			}
		};
		fnScan(-1, data);

		// We are really exposing a very simple 'node' type structure here.
		// We'll have the WBT.js to support more 'advanced' functionality as I think it should be more approriate there.
		// send the data to the callback function wrapped in a simple interface...
		// I am not 100% sure we need this here or if it might not make more sense to push it up to the wbt.js file.
		callback({
			root: data,

			byId: function (id) {
				return _topicIdMap[ id ];
			}
		});

	};


	/**
	 * @return Function(ldrConfig:Object)  A function literal that when called will load the site definitions from the server.
	 * ldrConfig is the single argument, which should contain the following sub-objects:
	 * 	onSuccess - Function of type  fn( topicData ) which will receive the processed markup.
	 *  onFailure - Optional: Function of type  fn( jqXHR, textStatus, errorThrown)
	 *  url	  - Optional: String value, either relative to this file (such as "../../site/site.js") or full.  If not set this value default to "../../site/site.js"
	 *  data  - Optional: Mainly for testing, if set this is assumed to be a data tree (object) similar to what the JSON request would return.  Useful for testing small sets of data.
	 *
	 */
	return function (persistor, ldrConfig) {

		if (ldrConfig.data) {
			processRawJson( persistor, ldrConfig.data, ldrConfig.onSuccess );
		} else {

			var contentUrl = (ldrConfig.url) ? reqjs.toUrl( ldrConfig.url ) : reqjs.toUrl('../../../site/site.js');

			$.ajax({
				  url: contentUrl,
				  dataType: 'json',
				  success: function (data, textStatus, jqXhr) {
				      processRawJson(persistor, data, ldrConfig.onSuccess);
				  },
				  error: function (jqXHR, textStatus, errorThrown) {
					  if (ldrConfig.onFailure) {
						  ldrConfig.onFailure(jqXHR, textStatus, errorThrown);
					  }
				  }
			});
		}

	};
});