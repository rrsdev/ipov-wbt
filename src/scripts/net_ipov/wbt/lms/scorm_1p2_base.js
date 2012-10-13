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
/** A collection of SCORM 1.2 'helper' functions. */
define([], function () {
	var Base12 = function() {
		return {
		getScoSessionDuration: function (startDate) {
		   if  (startDate) {
		      var currentDate = new Date().getTime();
		      var elapsedSeconds = ( (currentDate - startDate) / 1000 );
		      return this.convertTotalSeconds( elapsedSeconds );
		   } else {
		      return "00:00:00.0";
		   }
		},
		convertTotalSeconds: function (ts) {
			   var sec = (ts % 60);

			   ts -= sec;
			   var tmp = (ts % 3600);  //# of seconds in the total # of minutes
			   ts -= tmp;              //# of seconds in the total # of hours

			   // convert seconds to conform to CMITimespan type (e.g. SS.00)
			   sec = Math.round(sec*100)/100;

			   var strSec = new String(sec);
			   var strWholeSec = strSec;
			   var strFractionSec = "";

			   if (strSec.indexOf(".") != -1) {
			      strWholeSec =  strSec.substring(0, strSec.indexOf("."));
			      strFractionSec = strSec.substring(strSec.indexOf(".")+1, strSec.length);
			   }

			   if (strWholeSec.length < 2) {
			      strWholeSec = "0" + strWholeSec;
			   }
			   strSec = strWholeSec;

			   if (strFractionSec.length) {
			      strSec = strSec+ "." + strFractionSec;
			   }
			   if ((ts % 3600) != 0 ) {
			      var hour = 0;
			   } else {
			       var hour = (ts / 3600);
			   }
			   if ( (tmp % 60) != 0 ) {
			      var min = 0;
			   } else {
			       var min = (tmp / 60);
			   }
			   if ((new String(hour)).length < 2) {
			      hour = "0" + hour;
			   }
			   if ((new String(min)).length < 2) {
			      min = "0"+min;
			   }
			   return hour + ":" + min + ":" + strSec;
			}
		};
	};
	return Base12;
});