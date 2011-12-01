define(["net_ipov/wbt/loader-json", "net_ipov/wbt/wbt", "net_ipov/pubsub"], function (loader, wbt, pubsub) {

	QUnit.module("WBT 'Navigation' Tests");

	QUnit.test("Full JSON Loading", function () {

		QUnit.expect(5);
		QUnit.stop();		// the next bit is async.

		pubsub.subscribe("net_ipov/wbt:contentLoaded", function (myWbt) {
			// T-1
			QUnit.equals( myWbt.rootTopic().title, "SI Markerting Player Test Site", "Verifying the root topic's title." );

			var topic1 = myWbt.topicById("1-2");

			// T-2
			QUnit.equals( topic1.parent.children.length, 3, "The parent of topic '1-2' should have 3 children.");

			// T-3
			QUnit.equals( myWbt.nextContentTopic().id, "1-1", "The first Topic containing content should be '1-1'.");

			// T-4
			QUnit.equals( myWbt.nextContentTopic( myWbt.topicById("1-2") ).id, "1-3", "The Topic after '1-2' should be '1-3'.");

			// T-5
			QUnit.equals( myWbt.prevContentTopic( myWbt.topicById("1-2") ).id, "1-1", "The Topic before '1-2' should be '1-1'.");


			QUnit.start();
		});


		wbt.contentLoader = loader;
        wbt.startup();
	});

});