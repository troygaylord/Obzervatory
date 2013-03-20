/*
 *
 *	Obzervatory Tests
 *
 */

(function() {
	'use strict';

	var globalWatchCallCount = 1;

	module("Obzervatory Tests");

	function ozEventInfoToString(e) {
		var infoBlock = ' | type = "' + e.type + '"' +
			' | subject = "' + e.subject + '"' +
			' | topic = "' + e.topic + '"';
		if (e.hasOwnProperty('value')) {
			infoBlock += ' | value = "' + e.value + '"';
		}
		return infoBlock;
	}

	test('Basics', function() {
		expect(8);
		var listenCnt = 1;
		
		// var artists = oz.namespace('artists');
		var people = oz('people');
		//
		// 'artist' variable handling.
		//
		oz('people')('artists').set('artist', 'Tom Jones');

		ok(people('artists').get('artist') === 'Tom Jones', people('artists').get('artist') + ' is the artist.');

		// First on set and touch below
		people('artists').onChange('artist', function(varDetails) {
			ok(varDetails.value === 'Tom Waits', 'Tom Waits is now the artist');
		});
		people('artists').set('artist', 'Tom Waits');
		people('artists').touch('artist');

		//
		// 'artist' event handling.
		//
		people('artists').onEvent('artist', function(e, action1, action2) {
			var actions = '';
			switch (listenCnt) {
			case 1:
				ok(action1 === undefined && action2 === undefined, 'Shout out with no params.');
				break;
			case 2:
				ok(action1 === 'singing' && action2 ==='drumming',
					this.get('artist') + ' is singing and drumming');
				break;
			}
			listenCnt++;
			ok(true, 'Heard the artist ' + actions);
		});

		people('artists').fireEvent('artist');
		people('artists').fireEvent('artist', ['singing', 'drumming']);

		people.destroy();
		try {
			people('artists').fireEvent('artist');
		} catch (e) {
			ok(e.message === "Cannot call method 'fireEvent' of undefined", 
				'"Artists" namespace is undefined.');
		}

	});


	test('Basics on root of subject', function() {
		expect(3);
		var model1 = oz('models').defaultSubject('model-1');

		ok(oz.getNamespaceNames().length === 1, 
			"There are '" + oz.getNamespaceNames().length + "' namespace(s). " + oz.getNamespaceNames());
		//
		// 'artist' variable handling.
		//
		model1().set('color', 'Red');
		ok(model1().get('color') === 'Red', 'Color is "' + model1().get('color') + '".');
		ok(oz('models')('model-1').get('color') === 'Red', 
			'Color is "' + oz('models')('model-1').get('color') + '".');
		oz('models').destroy();
	});


	test('Basic event handling in default subject.', function() {
		expect(6);

		var models = oz('models');

		oz('models')('client').set('firstname', 'John');
		models('client').set('lastname', 'Doe');

		models('person').set({
			firstname: 'Leroy',
			lastname: 'Jenkins'
		});

		// Catch all changes to lastname on all models.
		models('*').onChange('firstname', function(e) {
			ok(true, 'Caught global change of "' +
				e.topic + '" in "' +
				e.subject + '" with new value of "' + e.value + '".');
		});

		models('person').onChange('firstname', function(e) {
			ok(true, 'Caught local change of "' +
				e.topic +'" in "' +
				e.subject + '" with new value of "' + e.value + '".');
		});

		models('person').set('firstname', 'Roy');
		models('client').set({ firstname: 'Jane' });
		models('*').set('firstname', 'Bob');
		models.destroy();
	});


	test('Variable handling', function() {
		expect(12);

		var models = oz.namespace('models');

		models('client').set('firstname', 'John');
		models('client').set('lastname', 'Doe');

		models('person').set({
			firstname: 'Leroy',
			lastname: 'Jenkins'
		});

		// Catch changes to firstname on person model.
		models('person').onChange('firstname', function(e) {
			ok(true, 'Caught local change of "' +
				e.topic +'" in "' +
				e.subject + '" with new value of "' + e.value + '".');
		});
		// Catch all changes to person model.
		models('person').onChange(function(e) {
			ok(true, 'Caught global topic change of "' +
				e.topic +'" in "' +
				e.subject + '" with new value of "' + e.value + '".');
		});

		// Catch all changes to lastname on all models.
		models('*').onChange('firstname', function(e) {
			ok(true, 'Caught global change of "' +
				e.topic + '" in "' +
				e.subject + '" with new value of "' + e.value + '".');
		});

		// Catch changes to app subjects and all topics.
		models('*').onChange(function(e) {
			ok(true, 'Caught *.* change of "' +
				e.topic + '" in "' +
				e.subject + '" with new value of "' + e.value + '".');
		});

		models('person').set('firstname', 'Roy');
		models('client').set({ firstname: 'Jane' });
		models('*').set('firstname', 'Bob');
		models.destroy();
	});

	test('Unchained work with a "model".', function() {
		expect(16);

		var models = oz.createNamespace('models');

		models('training').set({
			course: 'JavaScript for Dummies',
			provider: 'The Learning Center',
			cost: '2000',
			days: '2',
			completed: false
		});

		models.observe(function(e) {
			ok(true, 'Observed: ' + ozEventInfoToString(e));
		})

		models('training').onEvent('save', function(e) {
			ok(true, 'Saved!: ' + ozEventInfoToString(e));
		});

		models('training').onEvent(function(e) {
			ok(true, 'Listened to event in global catch: ' + ozEventInfoToString(e));
		});

		models('training').onChange(function(e) {
			ok(true, 'Training model has changed: ' + ozEventInfoToString(e));
			models('training').fireEvent('save');
		});
		models('training').set('completed', true);

		models('training').set({
			course: 'JavaScript for Dummies',
			provider: 'The Learning Center',
			cost: '3000',
			days: '2',
			completed: true
		});

		models('training').fireEvent('save');
		models.destroy();
	});

	test('Chained work with models.', function() {
		expect(5);

		var models = oz.createNamespace('models');

		models('training').set(
			{
				course: 'JavaScript for Dummies',
				provider: 'The Learning Center',
				cost: '2000',
				days: '2',
				completed: false
			})
			.onEvent('save', function(e) {
				ok(true, 'Saved!');
			})
			.onChange(function(e) {
				ok(true, 'Training model has changed: ' + ozEventInfoToString(e));
				models('training').fireEvent('save');
			})
			.set('completed', true)
			.set({
				course: 'JavaScript for Dummies',
				provider: 'The Learning Center',
				cost: '3000',
				days: '2',
				completed: true
			})
			.fireEvent('save');

		models.destroy();
	});

	test('Handling bad calls and missing values.', function() {
		expect(10);
		var tests = oz.createNamespace('tests'),
			ghostVal = null,
			dummyHandle;

		// Try to get the value of 'firstname' which doesn't exist yet. We expect it to be undefined.
		ghostVal = tests('ghost').get('firstname');
		ok(ghostVal === undefined, '"firstname" is undefined.');
		// Now give firstname a value and check for it
		tests('ghost').set({ firstname: 'Casper' });
		ok(tests('ghost').get('firstname') === 'Casper', '"firstname" is Casper');
		// Blow away the newly created value and ensure we're back to undefined.
		tests('ghost').delVar('firstname');
		ok(tests('ghost').get('firstname') === undefined, '"firstname" is undefined.');

		tests('ghost').set('firstname', 'Maddy');

		// Try passing null as a handle.
		try {
			tests().delWatcher(null);
		} catch (errMsg) {
			if (errMsg === 'Invalid handle') {
				ok(true, 'delWatcher(null) failed with error: "' + errMsg + '"');
			} else {
				ok(false, 'delWatcher(null) failed with error: "' + errMsg + '"');
			}
		}
		// Pass in a dummy handle. It was the right properties but wrong content.
		dummyHandle = {
            subject: null,
            type: null,
            topic: null
        };
		try {
			tests().delListener(dummyHandle);
		} catch (errMsg) {
			if (errMsg.indexOf('Cannot find subject') === 0) {
				ok(true, 'delWatcher(null) failed with error: "' + errMsg + '"');
			} else {
				ok(false, 'delWatcher(null) failed with error: "' + errMsg + '"');
			}
		}
		// Calling with a valid 'subject' but invalid 'type' and 'topic'.
		dummyHandle = {
            subject: 'ghost',
            type: 'dummy-type',
            topic: 'dummy-topic'
        };
		try {
			tests().delWatcher(dummyHandle);
		} catch (errMsg) {
			var msg = errMsg.hasOwnProperty('message') ? errMsg.message : errMsg;

			if (msg.indexOf('Cannot find type') === 0) {
				ok(true, 'delWatcher(null) failed with error: "' + msg + '"');
			} else {
				ok(false, 'delWatcher(null) failed with error: "' + msg + '"');
			}

		}

		// Calling with a valid 'subject' and 'type' but invalid 'topic'.
		dummyHandle = {
            subject: 'ghost',
            type: 'var',
            topic: 'dummy-topic'
        };
		try {
			tests().delWatcher(dummyHandle);
		} catch (errMsg) {
			var msg = errMsg.hasOwnProperty('message') ? errMsg.message : errMsg;

			if (msg.indexOf('Cannot find topic') === 0) {
				ok(true, 'delWatcher(null) failed with error: "' + msg + '"');
			} else {
				ok(false, 'delWatcher(null) failed with error: "' + msg + '"');
			}
		}

		// Calling with a valid 'subject', 'type' and 'topic'.
		dummyHandle = {
            subject: 'ghost',
            type: 'var',
            topic: 'firstname'
        };
		try {
			// Retrieve the result with the 'result' propery of the callback. The root
			// of the return call is the Obzervatory object for chaining calls.
			if (tests().delWatcher(dummyHandle).result === true) {
				ok(false, "Deleted ghost / firstname but it doesn't exist.");
			} else {
				ok(true, 'Could not find "ghost" to delete (1).');
			}
			if (tests().delWatcher(dummyHandle).result === false) {
				ok(true, 'Could not find "ghost" to delete (2).');
			}

			if (tests().delWatcher(dummyHandle).delWatcher(dummyHandle).result === false) {
				ok(true, 'Could not find "ghost" to delete (3).');
			}
		} catch (errMsg) {
			var msg = errMsg.hasOwnProperty('message') ? errMsg.message : errMsg;

			if (msg.indexOf('Cannot find subject') === 0) {
				ok(true, 'delWatcher(null) failed with error: "' + msg + '"');
			} else {
				ok(false, 'delWatcher(null) failed with error: "' + msg + '"');
			}
		}

		// TODO: Ensure resets are working as expected.
		tests.destroy();
	});


	test('Playing with subject', function() {
		expect(3);
		var people = oz('people');

		people('John').set('lastname', 'Smith');
		ok(people('John').get('lastname') === 'Smith', "John Smith");
		people('Sarah').set('lastname', 'Colebrook');
		ok(people('Sarah').get('lastname') === 'Colebrook', "Sarah Colebrook");

		var john = people.defaultSubject('John');
		john().set('lastname', 'Massa');
		ok(people('John').get('lastname') === 'Massa', "John Massa");

		people.destroy();
	});


	test('Basic event handling', function() {
		expect(6);

		var element = oz('elements').defaultSubject('element1');

		element().onEvent('selected', function() {
			ok(true, 'Heard shout "selected" on first listener');
		});
		element().fireEvent('selected');

		element().onEvent('selected', function() {
			ok(true, 'Heard shout "selected on second listener"');
		});
		element().fireEvent('selected');

		element().onEvent('color', function(e, foreground, background) {
			ok(true, 'Heard shout "color"');
			equal(foreground, 'blue', '"Foreground" arrived safely in listener with value of "blue"');
			equal(background, 'red', '"Background" arrived safely in listener as "red"');
		});
		element().fireEvent('color', ['blue', 'red']);
		element.destroy();
	});


	test('Basic variables handling in default namespace.', function() {
		expect(9);

		var element = oz('elements').defaultSubject('element');

		element().onChange('color', function() {
			ok(true, '"color" variabled has changed.');
		});

		element().set('color', 'blue');
		equal(element().get('color'), 'blue', '"color" variable exists with value of "blue".');

		element().onChange('color', function() {
			ok(true, '"color" variable has changed in second watcher.');
		});

		element().set('color', 'yellow');
		equal(element().get('color'), 'yellow', '"color" variable has been changed to "yellow".');

		element().touch('color');
		equal(element().get('color'), 'yellow', '"color" variable exists with value of "yellow".');

		element().delVar('color');
		equal(element().get('color'), null, '"color" variable has been deleted and is now null.');
		element.destroy();
	});

	test('Playing with namespaces and params', function() {
		expect(7);

		var food = oz('food');
		// Watch 'globally-watched-key' in all namespaces.
		food('*').onChange('delicious', function(info) {

			switch(globalWatchCallCount) {
			case 1:
				if (info.topic === 'delicious' &&
					info.subject === 'milk' &&
					info.value === false &&
					info.type === 'vars')
				{
					ok(true, 'Milk is not delicous.');
				} else {
					ok(false, 'Wrong info on global watch of "delicious" in first call.');
				}
				break;
			case 2:
				if (info.topic === 'delicious' &&
					info.subject === 'milk' &&
					info.value === true &&
					info.type === 'vars')
				{
					ok(true, 'Milk is delicous in our global subject catch.');
				} else {
					ok(false, 'Wrong info on global watch of "delicious" in second call.');
				}
				break;
			case 3:
				if (info.topic === 'delicious' &&
					info.subject === 'cookies' &&
					info.value === false &&
					info.type === 'vars')
				{
					ok(true, 'Cookies are not delicous in our global subject catch.');
				} else {
					ok(false, 'Wrong info on global watch of "delicious" in third call.');
				}
				break;
			case 4:
				if (info.topic === 'delicious' &&
					info.subject === 'cookies' &&
					info.value === true &&
					info.type === 'vars')
				{
					ok(true, 'Actually, cookies are delicous in our global subject catch.');
				} else {
					ok(false, 'Wrong info on global watch of "delicious" in fourth call.');
				}
				break;
			}
			globalWatchCallCount++;
		});

		var milk = oz('food').defaultSubject('milk'),
			cookies = oz('food').defaultSubject('cookies');

		milk().set('delicious', false);

		notEqual(oz.getNamespace('food'), undefined, '"food" namespace is defined.');

		milk().set('delicious', false);
		milk().onChange('delicious', function() {
			// TODO: Check the values.
			ok(true, 'Milk is delicious in our milk subject.');
		});
		milk().set('delicious', true);

		// Play in ns2
		cookies().set('delicious', false);
		cookies().onChange('delicious', function() {
			// TODO: Check the values.
			ok(true, 'Cookies are delicious in our cookies subject.');
		});
		cookies().set('delicious', true);

		food.destroy();
	});


	test('Namespace access', function() {
		expect(4);
		var city = oz('city', true);
		
		city().onChange('population', function() {
			ok(true, '"population has changed"');
		});

		city().set('population', 10000);
		ok(city().get('population') === 10000, 'population === 10000');
		oz('city')('city').set('population', 11000);
		ok(city().get('population') === 11000, 'population === 11000');
		city.destroy();
	});

	test("Multiple listeners on single topic and namespace.", function() {
		expect(3);

		var ns = oz('ns');
		ns('subject1').onEvent('topic10', function() {
			ok(true, 'subject1.topic10 has been heard on listener #1.');
		});

		ns('subject1').onEvent('topic10', function() {
			ok(true, 'subject1.topic10 has been heard on listener #2.');
		});

		ns('subject1').onEvent('topic10', function() {
			ok(true, 'subject1.topic10 has been heard on listener #3.');
		});

		ns('subject1').onEvent('topic101', function() {
			ok(true, 'Wrong topic');
		});

		ns('subject101').onEvent('topic10', function() {
			ok(true, 'Wrong namespace');
		});

		ns('subject1').fireEvent('topic10');

		ns.destroy();
	});

	// test("Handle the unsubscribing, reseting and destroying namespaces, subjects and topics", function() {
	// 	expect(6);

	// 	// TODO: Handle the unsubscribing, reseting and destroying namespaces, subjects and topics

	// 	var topic10Namespace1Listener = bb('topic10').in('namespace1').listen(function() {
	// 		ok(true, 'topic10.namespace1');
	// 	});

	// 	var topic10Namespace2Listener = bb('topic10').in('namespace2').listen(function() {
	// 		ok(true, 'topic10.namespace2');
	// 	});

	// 	var topic10Listener = bb('topic10').listen(function() {
	// 		ok(true, 'topic10 in default namespace');
	// 	});

	// 	// 3 asserts
	// 	bb('topic10').in('*').shout();

	// 	// 2 asserts
	// 	bb.delListener(topic10Namespace1Listener);
	// 	bb('topic10').in('*').shout();

	// 	// 1 asserts
	// 	bb.delListener(topic10Namespace2Listener);
	// 	bb('topic10').in('*').shout();

	// 	bb.delListener(topic10Listener);
	// 	// 0 asserts
	// 	bb('topic10').in('*').shout();
	// });
})();