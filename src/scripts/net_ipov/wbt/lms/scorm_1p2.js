define(["jquery", "net_ipov/log", "net_ipov/wbt/status", "./persistor", "./scorm_1p2_base"],
  function($, _log, _Status, Persistor, Base12) {

	/** These are the status values allowed when updating status of objectives (which we map to either Topics or quiz items depending on configuration. */
	var _STATUS_CODES = ['not attempted', 'browsed', 'incomplete', 'failed', 'completed', 'passed'];
	var _STATUS_VALS = {};
	for (var i = 0; i < _STATUS_CODES.length; i++) {
		_STATUS_VALS[ _STATUS_CODES[i] ] = i;
	}

	var _ERROR_CODES = {
		NoError: 0,
		GeneralException: 101,
		GeneralError: 101,
		ServerBusy: 102,
		InvalidArgumentError: 201,
		ElementCannotHaveChildren: 202,
		ElementIsNotAnArray: 203,
		NotInitialized: 301,
		NotImplementedError: 401,
		InvalidSetValue: 402,
		ElementIsReadOnly: 403,
		ElementIsWriteOnly: 404,
		IncorrectDataType: 405
	};


	/*******************************************************************************
	**
	** Function findAPI(win)
	** Inputs:  win - a Window Object
	** Return:  If an API object is found, it's returned, otherwise null is returned
	**          If the API object is FOUND, then the script registers itself w/ the containing window to recieve any LMS calls.
	**
	** Description:
	** This function looks for an object named API in parent and opener windows
	**
	*******************************************************************************/
	var findAPI = function ( win )  {
	    for (var i = 0; i < 10; i++) {
	        if (win.API != null) {
	            return win.API;
	        } else if (win.parent != null && win.parent != win) {
	            win = win.parent;
	        } else if (win.opener != null) {
	            win = win.opener;
	        } else {
	        	return null;
	        }
	    }
	    return null;
	};

	// 'Module' constructor pattern for the scorm_1p2 module
	return function (config) {
		var persistor = Persistor(config);

		return $.extend( {}, persistor, Base12, {

		// scorm 1.2 extensions to the Persistence class (mostly)
		ptype: "SCORM1.2",
		startTime: null,
		_hasError: false,
		_scormAPI: null,
		_apiInfo: null,

		// This is created in the Objectives Handler as needed:
		//objctvIdMap: null,

		// Note that because of the way our current logic works, we can initialize() without actually having an LMS connection
		// it might be more logical to split this out at some point, but for now that's the way things work for this code.
		initialize: function () {
			_log.log("scorm_1p2.initialize() called");
			if ((!this.isInitialized) && (!this.isTerminated)) {
				// We're going to initialize handle here
				try {
					this._scormAPI = findAPI(window);
				} catch (ex) {
					_log.log("Unable to find SCORM 1.2 API handle.");
					_log.dir( ex );
					return false;
				}

			    if (this._scormAPI) {
			    	_log.log("About to initialize SCORM api.");
			        var result = this._scormAPI.LMSInitialize("");
			        this.isConnd = ("true" === result);
			        this._hasError = !this.isConnd;

			        this.startTime = new Date();

			        _log.log("SCORM is connected = [" + this.isConnd + "]");
			        if (this.isConnd) {
				        // Get the info on the main allowed calls:
				        var txtInfo = this.readD("cmi.core._children");
				        var apiInfo = this._apiInfo = {};
				        if (txtInfo) {		// at least for Reload Editor, this is returning null.
					        $.each( txtInfo.split(","), function (i, val) {
					        	apiInfo[val] = 1;
					        });
				        }
				        var entry = this.readD("cmi.core.entry");
				        if ("resume" == entry) {
					        if (apiInfo['lesson_location']) {
					        	var loc = this.readD("cmi.core.lesson_location");
					        	if (loc) {
					        		this.DS.LId = loc;		// We're going to assume we will be able to handle reading the .LId value later
					        	}
					        }
				        }
			        }
			    } else {
			    	return false;
			    }

			    // Now we need to be sure to call the parent... using Function.call so I can reset the 'this' keyword
			    return persistor.initialize.call(this);
			} else {
				return false;	// its an error to call 2x
			}
		},

		/** Save any data that has becn changed. */
		_doCommit: function () {
			// This should only be called when commit() has been run.
			if (null == this._scormAPI) {
				_log.log("LMSCommit was not successful: Unable to locate the LMS's API Implementation.");
			} else {
				// Main issue?  Its that some of the LMS implementations don't get their API fully initialized before we want to call 'commit'
				try {
					var result = this._scormAPI.LMSCommit("");
					this._hasError = ("true" !== result);
				} catch (ex) {
					_log.error("Encounter error while calling LMSCommit()." + ex);
				}
			}
		},

		close: function (doCommit) {
			_log.log("scorm_1p2.terminate() called");
			if ((this.isInitialized) && (!this.isTerminated)) {

				// We need to make sure to commit anyway, as we maybe a course that is running in 'dual' mode:
				if (doCommit) {
					if (this._scormAPI) {
						this.putD( "cmi.core.session_time", this.getScoSessionDuration( this.startTime ) );

						var exitStatus = (this.isCompleted) ? '' : 'logout';
						this.putD( "cmi.core.exit", exitStatus );   	//empty string represents a normal exit state from an SCO
					}
					this.commit();
				}

				this.isTerminated = true;

				if (null == this._scormAPI) {
					_log.error("LMSFinish was not successful: Unable to locate the LMS's API Implementation.");
					return false;
				} else {
					var result = this._scormAPI.LMSFinish("");

					// TODO: Consider checking for errors if this is not 'true'
					this._hasError = ("true" !== result);
			        return !this._hasError;
				}
			} else {
				return false;
			}
		},

		getLessonStatus: function () {
			// TODO: Do I need all these checks here?  If the LMS can not be connected to duing initialize() then I'm using the plain Persistor...
			if (this._scormAPI) {
				var s = this.readD("cmi.core.lesson_status");
				return (s) ? _Status.get( s ) : 0;
			}
		},

		setLessonStatus: function ( s /* Status, typically an int */) {
			_log.log("scorm_1p2.setLessonStatus called with value [" + s + "]");
			// The status-values defined in _Status map one-to-one onto SCORM 1.2
			this.isCompleted = ( s > 2);			// 3 is 'failed' which is a type of completion

			this.put("cmi.core.lesson_status",  _STATUS_CODES[s] );
		},

		getLessonScore: function () {
			if (this._scormAPI) {
				var s = this.readD("cmi.core.score.raw");
				return (s) ? parseInt(s) : 0;
			}
		},

		setLessonScore: function (s /* score, a value between 0 and 100 representing the % score. */) {
			this.put("cmi.core.score.raw", "" + s);
		},


		getLessonLocation: function () {
			return this.read("cmi.core.lesson_location");
		},

		setLessonLocation: function (id) {
			if (this._scormAPI) {
				this.putD("cmi.core.lesson_location", id);
			}
		},

		getObjectiveCount: function () {
			var c = this.read("cmi.objectives._count");
			_log.log("getObjectiveCount() returning value of [" + c + "]");
			return (c) ? parseInt(c) : 0;
		},


		getObjectiveData: function ( idOrIndx ) {
			_log.log("scorm_1p2.getObjectiveData() called with id = " + idOrIndx );
			if ("string" == typeof idOrIndx) {
				// find the index that corresponds to the objective.
				idOrIndx = this.objctvIdMap[idOrIndx];
				if (undefined == idOrIndx) {
					return null;		// Not found in the index, it may be a new item... but that should only happen if the LMS allows two user sessions at the same time.
				}
			}

			if (idOrIndx < this.getObjectiveCount()) {
				// Directly call the scormAPI here to by pass the extra checks on the get() function.
				var data = {};

				data.indx = idOrIndx;
				data.id = this.readD("cmi.objectives." + idOrIndx + ".id");
				data.statusTxt = this.readD( "cmi.objectives." + idOrIndx + ".status" );
				data.score = this.readD( "cmi.objectives." + idOrIndx + ".score.raw" );

				// TODO: Some LMS's don't like setting the score.min and score.max values,
				// we may need to check to make sure not setting them at all is still compilant.

				data.status = _STATUS_VALS[ data.statusTxt ];

				return data;
			} else {
				return null;
			}
		},

		/**
		 * Note that you can 'replace' an objective Id by passing in the OLD id as the first parameter and then the NEW Id as  data.id
		 *
		 * Note that when operating in SCORM mode the data object MUST contain a .indx property - this should be the case for current implementations
		 */
		setObjectiveData: function ( id, data ) {
			_log.log("scorm_1p2.setObjectiveData() called with id = " + id);

			if (undefined == data.indx) {
				_log.error("The data object passed to scorm_1p2.setObjectiveData(..) MUST have a .indx property, which specifies the SCORM objective index to use.");
				return;
			}

			// Maybe this should only be set for the first time.. I'm not really sure if it completely matters or not.
			if (data.id) {
				this.putD("cmi.objectives." + data.indx + ".id", data.id);
				this.objctvIdMap[id] = data.indx;
			}

			if (data.status) {
				// TODO: Is there anything else I need to think about for out-of-range possibilities?
				var val = Math.min( Math.max(data.status, 0), _STATUS_CODES.length - 1);
				this.putD( "cmi.objectives." + data.indx + ".status", _STATUS_CODES[val] );
			}

			if (undefined != data.score) {
				this.putD( "cmi.objectives." + data.indx + ".score.raw", "" + data.score );
			}

		},


		/**
		 * Get an LMS value, this connects directly to the LMS API unless otherwise specified by the implementing object.
		 * Note that this call must use SCORM 1.2 format keys (e.g. "cmi.core.lesson_location" )
		 *
		 * @return The string value of the requested key, or null.
		 */
		read: function (key) {
			_log.log('Entering scorm_1p2.get("' + key + '")');
			if (null == this._scormAPI) {
				_log.error("LMSGetValue was not successful: Unable to locate the LMS's API Implementation.");
				return null;
			} else {
				return this.readD(key);
				/*
				var errCode = this._scormAPI.LMSGetLastError().toString();
				if (errCode != _NoError) {
					// an error was encountered so display the error description
					var errDescription = this._scormAPI.LMSGetErrorString(errCode);
					_log.error("LMSGetValue("+name+") failed. \n"+ errDescription);
				} */
			}
		},

		/** "Read Direct", bypasses check on scromAPI */
		readD: function (key) {
			var value = this._scormAPI.LMSGetValue(key);
			if (value) {
				return value.toString();
			} else {
				this._hasError = true;
				return null;
			}
		},

		/**
		 * Set an LMS value, this connects directly to the LMS API unless otherwise specified by the implementing object.
		 * Note that this call must use SCORM 1.2 format keys (e.g. "cmi.core.lesson_location" )
		 *
		 * @return Boolean : true if the set() operation succeeded, false if there was an error.
		 */
		put: function (key, value) {
			_log.log('Entering scorm_1p2.set()');
			//if (_scoDebug) {
			//	_log.log('doLMSSetValue("' + name + '", "' + value + '")');
			//}
			if (null == this._scormAPI) {
				_log.error("LMSSetValue was not successful: Unable to locate the LMS's API Implementation.");
				return false;
			} else {
				return this.putD(key, value);
			}
		},

		/**
		 * "Put Direct" - Does not check for API connection, but does check for and store error state.
		 * @return Boolean : true if the set() operation succeeded, false if there was an error.
		 */
		putD: function(key, value) {
			var result = this._scormAPI.LMSSetValue(key, value);
			this._hasError = ("true" !== result);
	        return !this._hasError;
		},

		/* Has an LMS / Connection Error occured */
		hasError: function () {
			return this._hasError;
		},

		/*******************************************************************************
		 **
		 ** Function getLastLMSError()
		 ** Inputs:  None
		 ** Return:  The error code that was set by the last LMS function call
		 **
		 ** Description: Call the LMSGetLastError function
		 **
		 *******************************************************************************/
		getLastError: function () {
			if (null == this._scormAPI) {
				_log.error("LMSGetLastError was not successful: Unable to locate the LMS's API Implementation.");
				return _ERROR_CODES.GeneralError;
			} else {
				return this._scormAPI.LMSGetLastError();
			}
		},


		/*******************************************************************************
		 **
		 ** Function getLMSErrorString(errorCode)
		 ** Inputs:  errorCode - Error Code
		 ** Return:  The textual description that corresponds to the input error code
		 **
		 ** Description: Call the LMSGetErrorString function
		 **
		 ********************************************************************************/
		getLMSErrorString: function (errorCode) {
			if (null == this._scormAPI) {
				var msg = "LMSGetErrorString was not successful: Unable to locate the LMS's API Implementation.";
				_log.error(msg);
				return msg;
			} else {
				var v = this._scormAPI.LMSGetErrorString(errorCode);
				return (v) ? v.toString() : null;
			}
		},

		/*******************************************************************************
		 **
		 ** Function getLMSDiagnostic(errorCode)
		 ** Inputs:  errorCode - Error Code(integer format), or null
		 ** Return:  The vendor specific textual description that corresponds to the
		 **          input error code
		 **
		 ** Description: Call the LMSGetDiagnostic function
		 **
		 *******************************************************************************/
		getLMSDiagnostic: function (errorCode) {
			if (null == this._scormAPI) {
				var msg = "LMSGetDiagnostic was not successful: Unable to locate the LMS's API Implementation.";
				_log.error(msg);
				return msg;
			} else {
				var v = this._scormAPI.LMSGetDiagnostic(errorCode);
				return (v) ? v.toString() : null;
			}
		}
	});
	};
});