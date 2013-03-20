Obzervatory aka oz
===========

A namespaced publisher / subscriber library with variable watching.

- Extensive test coverage
- Passes jsLint
- Works on client and server (i.e. NodeJS)
- No jQuery
- No DOM
- No 3rd party libraries

Usage
-----

Below is a taste of some usage examples. More are to come.

When you're done with the examples below, you can look deeper into Obzervatory by
checking out the tests.js file in the root of the project. It covers all of what 
Obzervatory can do. We'll cover more of that here over time.

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