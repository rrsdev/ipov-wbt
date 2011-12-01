define(["jquery", "swfobject"], function ($, undefined) {
	return function (eleId, vitems, videoSize, playerSize, id, cfg) {
		cfg = cfg || {};
		cfg = $.extend({
			debug: true,
			trackUsage: true,
			ui: {trackUsage: true},
	        autoplay: "true",
	        loopplay: "false",
	        vitems: vitems
	    }, cfg );

		var flashvars = {
			JSON: escape( JSON.stringify(cfg) )
		};
		//,
        //videoWidth: videoSize[0],
        //videoHeight: videoSize[1]
		var params = {
	        swfliveconnect: "true",
	        allowScriptAccess: "always",
	        allowFullScreen: "true",
	        salign: "lt",
	        scale: "noscale",
	        loop: "false",
	        wmode: 'opaque'
	    };
		var attrs = {
			id: 'csp_' + id,
			name: 'csp_obj_' + id
		};

		swfobject.embedSWF("scripts/csp-1.4.1.swf", eleId, playerSize[0], playerSize[1], "10.0.0", "expressInstall.swf", flashvars, params, attrs);
		return attrs.id;
	};
});