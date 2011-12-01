define(["net_ipov/pubsub", "net_ipov/wbt/status", "net_ipov/wbt/lms/scorm_1p2"], function (pubsub, Status, Scorm12) {

	QUnit.module("WBT Persistence Tests");

	QUnit.test("Create bare Persistence object.", function () {

		QUnit.expect(3);

		var persistence = new Scorm12(null, {ds: 0});
		QUnit.ok( null != persistence, "The Persistence object should be non-null.");

		QUnit.equals( persistence.initialize() , false, "The Scorm Peristor should return false from initialize().");

		QUnit.equals( persistence.DS.ptype, "SCORM1.2", "Testing the type.");

		persistence.terminate();

	});

	/*
	QUnit.test("Testing the get/set ObjectiveStatus functions.", function () {
		QUnit.expect(4);

		var persistence = new P();

		// Set this up
		persistence.DS.ts = {
			'1-1': Status.BROWSED,
			'1-3': Status.PASSED
		};
		persistence.DS.obj = {
			'1-1': 0,
			'1-3': 80
		};

		persistence.initialize();

		var data1 = persistence.getObjectiveStatus('1-3');
		QUnit.equals( data1.status, Status.PASSED, "The topic '1-3' should have a status of 'passed'.");
		QUnit.equals( data1.score, 80, "The topic '1-3' should have a score of 80.");

		persistence.setObjectiveStatus('1-3', { status: 3, score: 50 });
		var data2 = persistence.getObjectiveStatus('1-3');
		QUnit.equals( data2.status, Status.FAILED, "The topic '1-3' should now have a status of 'failed'.");
		QUnit.equals( data2.score, 50, "The topic '1-3' should now have a score of 50.");


	});
	*/
});