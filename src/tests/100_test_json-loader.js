define(["net_ipov/wbt/loader-json"], function (loader) {

	QUnit.module("JSON Loader Tests");


	QUnit.test("Full JSON Loading", function () {

		QUnit.expect(2);

		QUnit.ok( null != loader, "The Loader should be non-null.");

		QUnit.stop();		// the next bit is async.

		loader.load( null, {
			onSuccess: function (content) {
			    // Now we should be able to test the data interface
  			    // note - it would be nice to have an 'inline' version so we can put everything in one single function without the ajax calling and have the JS def here too

			    QUnit.equals( content.root.title, "SI Markerting Player Test Site", "This is our expected root title for the prefedined data we're testing with." );

			    QUnit.start();
			},
			onFailure: function (err) {
				QUnit.ok(false, "Loader.load() raised an error.");
				QUnit.start();
			}
		});

	});



	QUnit.test("Test Bad URL", function() {
		QUnit.expect(1);
		QUnit.stop();


		loader.load(null, {
			url: "../../dummy-url.js",
			onSuccess: function (data) {
				QUnit.ok(false, "The URL we used should have resulted in failure.");
			    QUnit.start();
			},
			onFailure: function (err) {
				QUnit.ok(true, "URL used resulted in loading failure, which is expected for this test.");
				QUnit.start();
			}
		});
	});



	QUnit.test("Test Loading inline data", function() {
		QUnit.expect(1);
		QUnit.stop();


		loader.load(null, {
			url: "../../dummy-url.js",
			data: {
				title: "Test Title"
			},
			onSuccess: function (data) {
				QUnit.equals( data.root.title, "Test Title", "This is our expected root title for the prefedined data we're testing with.");
			    QUnit.start();
			},
			onFailure: function (err) {
				QUnit.ok(false, "URL used resulted in loading failure.");
				QUnit.start();
			}
		});
	});

	QUnit.test("Navigating Topic Data", function () {

		QUnit.expect(6);

		QUnit.ok( null != loader, "The Loader should be non-null.");

		QUnit.stop();		// the next bit is async.

		loader.load(null, {
			onSuccess: function (content) {
			    // Now we should be able to test the data interface
  			    // note - it would be nice to have an 'inline' version so we can put everything in one single function without the ajax calling and have the JS def here too

			    QUnit.equals( content.root.title, "SI Markerting Player Test Site", "This is our expected root title for the prefedined data we're testing with." );

			    var topic1 = content.byId("1-2");

			    QUnit.ok( null != topic1 , "Topic with id '1-2' should be found in this data.");

			    QUnit.equals( topic1.title, "Where to find Information", "Checking title for Topid with id '1-2'.");

			    QUnit.equals( topic1.next.id, "1-3", "The 'next' topic should be '1-3'.");

			    QUnit.equals( topic1.prev.id, "1-1", "The 'previous' topic should be '1-1'");

			    QUnit.start();
			},
			onFailure: function (err) {
				QUnit.ok(false, "Loader.load() raised an error, aborting test sequence.");
				QUnit.start();
			}
		});

	});

});