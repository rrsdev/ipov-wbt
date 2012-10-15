/*
Copyright (C) 2011-2012 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License v2 or higher.

*/
/**
 * For original code see https://github.com/phiggins42/bloody-jquery-plugins/blob/master/pubsub.js
 * Released under either AFL or new BSD, see: http://dojofoundation.org/license for more information.
 *
 * Simple publish/subscribe (pubsub) addon for JQuery.
 *
 * This version has been refactored to work w/ AMD loading style,
 * and instead of registering directly as a set of jquery functions, it returns an object with the publish, subscribe, and unsubscribe functions.
 *
 * Module creates a singleton Object type with the functions:
 *
 * .publish( topic:String, args:Array )
 * .subscribe( topic:String, callback:Function(args:Array) ) : Object
 * .unsubscribe( topic:String, handle:Object )
 *
 */
define(["jquery"], function($) {

	// the topic/subscription hash, this is private
	var cache = {};

	return {
		publish: function(/* String */topic, /* Array? */args){
			// summary:
			// Publish some data on a named topic.
			// topic: String
			// The channel to publish on
			// args: Array?
			// The data to publish. Each array item is converted into an ordered
			// arguments on the subscribed functions.
			//
			// example:
			// Publish stuff on '/some/topic'. Anything subscribed will be called
			// with a function signature like: function(a,b,c){ ... }
			//
			// | $.publish("/some/topic", ["a","b","c"]);
			cache[topic] && $.each(cache[topic], function(){
				this.apply($, args || []);		// 'this' should be the callback function.
			});
		},

		subscribe: function(/* String */topic, /* Function */callback){
			// summary:
			// Register a callback on a named topic.
			// topic: String
			// The channel to subscribe to
			// callback: Function
			// The handler event. Anytime something is $.publish'ed on a
			// subscribed channel, the callback will be called with the
			// published array as ordered arguments.
			//
			// returns: Array
			// A handle which can be used to unsubscribe this particular subscription.
			//
			// example:
			// | $.subscribe("/some/topic", function(a, b, c){ /* handle data */ });
			//
			if(!cache[topic]){
				cache[topic] = [];
			}
			cache[topic].push(callback);
			return [topic, callback]; // Array
		},

		unsubscribe: function(/* Array */handle){
			// summary:
			// Disconnect a subscribed function for a topic.
			// handle: Array
			// The return value from a $.subscribe call.
			// example:
			// | var handle = $.subscribe("/something", function(){});
			// | $.unsubscribe(handle);

			var t = handle[0];
			cache[t] && $.each(cache[t], function(idx){
				if (this == handle[1]) {
					cache[t].splice(idx, 1);
				}
			});
		}
	};
});
