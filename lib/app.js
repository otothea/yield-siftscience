//
// Dependencies
//

var request  = require('request'),
    Q        = require('q'),
    _        = require('underscore');

//
// Yield Sift Science
//

// Export
//
// @param string   _api_key         : required (get keys: https://siftscience.com/console/api-keys)
// @param string   _version         : optional (default: 'v203')
// @param string[] _custom_events   : optional (ex: ['submit_comment', ...])
// @param function _global_callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
//
// @return yield-siftscience object
//
module.exports = function(_api_key, _version, _custom_events, _global_callback) {
  // Set default version if none provided
  var version = typeof(_version) === 'string' ? _version : 'v203';

  // Concat Sift Science API url with version
  var sift_url = 'https://api.siftscience.com/' + version;

  // Initalize the return object
  var obj = { event: {} };

  // Private : Request function for all requests to sift science
  //
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  var siftscience_request = function(_callback) {
    if (typeof(_callback) === 'function') {
      var callback = _callback;
    }
    else if (typeof(_global_callback) === 'function') {
      var callback = _global_callback;
    }
    else {
      var deferred = Q.defer();
      var callback = function(_err, _response) {
        if (_err)
          return deferred.reject(_err);
        else if (_response && _response.body && _response.body.status && _response.body.status != 0)
          return deferred.reject(_response.body);
        else if (_response && _response.body && _response.body.status && _response.body.status == 0)
          return deferred.resolve(_response.body);
        else
          return deferred.reject({ message: 'An unexpected error has occured.', response: _response });
      };
      request(opts, callback);
      return deferred.promise;
    }
    request(opts, callback);
    return;
  };

  //
  // Events
  //

  // Private : Request function for all events
  //
  // @param object   _data     : required
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  var siftscience_event_request = function(_data, _callback) {
    var data = _.extend(_data, { '$api_key': _api_key });
    var opts = {
      method: 'POST',
      url: sift_url + "/events",
      body: JSON.stringify(data),
      json: true
    };
    return siftscience_request(_callback);
  };

  // Array of natively supported siftscience events
  var siftscience_events = [ 'create_order', 'transaction', 'create_account', 'update_account', 'add_item_to_cart', 'remove_item_from_cart', 'submit_review', 'send_message', 'login', 'logout' ];

  //
  // Add Sift Science Events
  //
  for (var i = 0, length = siftscience_events.length; i < length; i++) {
    var type = siftscience_events[i];
    // Public : Natively supported siftscience event requests
    //
    // @param object   _data     : refer to sift science docs https://siftscience.com/docs
    // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
    //
    // @return promise || void
    //
    obj.event[type] = function(_data, _callback) {
      var data = _.extend(_data, { '$type': '$' + type });
      return siftscience_event_request(data, _callback);
    };
  }

  //
  // Add Injected Custom Events If Needed
  //
  if (typeof(_custom_events) !== 'undefined' && _custom_events !== null && typeof(_custom_events) === 'object') {
    for (var i = 0, length = _custom_events.length; i < length; i++) {
      // Get the custom type
      var type = _custom_events[i];
      // If the type is a string
      // and it isn't already a defined event
      if (typeof(type) === 'string' && typeof(obj.event[type]) === 'undefined') {
        // Public : Injected custom event requests
        //
        // @param object   _data     : refer to sift science docs https://siftscience.com/docs
        // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
        //
        // @return promise || void
        //
        obj.event[type] = function(_data, _callback) {
          var data = _.extend(_data, { '$type': type });
          return siftscience_event_request(data, _callback);
        };
      }
    }
  }

  // Public : Generic Custom Event
  //
  // @param string   _type
  // @param object   _data { '$user_id', '$session_id' }
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  obj.event.custom_event = function(_type, _data, _callback) {
    var data = _.extend(_data, { '$type': _type });
    return siftscience_event_request(data, _callback);
  };

  //
  // Labels
  //

  // Public : Create Label for User
  //
  // @param string   _user_id
  // @param object   _data { '$is_bad', '$reasons', '$description' }
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  obj.label = function(_user_id, _data, _callback) {
    var data = _.extend(_data, { '$api_key': _api_key });
    var opts = {
      method: 'POST',
      url: sift_url + "/users/" + _user_id + "/labels",
      body: JSON.stringify(data),
      json: true
    };
    return siftscience_request(_callback);
  };

  //
  // Scores
  //

  // Public : Get User Score
  //
  // @param string   _user_id
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  obj.score = function(_user_id, _callback) {
    var opts = {
      method: 'GET',
      url: sift_url + "/score/" + _user_id + "/?api_key=" + _api_key,
      json: true
    };
    return siftscience_request(_callback);
  };

  // Return the object
  return obj;
};
