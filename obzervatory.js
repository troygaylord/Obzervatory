/*!
 * Obzervatory JavaScript Library v0.8
 *
 * Copyright (c) 2013, Troy Gaylord
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
*/

/*

TODO
-----------------------------------------------------------
-   Ensure unsubscribe and all destruction is working 
    property, looks like it may only be working for 
    listeners.
-   Ensure all comments are up to date. 


Below gives some context to the Obzervatory code
-----------------------------------------------------------
var models = oz.namespace('models');
    models('person').get('firstname');
     /\       /\              /\
     |        |               |
 namespace subject          topic

'watchers' watch variables.
'listeners' listen for events to fire.
'observers' apply to listening and/or watching.

*/

var obzervatory = (function (obzervatory) {
    'use strict';

    // Creates a convenient way to access namespaces.
    // This function turns:
    //      oz.namespace('thenamespace').onChange(...)
    // into:
    ///     oz('thenamespace').onChange(...)
    obzervatory = function (namespace, defaultVals, autoGenerateSubject) {
        return obzervatory.namespace(namespace, defaultVals, autoGenerateSubject);
    };

    // The Obzervatory class. 
    // This is the guts of the variable and event handling.
    obzervatory.Obzervatory = function (namespace) {
        var pub,  // Public methods & properties
            pvt;  // Private methods & properties

        /*------------------------------------------------------------------------------------------
        *
        *   Public Methods
        *
        */
        pub = {
            invalid: false,
            namespace: namespace,
            defaultValues: {},
            reset: function () {
                pub.subjects = {};
                pub.globals = { listeners: {}, watchers: {}, observers: [] };
                pub.defaultSubject = '*';
            },

            // Returns the namespace with '*' set as the default subject.
            getNamespace: function () {
                return this.getSubject();
            },

            // Create a new subject and set it as the default namespace.
            createSubject: function (subject) {
                pvt.buildSubject(subject);
                return this.getSubject(subject);
            },

            // Returns a function that returns pub with the
            // 'defaultSubject' set to the subject provided.
            // Calls made on the returned function will then have the
            // TODO: More testing with this and how the closure is
            //       working with 'subject'.
            getSubject: function (subject) {
                var setNs,
                    defaultSubject = subject,
                    self = this;

                setNs = function (subject) {
                    // self = this;
                    // If we were destroyed, invalid is set to true.
                    if (pub.invalid) {
                        debugger;
                        return undefined;
                    }
                    subject = subject || defaultSubject;

                    // if (subject) {
                    //     pvt.buildSubject(subject);
                    // }

                    // // // If the subject doesn't exist yet and we have default values, 
                    // // // apply the values to the new subject.
                    // if (!pub.subjects.hasOwnProperty(subject)) {
                    //     // pub.getSubject(subject)().set({ defaultkey: 'default value' });
                    //     // this(subject)().set({ defaultkey: 'default value' });
                    //     // TODO: Not a great way to reference the subject. Do it better.
                    //     // obzervatory(subject).set(obzervatory(subject).defaultValues);
                    //     // obzervatory(subject).set(obzervatory(subject).defaultValues);
                    // }

                    // subject = subject || defaultSubject || '*';
                    pub.defaultSubject = subject;
                    return pub;
                };

                // Put the 'observer' directly upon the return var since 'observe'
                // is not interested in subjects.
                setNs.observe = function (callback, context) {
                    var topicInfo = {};
                    topicInfo.callback = callback;
                    topicInfo.context = context;
                    topicInfo.type = 'observers';
                    pub.globals.observers.push(topicInfo);
                };

                setNs.destroy = function () {
                    obzervatory.delNamespace(pub.namespace);
                };

                setNs.defaultSubject = function (subject) {
                    return pub.createSubject(subject);
                };

                setNs.defaultVals = function (values) {
                    if (values === undefined || values === null) {
                        return pub.defaultValues;
                    } else {
                        pub.defaultValues = values || {};
                    }
                }
                // setNs.defaultValues = {};

                // setNs.defaultTopic = subject;
                return setNs;
            },

            // Iterates through all subscribers of a topic and invokes
            // their callback, passing optional arguments.
            // 'fireType' can be 'vars', 'listeners' or 'watchers'
            // 'baggage' will be passed to the callback of the topics found.
            // TODO: Throw if baggage aren't an array.
            fireEvent: function (topic, baggage, fireEventType) {
                var topicInfo = pvt.parseTopic(topic),
                    globalSubs = [],
                    topicDetails = [],
                    topics = [],
                    observers,
                    details,
                    type,
                    i,
                    n;

                // Type will always be 'listener' or 'watcher', never 'vars' for fireEvent.
                type = fireEventType || 'listeners';

                // If there are any 'observers' with the given
                // topic, append their subcriptions to the rest of the topics.
                // if (pub.globals.observers.length > 0) {
                //     topics = topics.concat(pub.globals.observers);
                // }
                // Get all of the topics that match our topic, subject and type.
                topics = topics.concat(
                    pvt.getTopicsInSubject(topicInfo.subject, topicInfo.topic, type)
                );
                // If there are any global 'watchers' or 'listeners' with the given
                // topic, append their subcriptions to the rest of the topics.
                if (pub.globals[type][topicInfo.topic] &&
                        pub.globals[type][topicInfo.topic].length > 0) {
                    topics = topics.concat(pub.globals[type][topicInfo.topic]);
                }
                // If there are global topic listeners, add them to our subscriptions.
                if (pub.globals[type]['*'] &&
                        pub.globals[type]['*'].length > 0) {
                    topics = topics.concat(pub.globals[type]['*']);
                }

                if (type === 'listeners') {
                    if (pub.globals.listeners['*'] &&
                            pub.globals.listeners['*'].length > 0) {
                        topics = topics.concat(pub.globals.listeners['*']);
                    }
                }

                // Loop through the matched topics, if we're dealing
                // with variables (watching), we only want to pass back
                // the topic information as it's given to us in the
                // arguments. This topic is slightly different than what's
                // in our topic structure since we add the subject of the
                // variable to it to give it more context.
                for (i = 0; i < topics.length; i += 1) {
                    if (type === 'watchers') {
                        topicDetails = baggage;
                    } else {
                        topicDetails = [topics[i]].concat(baggage);
                    }
                    if (topics[i].callback === undefined || topics[i].callback === null) {
                        throw "No callback defined for watcher.";
                    }
                    topicDetails[0].self = this;
                    // If we have observers, they fire on everything so fire 
                    // applicable observers first.
                    observers = pub.globals.observers;
                    if (observers.length > 0) {
                        for (n = 0; n < observers.length; n += 1) {
                            observers[n].callback.apply(observers[n].context || this, topicDetails);
                        }
                    }

                    topics[i].callback.apply(topics[i].context || this, topicDetails);
                }
            },

            // Listen for events to fire on a topic(s)
            // 'context' will be the 'this' in the callback.
            onEvent: function (topic, callback, context) {
                // If the topic is a function then that's our callback and there is no topic.
                // In which case, we set the topic to global, *, and pull the other params up one.
                if (typeof topic === 'function') {
                    context = callback;
                    callback = topic;
                    topic = '*';
                }
                var topicInfo = pvt.parseTopic(topic);

                topicInfo.callback = callback;
                topicInfo.context = context;
                topicInfo.type = 'listeners';

                if (topicInfo.subject === '*') {
                    pvt.ensureProperty(pub.globals.listeners, topicInfo.topic, []).push(topicInfo);
                } else {
                    // TODO: Pull these together somehow. Too many trips, too much the same.
                    // pvt.ensureProperty(pub.subjects, topicInfo.subject);
                    pvt.ensureSubject(topicInfo.subject);
                    pvt.ensureProperty(pub.subjects[topicInfo.subject], 'listeners');
                    pvt.ensureProperty(pub.subjects[topicInfo.subject].listeners,
                        topicInfo.topic, []).push(topicInfo);
                }
                return this;
            },

            // Gets the value of a given variable (i.e. topic)
            get: function (topic) {
                // If we were not passed params then we should get the 
                // current subject rather than a variable value.
                if (topic === null || topic === undefined) {
                    return pub.getSubject(pub.defaultSubject);
                }

                // Get and return the variable associated with the provided topic.
                var topicInfo = pvt.parseTopic(topic),
                    value;
                // TODO: A better way?
                if (pub.subjects[topicInfo.subject] &&
                        pub.subjects[topicInfo.subject].vars &&
                            pub.subjects[topicInfo.subject].vars[topicInfo.topic]) {
                    value = pub.subjects[topicInfo.subject].vars[topicInfo.topic].value;
                }
                return value;
            },

            // - Set the value of a given topic.
            // - Will only 'fireEvent' that it has changed if the value has 
            //   changed (comparing with ===)
            // - Accepts an object or a string for topic. If an object is passed it will
            //   process each property of the object with a recursive call. For example:
            //      oz.set({ firstname: 'Sterling', lastname: 'Archer' });
            //   will make two recusive calls to 'set' to deal with each key/value.
            set: function (topic, value, silently) {
                var topics,
                    silent = silently || false,
                    changed = false,
                    key,
                    topicInfo,
                    subject,
                    ozVar,
                    vars,
                    i,
                    j;
                // If topic is an object, loop through each property and recursively
                // call ourselves with the key (topic) and value.
                if (typeof topic === 'object') {
                    // Pluralize for clarity
                    topics = topic;
                    // value becomes 'silently' when topic is object.
                    silently = value;
                    for (key in topics) {
                        if (topics.hasOwnProperty(key)) {
                            this.set(key, topics[key], silently);
                        }
                    }
                } else {
                    // Setup topicInfo which will, if the value has
                    // chanaged, replace the current topic.
                    topicInfo = pvt.parseTopic(topic);
                    topicInfo.value = value;
                    topicInfo.type = 'vars';
                    // Don't just set ourselves, set all variables with our topic
                    // in all subjects to the new value provided by the caller.
                    if (topicInfo.subject === '*') {
                        for (subject in pub.subjects) {
                            if (pub.subjects.hasOwnProperty(subject)) {
                                pub.defaultSubject = subject;
                                this.set(topic, value, silently);
                            }
                        }
                    } else {
                        pvt.ensureSubject(topicInfo.subject);
                        vars = pvt.ensureProperty(pub.subjects[topicInfo.subject], 'vars');
                        // If the topic hasn't been created yet or the topics value
                        // is different than the new value provided, set the value.
                        if (vars[topicInfo.topic] === undefined ||
                                vars[topicInfo.topic].value !== value) {
                            // Replace the topic with the new information.
                            vars[topicInfo.topic] = topicInfo;
                            // Let the watchers know we've changed.
                            if (!silent) {
                                pub.fireEvent(topic, [topicInfo], 'watchers');
                            }
                        }
                    }
                }
                return this;
            },

            // Registers a variable watcher.
            // TODO: DRY this up, onChange and listen are almost identical.
            onChange: function (topic, callback, context) {
                // If the topic is a function then that's our callback and there is no topic.
                // In which case, we set the topic to global, *, and pull the other params up one.
                if (typeof topic === 'function') {
                    context = callback;
                    callback = topic;
                    topic = '*';
                }
                var topicInfo = pvt.parseTopic(topic);

                topicInfo.callback = callback;
                topicInfo.context = context;
                topicInfo.type = 'watchers';

                if (topicInfo.subject === '*') {
                    pvt.ensureProperty(pub.globals.watchers, topicInfo.topic, [])
                        .push(topicInfo);
                } else {
                    pvt.ensureSubject(topicInfo.subject);
                    pvt.ensureProperty(pub.subjects[topicInfo.subject], 'watchers');
                    pvt.ensureProperty(pub.subjects[topicInfo.subject].watchers,
                        topicInfo.topic, []).push(topicInfo);
                }
                return this;
            },

            // Touch a topic variable to fire an 'onChange' event.
            touch: function (topic) {
                var topicInfo = pvt.parseTopic(topic),
                    subject,
                    ozVar,
                    i,
                    j;

                topicInfo.value = this.get(topic);
                topicInfo.type = 'vars';
                // Don't set myself, set all variables with our topic name in all subjects to
                // the new value provided by the caller.
                if (topicInfo.subject === '*') {
                    for (subject in pub.subjects) {
                        if (pub.subjects.hasOwnProperty(subject) && pub.subjects[subject].vars) {
                            ozVar = pub.subjects[subject].vars[topicInfo.topic];
                            if (ozVar) {
                                // TODO: Ensure testing.
                                pub.getSubject(subject)().fireEvent(ozVar.topic, [], 'watchers');
                            }
                        }
                    }
                } else {
                    pub.fireEvent(topic, [topicInfo], 'watchers');
                }
                return topicInfo;
            },

            // Delete a variable
            delVar: function (ozVariable) {
                var ozVar = pvt.parseTopic(ozVariable),
                    ns;

                // For clarity. Should adjust in a better place, in parseTopic would be good.
                ozVar.varName = ozVar.topic;
                // delete all variables in all subjects (*.*)
                if (ozVar.varName === '*' && ozVar.subject === '*') {
                    for (ns in pub.subjects) {
                        if (pub.subjects.hasOwnProperty(ns) && pub.subjects[ns].vars) {
                            delete pub.subjects[ns];
                        }
                    }
                } else if (ozVar.subject === '*' &&
                        (ozVar.varName !== '*' && ozVar.varName !== '')) {
                    // Subject is wild and we have a variable name so delete it in all subjects.
                    for (ns in pub.subjects) {
                        if ((pub.subjects.hasOwnProperty(ns)) &&
                                (pub.subjects[ns].vars[ozVar.varName])) {
                            delete pub.subjects[ns][ozVar.varName];
                        }
                    }
                } else if (ozVar.topic) {
                    delete pub.subjects[ozVar.subject].vars[ozVar.varName];
                }
            },

            delWatcher: function (handle) {
                // delListener() use to be named something else and shared. Will
                // be creating more distinction between watcher's and listener's in the
                // future.
                return this.delListener(handle);
            },

            // Removes the subscriber from the particular topic its handle was assigned to
            delListener: function (handle) {
                var topics,
                    itemDeleted = false,
                    i;

                if (!pvt.isHandle(handle)) {
                    throw 'Invalid handle';
                }
                if (!pub.subjects.hasOwnProperty(handle.subject)) {
                    throw 'Cannot find subject: "' + handle.subject + '"';
                }
                if (!pub.subjects[handle.subject].hasOwnProperty(handle.type + 's')) {
                    // Pluralize the type, since we pass it to the caller as singular for
                    // easier reading.
                    throw 'Cannot find type: "' + handle.type + 's"';
                }
                if (!pub.subjects[handle.subject][handle.type + 's'].hasOwnProperty(handle.topic)) {
                    throw 'Cannot find topic: "' + handle.topic + '"';
                }
                topics = pub.subjects[handle.subject][handle.type + 's'][handle.topic];
                // Cycle through the topics and compare the callbacks to the handle's callback.
                // If we have a match, cut the element out of the topic array.
                for (i = topics.length - 1; i >= 0; i -= 1) {
                    if (topics[i].callback === handle.callback) {
                        // TODO: If this is the last element of the array, remove the whole array
                        // so we don't have empty arrays hanging around.
                        if (topics.length === 1) {
                            delete pub.subjects[handle.subject][handle.type + 's'][handle.topic];
                        } else {
                            topics.splice(i, 1);
                        }
                        itemDeleted = true;
                    }
                }
                // The result is the pub so the caller can chain but they
                // can also get the result of the call from <return>.result.
                return (function () {
                    pub.result = itemDeleted;
                    return pub;
                }());
            },

            delSubject: function (subjectName) {
                var ns;
                for (ns in pub.subjects) {
                    if (pub.subjects.hasOwnProperty(ns) && ns === subjectName) {
                        delete pub.subjects[ns];
                    }
                }
            },

            result: null
        };

        // Initialize ourselves.
        pub.reset();

        /*----------------------------------------------------------------------------------------------
        *
        *   Private Methods
        *
        */
        pvt = {
            isHandle: function (handle) {
                return handle !== undefined &&
                    handle !== null &&
                    typeof handle === 'object' &&
                    handle.hasOwnProperty('subject') &&
                    handle.hasOwnProperty('type') &&
                    handle.hasOwnProperty('topic');
            },

            // A topic can contain just a topic, or a topic and subject
            // (i.e. 'thetopic.thesubject').
            // Return an object with the parsed topic and subject, if subject
            // isn't provided use the default subject.
            parseTopic: function (topic) {
                var topicSplit = topic.split('.');
                return {
                    topic: topicSplit[0],
                    subject: (topicSplit.length > 1 ? topicSplit[1] : pub.defaultSubject)
                };
            },
            // Return all of the subscribers to the subject/topic that match the given
            // type (listener or watcher).
            // If subjectName is '*' then loop through all subjects recursively calling ourselves
            // to get all topics.
            getTopicsInSubject: function (subjectName, topicName, type) {
                var matches = [],
                    subjects = pub.subjects,
                    subject,
                    subjectExists,
                    topic;

                // Look in all subjects if true, otherwise only look in the subject provided.
                if (subjectName === '*') {
                    for (subject in pub.subjects) {
                        if (pub.subjects.hasOwnProperty(subject)) {
                            // Recursive call
                            this.getTopicsInSubject(subject, topicName, type);
                        }
                    }
                } else {
                    // Determine if the subject we were given exists
                    subjectExists = subjects.hasOwnProperty(subjectName) &&
                        subjects[subjectName].hasOwnProperty(type);
                    if (subjectExists) {
                        // Isolate our subject
                        subject = pub.subjects[subjectName][type];
                        // Loop through subjects, in the given 'type', and get our topics
                        for (topic in subject) {
                            if (subject.hasOwnProperty(topic)) {
                                // If not passed a topic then all topics are a match.
                                if (!topicName || topic === '*' || topic === topicName) {
                                    matches = matches.concat(subject[topic]);
                                }
                            }
                        }
                    }
                }
                return matches;
            },

            // If the given attribute doesn't exist on obj, create it.
            buildSubject: function (subject, defaultValue) {
                var subjectExists = !!pub.subjects[subject],
                    retSubject = this.ensureSubject(subject, defaultValue),
                    defaultValues;

                // If the subject didn't already exists, add the defaultValues to it
                // if they're available.
                if (subjectExists === false) {
                    defaultValues = obzervatory.defaultValues;
                    if (typeof defaultValues === 'object') {
                        obzervatory(subject).set(defaultvalues);
                    }
                }
                return retSubject;
            },

            // If the given attribute doesn't exist on obj, create it.
            ensureProperty: function (obj, property, defaultValue) {
                var subjectExisted = true;
                // The subject doesn't exist yet so create it.
                // If there are default values, set them up here.
                if (!obj[property]) {
                    obj[property] = defaultValue || {};
                    subjectExisted = false;
                }
                return obj[property];
            },

            // If the given attribute doesn't exist on obj, create it.
            ensureSubject: function (subject, defaultValue) {
                // If the subject didn't already exist, make sure it gets its 
                // default values.
                var subjectDidntExist = !pub.subjects[subject];
                pvt.ensureProperty(pub.subjects, subject, defaultValue);
                if (subjectDidntExist && Object.keys(pub.defaultValues).length > 0) {
                    pub.set(pub.defaultValues);
                }
            }
        };

        return (namespace !== null && namespace !== undefined) ? pub.getNamespace() : pub;
    };

    // Hold all of the namespaces
    obzervatory.namespaces = [];
    obzervatory.namespace = function (namespace, defaultVals, autoGenerateSubject) {
        var usedDefaults = false,
            retNamespace,
            ns,
            i;

        if (namespace === undefined || namespace === null) {
            throw "'namespace' parameter is required.";
        }
        // If defaultVals is a boolean and not an object, the caller wants to 
        // skip the setting of default values so ignore it and bump up autoGenerateSubject.
        if (typeof namespace === 'string' && typeof defaultVals === 'boolean') {
            autoGenerateSubject = defaultVals;
        } else if (typeof namespace === 'string' && typeof defaultVals === 'object') {
            usedDefaults = true;
        }

        // By default, automatically generate a subject named after the 
        // namespace.
        if (autoGenerateSubject === undefined) {
            autoGenerateSubject = true;
        }

        for (i = 0; i < this.namespaces.length; i += 1) {
            if (this.namespaces[i].name === namespace) {
                retNamespace = this.getNamespace(namespace);
                break;
            }
        }
        if (!retNamespace) {
            if (autoGenerateSubject === true) {
                ns = this.createNamespace(namespace);
                retNamespace = ns.defaultSubject(namespace);
            } else {
                retNamespace = this.createNamespace(namespace);
            }
            if (usedDefaults) {
                // debugger;
                // obzervatory(namespace).defaultVals(defaultVals);
                retNamespace.defaultVals(defaultVals);
            }
        }
        return retNamespace;
    };
    obzervatory.createNamespace = function (namespace) {
        var namespaceInfo = {
            name: namespace,
            oz: new obzervatory.Obzervatory(namespace)
        };
        if (namespace === undefined || namespace === null) {
            throw "'namespace' parameter required";
        }
        this.namespaces.push(namespaceInfo);
        return namespaceInfo.oz;
    };
    obzervatory.getNamespace = function (namespace) {
        var retNamespace,
            i;
        if (namespace === undefined || namespace === null) {
            throw "'namespace' parameter required";
        }

        for (i = 0; i < this.namespaces.length; i += 1) {
            if (this.namespaces[i].name === namespace) {
                retNamespace = this.namespaces[i].oz;
                break;
            }
        }
        return retNamespace;
    };
    obzervatory.getNamespaceNames = function () {
        var namespaceNames = [],
            i;
        for (i = 0; i < this.namespaces.length; i += 1) {
            namespaceNames.push(this.namespaces[i].name);
        }
        return namespaceNames;
    };
    obzervatory.delNamespace = function (namespace) {
        var success = false,
            i;
        if (namespace === undefined || namespace === null) {
            throw "'namespace' parameter required";
        }
        for (i = 0; i < this.namespaces.length; i += 1) {
            if (this.namespaces[i].name === namespace) {
                // Set the invalid flag since we can delete the object
                // from our array, but any other variables pointing to it
                // will remain active. We want to make sure it's no longer
                // funcional.
                this.namespaces[i].oz().invalid = true;
                // Kill it in memory
                delete this.namespaces[i];
                // Kill it in our namespace array.
                this.namespaces.splice(i, 1);
                success = true;
                break;
            }
        }
        return success;
    };

    return obzervatory;
}(obzervatory));

// If 'oz' isn't already taken, use it as a shortcut to obzervatory.
if (typeof oz === 'undefined') {
    oz = obzervatory;
}