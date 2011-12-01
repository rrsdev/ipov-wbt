/**
 * A set of custom tags for the "JsRender" engine.
 *
 * Return Type: object w/ collection of functions which can be run to register a particluar 'tag'.
 *
 */
define(["jquery", "jsrender"], function($) {
	return {

		tmpl: function () {
			$.views.registerTags({
				'tmpl': function (tmplName) {
					var val = $.render(tmplName, this.data, this.ctx);
					return (val) ? val : '';	//no 'undefined'..
				}
			});
		}

	};
});