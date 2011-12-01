/**
 * Defines the basic persistence code for the WBT infrastructure.
 * This class only implements local storage (uses amplify.store.js to do so).
 * Various "LMS Adapters" can then extend the 'persistence class' to add storage
 */
define(["jquery", "net_ipov/log", "net_ipov/wbt/status"],
  function ($, _log, _Status) {

	/** The _data variable represents the runtime 'user data' for a session, when possible (unless configured otherwise) it will be stored between visits. */
	var _data = {
		LId:null,		// Id for Lesson Location
		LSt: _Status.NOT_ATTEMPTED,		// Lesson Status, our initial status for non-LMS is 'Browsed' since it is 'open' by the time we query this
		LSc: 0,				// Lesson Score
		ts:{}				// Topic State data
	};

	// Standard function used to find a parent Topic's status based on the status values of its children.
	// TODO: I'm relying on secrete constants (1 and 2 in this case) which I'd like to get rid of
	// var STATUS_NAMES = ['NOT_ATTEMPTED', 'BROWSED', 'INCOMPLETE', 'FAILED', 'COMPLETED', 'PASSED']
	var fnStatusFromChildren = function (childs) {
		var len = childs.length;
		var sum = 0;
		for (var i = 0; i < len; i++) {
			// We should be able to basically achieve the results below just by averaging the values.... that's ok as we will explicitly update parent status for when needed
			// if  cval == NOT_ATTEMPTED   then ignore
			// if  cval == BROWSED   then  set parent to browsed?  (we don't usually use browsed, I'm not really sure on its usecase).
			// if  cval == INCOMPLETE  then set parent to incomplete.
			// if  cval == FAILED   then set parent to incomplete?  Hmm, it seems like that's the 'logical' thing, especially since it won't actually 'force' the parent to go 'back' to incomplete if it wasn't already there..
			// if  ALL cval >= COMPLETE then set parent to complete
			// if ALL cval == PASSED then set parent to passed

			sum += childs[i].status;
		}

		// Doesn't really address 'failed' or not, but ok, so its progress
		// My only concern is rounding error, so don't use division
		if (sum == (_Status.PASSED * len)) {
			return _Status.PASSED;
		} else if (sum >= _Status.COMPLETED * len) {
			return _Status.COMPLETED;
		} else {
			return Math.floor( sum / len );
		}
	};


	/**
	 * There are 3 different concerns that the Persistor class must address.
	 *
	 * 1. Provide basic "Data Store" implementation so that when a Topic status changes it is stored.
	 * 2. Update LMS specific notions such as "lesson" and "objective" status when a Topic status changes while
	 *    also providing API to allow other code to directly access LMS basics such as to define and change the Objective / Lesson status
	 * 3. Expose initialize(), commit(), and terminate() calls, which the WBT Application will call.
	 */
	// definition of 'Persistor'
	return function(config) {

		var updLock = 0;

		return {
			// object def goes here

			config: config,		// keep an accessible reference to this

			isInitialized: false,
			isTerminated: false,		// only true after 'close'
			isConnd: false,			// have we been able to connect to the associated LMS?  (for the base Persistor this should always be false).

			isCompleted: false,			/** True if the WBT / Lesson is completed (any status >= FAILED) */

			isDirty: false,
			DS: _data,			//? is this needed?, my main concern is that most of the time it shouldn't really be accessed.

			ptype: "_",		// Persistence Type, should be overridden by sub-classes to specify type, e.g. "scorm_1p2" or such.

			objectiveStrategyIndex: 0,

			// Not really needed here, as it will be set/created by Objectives Handler (see factory.js), but I like to make things easy to 'see'.
			cObjectives: 0,

			/** This will be called BEFORE initialize()  */
			setObjtvHandler: function (handler) {
				_log.log("setObjtvHandler() called");
				this.oHandler = handler;
			},


			/**
			 * Open the connection, fully setting up any internal variables that might be needed.
			 * @return  True if the Persistor is useable, False is an unrecoverable error occured.  Returning false will STOP the loading of the WBT.
			 * @API
			 */
			initialize: function () {
				_log.log("Persistor.initialize() called.");
				if ((!this.isInitialized) && (!this.isTerminated)) {
					this.isInitialized = true;
					// Setup the data store
					if ((config.get('ds',1) > 0) && (config.store) && (config.store.ptype === this.ptype)) {
						this.DS = $.extend( _data, config.store);		// the 'extend' will make sure we get all the hearty goodness of both
					} else {
						this.DS.ptype = this.ptype;
					}

					this.oHandler.init();

					return true;
				} else {
					return false;
				}
			},

			/**
			 * Save any data that has ben changed.
			 * @API
			 */
			commit: function () {
				_log.log("Persistor.commit() called.");
				if ((this.isInitialized) && (!this.isTerminated)) {
					if ((this.isDirty) && (config.get('ds',1) > 0)) {
						amplify.store( config.sid, this.DS );
					}
					this._doCommit();
					this.isDirty = false;
				} // else should possibly throw an Error.
			},

			// 'abstract' method, called after the data-store is saved
			_doCommit: function(){},


			/**
			 * Close the connection, commiting anything that has been changed.
			 * @API
			 */
			close: function (doCommit) {
				if ((this.isInitialized) && (!this.isTerminated)) {
					if (doCommit) {
						this.commit();
					}
					this.isTerminated = true;
					return true;
				} else {
					return false;
				}
			},

			/**
			 * @return  True if the implementation is connected to some type of LMS, False if no connection.
			 */
			isConnected: function() {
				return this.isConnd;
			},

			/**
			 *  Called from Objective Handler (see factory.js)
			 */
			updateTopicStatus: function (tpc, new_s, old_s) {
				updLock++;		// Using updLock to try and make sure we don't do multiple commits if we end up 'walking' up the WBT structure to make changes.

				this.DS.ts[ tpc.id ] = new_s;
				this.isDirty = true;

				this.oHandler.updateTopicStatus(tpc, new_s, old_s);

				// This is a little like what the Objectives Handler does, BUT the difference is we ONLY change Topics here.
				if ((tpc.parent) && !(tpc.parent.content)) {
					// recalculate the parent status value:
					var sval = fnStatusFromChildren(tpc.parent.children);
					tpc.parent.setStatusVal( sval );
				}

				updLock--;
				if (0 == updLock) {
					this.commit();	// go ahead and try to make sure the changes are saved.
				}
			},

			/**
			 *  Called from Objective Handler (see factory.js)
			 */
			updateLocation: function (wbt, tpc, oldTpc) {
				_log.log("updateLocation() for topic = " + tpc.id );
				this.setLessonLocation( tpc.id );
				this.commit();		// Seems silly to do this so close to the topic status change, but it seems to be needed to force remembering the location
			},

			/**
			 * For our contract as a "DataStore", we need to be able to restore/set certain information about a Topic when it is instantiated
			 */
			onTopicLoad: function(tpc) {
				tpc.status = this.DS.ts[ tpc.id ] || 0;
				this.oHandler.onTopicLoad(tpc);
			},

			getLessonLocation: function () {
				return this.DS.LId;
			},

			setLessonLocation: function (id) {
				_log.log("Persistor.setLessonLocation with id [" + id + "]");
				this.DS.LId = id;
				this.isDirty = true;
			},

			/**
			 * @return Int  Should be one of the 'constants' defined by  net_ipov/wbt/status   Subclasses should map/normalize any internal value definitions.
			 */
			getLessonStatus: function () {
				return this.DS.LSt;
			},

			/**
			 * @param  s  Int    The new Status, one of the 'constants' defined by  net_ipov/wbt/status, subclasses should map/normalize internal definitions as needed.
			 */
			setLessonStatus: function ( s /* Status, typically an int */) {
				this.DS.LSt = s;
				this.isDirty = true;
			},

			/**
			 * @return  Int  If applicable will return a score - as a percentage (0 - 100) for the lesson.
			 */
			getLessonScore: function () {
				return this.DS.LSc;
			},

			/**
			 * @param  s  Int  The score - as a percentage (0 - 100) for the lesson.
			 */
			setLessonScore: function (s /* score, a value between 0 and 100 representing the % score. */) {
				if ((s >= 0) && (s <= 100)) {
					this.DS.LSc = s;
				}
			},

			getObjectiveCount: function() {
				// This will be set by the Objectives Handler
				return this.cObjectives;
			},

			getObjectiveData: function ( id ) {
				if (undefined != this.DS.ts[ id ]) {
					var data = {
						id: id,
						status: this.DS.ts[ id ]
					};

					if ((this.DS.obj) && (this.DS.obj[id])) {
						data.score = this.DS.obj[id];
					}

					return data;
				} else {
					return null;
				}
			},

			/**
			 * This implementation just stores the status.
			 * Note that it does NOT make much sense to call this version of the method as it just stores information and will NOT update the WBT status.
			 *
			 */
			setObjectiveData: function ( id, data ) {
				// This will ONLY work when the item is a topic
				if (this.DS.ts[id]) {
					if (undefined != data.status) {
						this.DS.ts[id] = data.status;
					}
					if (undefined != data.score) {
						if (undefined == this.DS.obj) {
							this.DS.obj = {};
						}
						this.DS.obj[id] = data.score;
					}
					this.isDirty = true;
				} else {
					_log.error("The objective identified by [" + id + "], does not appear to be a Topic, which is the only type of object the base Persitor class can handle");
					//throw new Error("Application Error.");
				}
			},

			// Should be overridden by implementation
			hasError: function () {
				return false;
			},

			// Implementation specific, should return error information if there was an error.
			getLastError: function() {
				return null;
			}
		}
	};

});