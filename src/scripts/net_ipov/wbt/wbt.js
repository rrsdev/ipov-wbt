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
 * The "WBT" object is our central 'hub' for WBT applications.
 * Note that when imported as a "AMD" type module the WBT is essentially a static object so we can
 * then import and use it pretty much anywhere (except in places where that would create a cyclic dependency).
 */
define(
  ["jquery", "jquery.ba-bbq", "net_ipov/pubsub", "net_ipov/log", "net_ipov/cfg", "net_ipov/wbt/status", "net_ipov/wbt/lms/factory"],
  function($, undefined, _pubsub, _log, _cfg, _Status, _LmsConnFactory) {

	var wbt;

	// note the $(window) is very different from the window object itself
	var $win = $(window);

	var myWin = window;
	var fnSetWinTitle = function (title) {
		try {
			// This may generate execption
			myWin.document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
		} catch ( ex ) { }
		try {
			// not sure if this would ever generate an exception or not
			myWin.document.title = title;
		} catch ( ex ) { }
	};

	wbt = {

		EVT_LMS_CONN_ERROR: "net_ipov/wbt:lmsConnError",

		EVT_CONTENT_LOAD_ERROR: "net_ipov/wbt:contentLoadeError",

		EVT_WBT_NAVIGATE: "net_ipov/wbt:navigate",

		EVT_WBT_INIT: "net_ipov/wbt:startup",

		EVT_CONTENT_LOADED: "net_ipov/wbt:contentLoaded",

		//EVT_TOPIC_statusVal: "net_ipov/Topic:statusValChanged",

		/** should be set by a loader-* plugin to load the site data (from JSON, XML, etc)  */
		contentLoader: null,

		/** Typically returned by the loader plugin, this would be the actual site content (see loader-json.js)  */
		contentModel: null,

		/** The Topic (from the contentModel) that is currently active (e.g. should be displayed). */
		currentTopic: null,

		// this is a plugin, must be set by the main() initializer.
		persistor: null,

		theme: null,

		// This is created 'dynamically' by merging the 'WBT' and the 'Theme' i18n inside the wbt-init.js  file
		i18n: null,

		/** At any point after conf() is called we can initalize the WBT - that is cause things to actually happen. */
		init: function(loader, theme, persistorDef) {

		    this.contentLoader = loader;
		    this.theme = theme;				// need a direct handle to this?

			_pubsub.publish(this.EVT_WBT_INIT, [this]);

			_LmsConnFactory( persistorDef, _cfg, $.proxy( function (success, result) {
				// The 'this' object should be the WBT

				if (success) {
					this.persistor = result;
					this.persistor.wbt = this;
					loader( this.persistor,  {
						onSuccess: $.proxy(this._contentLoaded, this),
						onFailure: $.proxy(this._contentLoadError, this)
					});
				} else {
					_pubsub.publish( this.EVT_LMS_CONN_ERROR, [this, result]);
				}

			} , this) );
		},

		/**
		 * Callback triggered by (typically) the contentLoader when it has loaded and initialized the data structure.
		 */
		_contentLoaded: function (content) {
			this.contentModel = content;		// this should be the root node.
			content.root.isAbsRoot = true;		// this WBT structure has only one 'root' - its a 'tree' not a 'forest'

			_pubsub.publish( this.EVT_CONTENT_LOADED, [this]);

			// Register window unload event... (need to double check w/ onbeforeunload) - I think that is not going to work, and the onunload may generate errors...
			$(window).bind('unload', $.proxy(this.exit, this) );

			var tpc = (content.root.content) ? content.root : this.firstContentDescd(content.root);
			var rootId = tpc.id;

			var initTopicId = $.bbq.getState( "tid" );
			var storedLocId = this.persistor.getLessonLocation();

			if ((undefined == initTopicId) && (undefined != storedLocId)) {
				if ((this.persistor.isConnected()) || (1 === this.persistor.DS._alwaysRestore)) {
					// We're in SCORM mode, always restore
					initTopicId = storedLocId;
				} else if (undefined == this.persistor.DS._alwaysRestore) {
					var tpcStr = this.topicById( storedLocId );
					if (tpcStr) {
						var desc = this.i18n.restoreSessionDesc.replace( "%s", tpcStr.title );

						var fnOn = $.proxy( function (result) {
							if (result.remember) {
								this.persistor.DS._alwaysRestore = ("yes" == result.value) ? 1 : -1;
							}
							if ("yes" == result.value) {
								this.onNavigate( storedLocId );
							} else {
								this.onNavigate( rootId );
							}
						}, this);
						this.theme.confirm(fnOn, this.i18n.restoreSessionTitle, desc, this.i18n.restoreSessionRemember );		// could add 'flags' to add 'yes', 'no', 'cancel', etc..
						return;		// need to wait for the user
					}
				}
			}

			this.onNavigate( initTopicId || rootId );
		},

		/** Should be run before the WBT is closed/exited. Will attempt to store the user's persistence state. */
		exit: function () {
			try {
				$win.unbind('unload');
			} catch (ex) {}
			//try {
				this.persistor.close( true );		// go ahead and call directly, persistence.finish() is guarded internally so it will only run once.
			//} catch (ex) {}
		},

		_contentLoadError: function (err) {
			_pubsub.publish( this.EVT_CONTENT_LOAD_ERROR, [this, err]);
		},

		/**
		 * Given the parameter idOrTopic return a Topic (if one exists).
		 * @param idOrTopic Either a string Id of a topic, or a Topic object that should be loaded as the content (e.g. set as this.currentTopic).
		 */
		_topicFromId: function (idOrTopic) {
			//alert( typeof idOrTopic );
			return ("string" == typeof idOrTopic) ? this.topicById(idOrTopic) : idOrTopic;
		},


		/**
		 * Navigate to the selected topic (selected either via string Id or as an object).
		 * This is the Primary means to implement navigation, as it fully updates all internal state, and sets the location.hash for bookmarkability
		 * @param idOrTopic Either a string Id of a topic, or a Topic object that should be loaded as the content (e.g. set as this.currentTopic).
		 */
		navigate: function ( idOrTopic ) {
			if ((undefined == idOrTopic) || (null == idOrTopic)) {
				_log.error("WBT.navigate called on null topic or Id.");
				return;
			}

			var tpcId = (idOrTopic.id) ? idOrTopic.id : idOrTopic;
			$.bbq.pushState({ tid: tpcId });
		},

		onNavigate: function ( idOrTopic ) {
			if ((undefined == idOrTopic) || (null == idOrTopic)) {
				_log.error("WBT.navigate called on null topic or Id.");
				return;
			}

			var tpc = this._topicFromId(idOrTopic);
			if ((undefined == tpc) || (null == tpc)) {
				_log.error("WBT.navigate called on topic Id '" + idOrTopic + "' that does not exist in the WBT.");
				return;
			} else if (!(tpc.content)) {
				// need to find next item w/ content
			}

			var oldTpc = this.currentTopic;
			this.currentTopic = tpc;
			fnSetWinTitle( tpc.title );

			_pubsub.publish( this.EVT_WBT_NAVIGATE, [this, tpc, oldTpc] );

			tpc.setStatusVal( _Status.INCOMPLETE );		// since lower status values don't auto-replace higher ones this is safe

		},

		/**
		 * Starts with the argument passed in OR this.currentTopic and returns what would be the next topic in given the contentModel (which is a tree of topics)
		 * Note that function is only a getter not a setter, the currentTopic is not changed by this function.
		 * @param theTopic A Topic object to call .next on it, or null to get this.currentTopic.next
		 */
		nextTopic: function( theTopic ) {
			return (theTopic) ? theTopic.next : this.currentTopic.next;
		},

		/**
		 * Starts with the argument passed in OR this.currentTopic and returns what would be the next topic in given the contentModel (which is a tree of topics)
		 * Note that function is only a getter not a setter, the currentTopic is not changed by this function.
		 * @param theTopic A Topic object to call .prev on it, or null to get this.currentTopic.prev
		 */
		prevTopic: function( theTopic ) {
			return (theTopic) ? theTopic.prev : this.currentTopic.prev;
		},

		/**
		 * Returns the root of the contentModel.
		 * Note that function is only a getter not a setter, the currentTopic is not changed by this function.
		 */
		rootTopic: function() {
			return this.contentModel.root;
		},

		/**
		 * Returns the parent topic, either for theTopic, of if null then for this.currentTopic.
		 * Note that function is only a getter not a setter, the currentTopic is not changed by this function.
		 */
		parentTopic: function( theTopic ) {
			return (theTopic) ? theTopic.parent : this.currentTopic.parent;
		},

		/**
		 * Returns the topics children, either for theTopic, of if null then for this.currentTopic.
		 * Note that function is only a getter not a setter, the currentTopic is not changed by this function.
		 */
		childTopics: function( theTopic ) {
			return (theTopic) ? theTopic.children : this.currentTopic.children;
		},

		/**
		 * Find a topic based on that Topic's unique (per site) id.
		 */
		topicById: function (id) {
			return this.contentModel.byId( id );
		},

		/**
		 * Depth first iteration of the content tree.
		 * @param fn Function(topic)  A function that is handed the current topic as they are iterated over.
		 */
		walkTree: function (fn, topic) {
			var tpc = (topic) ? topic : this.contentModel.root;
			var walker = function (tpc /* the topic */) {
				fn(tpc);
				if (tpc.children) {
					$.each(tpc.children, function (i, t) {
						walker(t);
					});
				}
			};
			walker(tpc);
		},

		// Runs a depth-first search for the first descendent of the current node that has content.
		/**
		 * Find the 'first' descendent of a topic that has a content property.
		 */
		firstContentDescd: function (theTopic) {
			if ((null == theTopic) || (undefined == theTopic)) {
				return null;
			}
			var children = theTopic.children;

			if (null == children) {
				return null;
			}

			for (var i = 0; i < children.length; i++) {
				if (children[i].content) {
					return children[i];
				}
				var tpc = this.firstContentDescd( children[i] );
				if (null != tpc) {
					return tpc;
				}
			}

			return null;
		},

		// Runs a depth-first search for the 'last' decendent of the current node that has content.
		/**
		 * Find the 'last' descendent of a topic that has a content property.
		 */
		lastContentDescd: function (theTopic) {
			if ((null == theTopic) || (undefined == theTopic)) {
				return null;
			}
			var children = theTopic.children;

			if (null == children) {
				return null;
			}

			for (var i = (children.length - 1); i >= 0; i--) {
				var tpc = this.lastContentDescd( children[i] );
				if (null != tpc) {
					return tpc;
				} else if (children[i].content) {
					return children[i];
				}
			}

			return null;
		},

		nextContentTopic: function ( theTopic ) {
			// TODO: it would make sense to have some type if 'cache', maybe 32 entries max fifo buffer to store 'resolved' data for this stuff.
			var topic = (theTopic) ? theTopic : this.currentTopic;

			if (topic._nextCnTpc) {
				return topic._nextCnTpc;
			} else {

				var cm = this.contentModel;
				var nextCnTpc = null;

				// First we check the topic's descendents
				var tpc = this.firstContentDescd( topic );
				if (null != tpc) {
					nextCnTpc = tpc;
				} else {

					// Then we check the topic's siblings
					var t_next = topic.next;
					if (t_next) {
						if (t_next.content) {
							nextCnTpc = t_next;
						} else {
							nextCnTpc = this.nextContentTopic(t_next);
						}
					}

					// finally we search upwards for the parent's siblings
					if (null == nextCnTpc) {
						var t_parent = topic.parent;
						while (t_parent != null) {
							t_next = t_parent.next;

							if (t_next) {
								if (t_next.content) {
									nextCnTpc = t_next;
								} else {
									nextCnTpc = this.nextContentTopic(t_next);
								}
								break;
							} else {
								t_parent = t_parent.parent;
							}
						}
					}
				}

				topic._nextCnTpc = nextCnTpc;
				return nextCnTpc;	// we're at the 'end'
			}

		},

		prevContentTopic: function ( theTopic ) {
			var topic = (theTopic) ? theTopic : this.currentTopic;

			if (topic._prevCnTpc) {
				return topic._prevCnTpc;
			} else {

				var prevCnTpc = null;

				// First we check the topic's descendents
				//var tpc = this.lastContentDescd( topic );
				//if (null != tpc) {
				//	prevCnTpc = tpc;
				//} else {

					// Then we check the topic's siblings
					var t_prev = topic.prev;
					if (t_prev) {
						if (t_prev.content) {
							prevCnTpc = t_prev;
						} else {
							prevCnTpc = this.prevContentTopic(t_prev);
						}
					}

					// finally we search upwards for the parent's siblings
					if (null == prevCnTpc) {
						var t_parent = topic.parent;
						while (t_parent != null) {
							t_prev = t_parent.prev;

							if (t_prev) {
								if (t_prev.content) {
									prevCnTpc = t_prev;
								} else {
									prevCnTpc = this.nextContentTopic(t_prev);
								}
								break;
							} else {
								t_parent = t_parent.parent;
							}
						}
					}
				//}

				topic._prevCnTpc = prevCnTpc;
				return prevCnTpc;	// we're already at the 'start'
			}
		}
	};




	// Bind the event.
	$win.bind( "hashchange", function(evt) {
		var topicId = $.bbq.getState( "tid" );
		wbt.onNavigate(topicId);
	});

	return wbt;
});