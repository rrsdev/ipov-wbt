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
define(["jquery", "net_ipov/pubsub", "net_ipov/log", "net_ipov/wbt/status", "./persistor"], function ($, _pubsub, _log, _Status, Persistor) {

	/**
	 * This simply defines the most basic initialize code
	 */
	var BaseHandler = function (persistor) {
		return {
			_handlerName: "BaseHandler",		// this is basically for debugging.

			// This is called as part of the initialization sequence
			init: function () {
				var lsStatus = persistor.getLessonStatus();

				if (lsStatus == _Status.NOT_ATTEMPTED) {
					// This is a 'new' session, note that this call may not be needed
					persistor.setLessonStatus( _Status.INCOMPLETE );
				}
				return lsStatus;
			}
		};
	};

	/**
	 * Tracking 'strategy' when the entire WBT is linked as a single SCO,
	 * where each content topic is treated as an Objective
	 */
	var TopicAsObjectiveHandler = function (persistor) {
		var baseHandler = BaseHandler(persistor);

		// Here this will map from Topic.id to the Objective Index that topic info was stored as.
		var objctvIdMap = persistor.objctvIdMap = {};

		// Total count of number of objectives..
		var cObjectives = 0;

		// Count of 'completed' objectives
		var cCompleted= 0;

		// Don't even really need '$.extend' here, as everything is shadowed anyway.
		return {
			// Body of sub-class
			_handlerName: "TopicAsObjectiveHandler",

			/** Called if an LMS connection is successfully established. */
			init: function () {
				var lsStatus = baseHandler.init.call(this);
				_log.log("initializing objective handler with lsStatus = " + lsStatus);

				// If we're connected, then we want to flush out any locally stored state.
				if (persistor.isConnected()) {
					persistor.DS.ts = {};
				}

				// This _SHOULD_ mean that the user has been here before
				if (lsStatus > _Status.NOT_ATTEMPTED) {
					persistor.isCompleted = (lsStatus >= _Status.FAILED);
					if ( persistor.config.get('lms.d', 0) == 0) {
						this._initSessionData();
					}
				}
				return lsStatus;
			},

			/*
			 * Remember that this should act as if it is being called before the topics are intially loaded.
			 * If called afterwards, then separate code must be run to make sure they get the correct status value.
			 */
			_initSessionData: function() {

				// For the initial call the base Persistor will return zero, while the LMS connected persistor will return the objective.count value
				var objtvCnt = persistor.getObjectiveCount();
				_log.log("Persistor.getObjectiveCount returned " + objtvCnt );

				for (var i = 0; i < objtvCnt; i++) {
					var data = persistor.getObjectiveData(i);		// this will get the status information by index

					objctvIdMap[ data.id ] = i;
					persistor.DS.ts[ data.id ] = data.status;

					if ( data.status >= _Status.FAILED ) {	// 'failed' is a type of completion
						persistor.cObjectives = ++cObjectives;
					}

				}
			},

			onTopicLoad: function (tpc) {
				_log.log("Hanlder.onTopicLoad() for topic id = " + tpc.id );
				// On the LMS version we could use the objective.count value, but that is only the current # known anyway.
				if (tpc.content) {
					persistor.cObjectives = ++cObjectives;
				}
			},

			updateTopicStatus: function (topic, newStatus, oldStatus) {
				_log.log("updateTopicStatus() on topic : " + topic.id + ', with new status = ' + newStatus );
                if (topic.content) {
                	_log.log("The topic has content.");
                	if (persistor.isConnected()) {
						var data = {
							status: newStatus
						};

						// In this mode we're really only tracking overall completion anyway... the basic topic logic should be "NOT_ATTEMPTED" -> "INCOMPLETE" -> "COMPLETED"
						if (newStatus == _Status.FAILED) {
							data.score = 0;
						} else if (newStatus == _Status.PASSED) {
							data.score = 100;
						}

						data.indx = objctvIdMap[ topic.id ];
						if (undefined == data.indx) {
							data.indx = persistor.getObjectiveCount();
							data.id = topic.id;		// set this here
						}

						persistor.setObjectiveData(topic.id, data);
                	}

                	// Now logic to see if the whole 'Lesson' is complete.
    				if (( newStatus >= _Status.FAILED ) && (oldStatus < _Status.FAILED)) {	// 'failed' is a type of completion
    					cCompleted++;
    				} else if ((newStatus < _Status.FAILED) && (oldStatus >= _Status.FAILED)) {
    					cCompleted--;
    				}
				}

                // If the number of completed objectives == the number of total objectives, then we're done
				if (cCompleted === cObjectives) {
					this.finishLesson();
				}
			},

			finishLesson: function() {
				var isComplete = true;
				var score = 0;		// TODO: Look at how to support the notition of 'only completed, not passed/failed'
				var count = 0;
				persistor.wbt.walkTree(function (tpc) {
					// This is where the logic to actually check the 'score' is
					var status = persistor.DS.ts[ tpc.id ];
					isComplete = isComplete && (status > _Status.INCOMPLETE);
					if (status === _Status.FAILED) {
						count++;
					} else if (status === _Status.PASSED) {
						count++;
						score++;
					}
				});

				if (count > 0) {
					score = Math.round( score * 100 / count );
					// Currently no logic to set needed score anywhere else:

					var lPassed = (score >= 70);
					persistor.setLessonScore( score );
					persistor.setLessonStatus( lPassed ? _Status.PASSED : _Status.FAILED );
				} else if (isComplete) {
					if (persistor.config.get('lms.sc', 0) == 1) {
						persistor.setLessonScore( 100 );	// force completion 'score' in some cases
					}
					persistor.setLessonStatus( _Status.COMPLETED );
				}

				//TODO: Question: Should we display something to the use when the lesson complete?
			}

	    }
	};



	//var TopicAsLessonStrategy = {}

	/**
	 * Tracking 'strategy' when the entire WBT is linked as a single SCO,
	 * where the WBT has explicitly configured objectives which trigger overall completion progress.
	 * In this mode Topic completion is tracked via the LocalSession object.
	 */
	//var SingleScoQuizStrategy = {}
	//var MultiScoQuizStrategy = {}

	/*
	 * A factory function, which when called, will attempt to connect to the LMSAdaptor (if provided/set)
	 * and will fallback to the plain Persistor or fail (depends of config settings)
	 *
	 * Either call as  (config, onComplete)
	 *  of (lmsAdaptorCtr, config, onComplete)
	 *
	 */
	return function () {
		var lms, config, onComplete;
		if (2 == arguments.length) {
			config = arguments[0];
			onComplete = arguments[1];
			lms = (config.lmsAdaptor) ? config.lmsAdaptor : Persistor;
		} else if (3 == arguments.length) {
			lms = (arguments[0]) ? arguments[0] : Persistor;
			config = arguments[1];
			onComplete = arguments[2];
		} else {
			// ERROR
			throw "LMS Factory: Incorrect number of arguments.";
		}

		var fnDone = function ( lmsAdaptorCtr ) {
			var lmsAdaptor = lmsAdaptorCtr(config);

			// For now we always use this one, in the future we could use a different implementation
			var handler = TopicAsObjectiveHandler(lmsAdaptor);
			lmsAdaptor.setObjtvHandler(handler);

			if (lmsAdaptor.initialize()) {
				// Setup listeners here:
				_pubsub.subscribe("net_ipov/Topic:statusChange", $.proxy( lmsAdaptor.updateTopicStatus, lmsAdaptor ) );
				_pubsub.subscribe("net_ipov/wbt:navigate",  $.proxy( lmsAdaptor.updateLocation, lmsAdaptor ) );

				onComplete(true, lmsAdaptor);
			} else if ((Persistor == lmsAdaptorCtr) || (config.get('lms.f', 0) != 0)) {
				onComplete(false, null);
			} else {
				// Fall back to the plain 'Persistor' connection (uses localSesson)
				fnDone( Persistor );
			}
		};

		if ("string" === lms) {
			// need to do a 'require'
			if ((lms.indexOf('.') == -1) && (lms.indexOf('/') == -1)) {
				lms = "./" + lms;		// turn it into a relative module path
			}
			require([lms], fnDone);
		} else {
			fnDone(lms);

		}

	};

});