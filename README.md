Obzervatory aka oz
==================

A namespaced publisher / subscriber library with variable watching.

- Extensive test coverage
- Passes jsLint
- Works on client and server (i.e. NodeJS)
- No jQuery
- No DOM
- No 3rd party libraries

Going Local
-----------

To run all of the tests on Obzervatory, just download each of the files in the
root folder of the project into a single folder on your local drive and view 
tests.html in your browser.
Lovely green boxes.

Usage
-----

Below is a taste of what can be done with Obzervatory.

When you're done with the few examples below, you can look 
deeper into Obzervatory by checking out the tests.js file in the root of the project. 
It covers all of what Obzervatory is capable of.

Basic Event Handling
--------------------
``` javascript
var city = oz.namespace('city');

city().onChange('population', function(e) { 
 	// Logs "The population in the city is 10000" on the first call
	// and  "The population in the city is 11000" on the second
	console.log('The ' + e.topic + ' in the ' + e.subject + ' is ' + e.value);
});

city().set('population', 10000);
var population = city().get('population');
city().set('population', 11000);

city.destroy();
```

Making and playing with a live model
------------------------------------
``` javascript
var models = oz.namespace('models');

models('training').set({
	course: 'Rocket Science for Dummies',
	provider: 'The Learning Place',
	cost: '2000',
	days: '2',
	completed: false
});

models('training').onEvent('save', function(e) {
	// Save the model
});

// Fires twice, once for the setting of 'complete' to true
// and once when cost changing from 2000 to 3000.
models('training').onChange(function(e) {
	models('training').fireEvent('save');
});

models('training').set('completed', true);
models('training').set({
	course: 'Rocket Science for Dummies',
	provider: 'The Learning Place',
	cost: '3000',
	days: '2',
	completed: true
});

models.destroy();
```

#### Now the same thing but with chaining

``` javascript
var models = oz('models');

models('training').set(
	{
		course: 'Rocket Science for Dummies',
		provider: 'The Learning Place',
		cost: '2000',
		days: '2',
		completed: false
	})
	.onEvent('save', function(e) {
		// Save the model
	})
	.onChange(function(e) {
		// onChange Fires twice, once for the setting of 'complete' to true
		// and once when cost changing from 2000 to 3000.
		models('training').fireEvent('save');
	})
	.set('completed', true)
	.set({
		course: 'Rocket Science for Dummies',
		provider: 'The Learning Place',
		cost: '3000',
		days: '2',
		completed: true
	});

models.destroy();
```

A tab management example with default events and variables
----------------------------------------------------------

``` javascript
// Dummy 'database' object to mock with.
var db = { 
	save: function(data) { 
		alert('Saved: \n\n' + JSON.stringify(data));
	}
};

// Create our 'tab' namespace and set some default values for all
// new subjects that are created in this namespace.
var tabs = oz('tabs', {
	selected: false,
	saved: false,
	caption: 'Unnamed Tab',
	content: 'Default content',
	save: function(e) {
		db.save(this.get());
		this.set({ saved: true });
	},
	close: function(e) {
		this.fireEvent('save');
	},
	onChange: {
		selected: function(e) {
		},
		caption: function(e) {
		}
	}
});

tabs('tab1')
	.set({
		caption: 'First Tab'
	})
	.onEvent('save', function(e) {
		// ... custom code ...
		// Call the default 'save' event.
		this.fireSuper(e);
		// ... custom code ...
	})

tabs('tab2')
	.set({
		caption: 'Second Tab'
	})
	// Capture the change of any oz variable in the tab1 subject.
	.onChange('*', function(e) {
		// ... custom code ...
		// Call the default onChange.
		this.fireSuper(e);
		// ... custom code ...
	})

tabs('tab3')
	.set({
		selected: true,
		caption: 'Third Tab'
	})

// We'll save this for later.
var originalTab1Values = tabs('tab1').get();

// Fire the tab2 'close' event which will then fire the tab2 'save' event.
tabs('tab2').fireEvent('close');

tabs('tab3').get(); // === { "selected": true, 
					//		 "caption": "Third Tab", 
					//		 "content": "Default content" }

tabs('tab1').get('caption');  // === 'First Tab'
tabs('tab2').get('caption');  // === 'Second Tab'
tabs('tab3').get('caption');  // === 'Third Tab'
tabs('tab1').get('selected'); // === false
tabs('tab2').get('selected'); // === false
tabs('tab3').get('selected'); // === true

// Unselect the currently selected item and select tab2.
tabs('*').set({ selected: false })
tabs('tab1').set({ selected: true });

tabs('tab1').get('selected'); // === true
tabs('tab2').get('selected'); // === false
tabs('tab3').get('selected'); // === false

// Make the onChange event fire for 'select' on all tabs.
tabs('*').touch('selected');

// Set the content of all tabs.
tabs('*').set({ content: 'The fancy new content.' });

// Set tab1 values back to what they were originally. 
// This will fire events for values that have changed in the structure.
// In this case 'selected' and 'content' have changed so any 
// onChange events or observers would fire.
tabs('tab1').set(originalTab1Values);

tabs.destroy();
<<<<<<< HEAD
```
=======
```
>>>>>>> 299cbeb8b44176428b9c1c6e3a36a69bd2c37692
