/*
Copyright (C) 2011-2012 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License v2 or higher.

*/
define(["jquery", "net_ipov/pubsub", "net_ipov/wbt/status"], function ($, _pubsub, _Status) {

	/**
	 * We're going to essentially 'decorate' the existing 'topicItem' with extra properties + methods as needed to create a "Topic".
	 * When re-constituting simple JSON we have a bunch of properties (which may be objects) but no real functions, so we want to add some.
	 */
	var mxin = {

		status: 0,
		_statusAsString: null,

		/**
		 * Set/update the status value of a Topic.
		 * @param statusVal An integer value representing the Status (zero is typically 'unvisited' and increaments from there).
		 * @param force (Optional) The standard implementation is to only ratchet up the statusVal, if force is provided then it can go down as well.
		 * @param noEvt (Optional) Set to false if you want/need to supress the event that typically fires when updating a status.  Note that this means the update is not recorded.
		 */
		setStatusVal: function (statusVal, force, noEvt) {

			if ("string" == typeof statusVal) {
				// convert from String 'constant' into int value.
				statusVal = _Status.get( statusVal );
			}

			if ((statusVal > this.status) || (force)) {
				var oldStatus = this.status;
				this.status = statusVal;
				this._statusAsString = null;
				// broadcast!  We use pubsub to handle all updates at the moment, if we end up needing a cancelable action we may have to reconsider.

				if (false !== noEvt) _pubsub.publish("net_ipov/Topic:statusChange", [this, this.status, oldStatus]);
				return true;
			} else {
				return false;
			}
		},

		statusAsString: function () {
			if (!(this._statusAsString)) {
				var statusCodes = _Status._NAMES;

				// Consider changing the stored status value if this changes...?
				var status = Math.min( Math.max(0, this.status), statusCodes.length - 1);
				this._statusAsString = statusCodes[status];
			}
			return this._statusAsString;
		},

		statusAsPropString: function () {
			return this.statusAsString().toLowerCase().replace(/_/g, "-");
		}

	};


	return {
		makeTopic: function (topicData) {
			return $.extend( topicData, mxin );
		}
	}


});
