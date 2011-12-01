define(["jquery", "net_ipov/pubsub"], function ($, _pubsub) {

	return function(theme, wbt, data) {
		var parentEle = $(data.parentEle);
		var domNode = $('<div class="breadcrumbs"></div>');
		parentEle.append(domNode);


		var fnCrumbClk = function (evt) {
			evt.preventDefault();	// just in case.
			var e = $(evt.currentTarget);
			wbt.navigate( e.data("topicId") );
		};
		var fnMakeCrumb = function (tpc, lnkTitle, bindClk) {
			var e = $('<span class="breadcrumb"><span>' + lnkTitle + '</span></span>');
			e.data("topicId", tpc.id);
			if (bindClk) {
				e.click(fnCrumbClk);
			}
			domNode.append(e);
			return e;
		};

		var lastParentTpc = null;
		var fnOnNav = function (wbt, tpc, oldTpc) {
			if (null == tpc.parent) {
				// We're on the "Home" page already
				lastParentTpc = null;
				domNode.empty();

				fnMakeCrumb( tpc, theme.i18n["homePage"], false );
			} else {
				if (lastParentTpc != tpc.parent) {
					// Parent topic not the same, redraw breadcrumbs
					lastParentTpc = tpc.parent;
					domNode.empty();

					// Loop over the parent structure, prepending to array:
					var crumbsTpcs = [tpc];
					var pTpc = tpc;
					while (null != (pTpc = pTpc.parent)) {
						crumbsTpcs.unshift(pTpc);
					}

					$.each( crumbsTpcs, function (indx, cTpc) {
						fnMakeCrumb( cTpc, (null != cTpc.parent) ? cTpc.title : theme.i18n["homePage"], cTpc != tpc );
					});

				} else {
					// Parent is the same, just redraw the last crumb link
					var e = domNode.find('.breadcrumb').last();
					e.empty();		// clear any event handlers and such.
					e.remove();

					fnMakeCrumb( tpc, tpc.title, false );
				}
			}
		};

		var hndl = _pubsub.subscribe("net_ipov/wbt:navigate", fnOnNav);
		if (wbt.currentTopic) {
			fnOnNav(wbt, wbt.currentTopic, null);
		}

		/**
		 * This is the "Widget Function" return - its created when the widget is setup (above) and contains a function .destroy() which removes the 'widget' from the page.
		 */
		return {
			destroy: function () {
				try {
					_pubsub.unsubscribe(hndl);
					//parentEle.remove(domNode);
				} catch (ex) {}
			}
		};

	};
});