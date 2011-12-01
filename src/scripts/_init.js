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
 * Designed to run BEFORE loading RequireJS or JQuery, this mainly sets up the locale and other information that we want to know about before doing much else
 *
 * @depends on  amplify.store.js
 */
// See http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
function get_params(q, o) {
	o = o || {};
	var e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&=]+)=?([^&]*)/g,
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); };
    while (e = r.exec(q)) {
        o[d(e[1])] = d(e[2]);
     }
    return o;
}


// try and determine what locale should be used.
(function (cfg) {
	//TODO: we might want to add some amount of logic checking on the format of these values
	get_params( window.location.search.substring(1), cfg );
	//TODO: do we want to pull in values from the hash?

	// make sure we have a 'location id':
	cfg.sid = (cfg.sid) ? cfg.sid :
		((window) && (window.location) && (window.location.pathname)) ? window.location.pathname : '$ipov$';
	if (window.__isIe6) {
		cfg.sid = "k" + escape(cfg.sid).replace(/-/g, '').replace(/\//g, '$');
	}

	// Keep a ref to the store.
	var ds = cfg['ds'];
	if ((window.amplify) && ((undefined == ds) || (1 == ds))) {
		cfg.store = amplify.store( cfg.sid ) || {};
		cfg.store['date'] = (new Date()).getTime();
		cfg.store['ipov$'] = 1;		// so we know its 'ours'

		//now some code to remove any outdated bits
		setTimeout(function(){
			var s_all = amplify.store();
			var i;
			var lst = [];
			for (var key in s_all) {
				i = s_all[key];
				if ((undefined != i) && (undefined != i['ipov$']) && (key != cfg.sid)) {
					lst.push({
						itm: i,
						key: key
					});
				}
			}

			//TODO: IE6 may need a smaller overhead, need to try and determine how much space we're actually taking
			// If we have more than 100 entries (including current site), them prune the tree
			if (lst.length > 99) {
				lst.sort(function (o1, o2) {
					if (o1.itm.date) {
						if (o2.itm.date) {
							return o2.itm.date - o1.itm.date;
						} else {
							return -1;	// make itm2 be 'lower'
						}
					} else {
						return (o2.itm.date) ? 1 : 0;
					}
				});
				for (var j = 99; j < lst.length; j++) {
					amplify.store(lst[j].key, null);
				}
			}

		}, 10);
	} else {
		cfg.store = {};
	}

	var fnLc = function () {
		if ((cfg.store) && (cfg.store.locale)) {
			return store.locale;
		} else {
			return (navigator.language || navigator.userLanguage || "root").toLowerCase()
		}
	};

	cfg.locale = cfg.locale || fnLc();
})( (window.net_ipov_cfg) || (window.net_ipov_cfg = {}) );