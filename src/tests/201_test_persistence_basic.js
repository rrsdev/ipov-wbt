define(["net_ipov/pubsub", "net_ipov/cfg", "net_ipov/wbt/status", "net_ipov/wbt/lms/factory"], function (_pubsub, _cfg, _Status, _LmsConnFactory) {

	QUnit.module("WBT Persistence Tests");

	// Set this up so we don't try to store values in localSession
	var config = $.extend( { 'ds':0 } , _cfg);

	QUnit.test("Create bare Persistence object.", function () {

		QUnit.expect(4);

		_LmsConnFactory( config, function (success, persistence) {

			QUnit.ok( null != persistence, "The Persistence object should be non-null.");
			QUnit.ok( null != persistence.DS, "The Persistence object should be non-null.");

			QUnit.equals( persistence.DS.ptype, "_", "The default 'ptype' is '_' .");

			persistence.setLessonLocation("1-2-1");
			QUnit.equals( persistence.getLessonLocation(), "1-2-1", "Should be able to set and retrieve the location.");

		} );
	});

	/*
	QUnit.test("Testing the get/set ObjectiveStatus functions.", function () {
		QUnit.expect(4);

		var persistence = new P(null, { ds: 0 });

		// Set this up
		persistence.DS.ts = {
			'1-1': _Status.BROWSED,
			'1-3': _Status.PASSED
		};
		persistence.DS.obj = {
			'1-1': 0,
			'1-3': 80
		};

		persistence.initialize();

		var data1 = persistence.getObjectiveData('1-3');
		QUnit.equals( data1.status, _Status.PASSED, "The topic '1-3' should have a status of 'passed'.");
		QUnit.equals( data1.score, 80, "The topic '1-3' should have a score of 80.");

		persistence.setObjectiveData('1-3', { status: 3, score: 50 });
		var data2 = persistence.getObjectiveData('1-3');
		QUnit.equals( data2.status, _Status.FAILED, "The topic '1-3' should now have a status of 'failed'.");
		QUnit.equals( data2.score, 50, "The topic '1-3' should now have a score of 50.");


	});
	*/
});