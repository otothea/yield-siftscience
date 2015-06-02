

/**********************/
/*    DEPENDENCIES    */
/**********************/


var request  = require('request'),
    Q        = require('q'),
    _        = require('underscore');


/***************************/
/*    YIELD SIFTSCIENCE    */
/***************************/


// Export
//
// @param string   _api_key         : required (get your keys: https://siftscience.com/console/api-keys)
// @param string   _version         : optional (default: 'v203')
// @param string[] _custom_events   : optional (ex: ['submit_comment', 'delete_account', ...])
// @param function _global_callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
//
// @return yield-siftscience object
//
module.exports = function(_api_key, _version, _custom_events, _global_callback) {


  /***************/
  /*    SETUP    */
  /***************/


  // Set default version if none provided
  var version = typeof(_version) === 'string' ? _version : 'v203';

  // Concat Sift Science API url with version
  var sift_url = 'https://api.siftscience.com/' + version;

  // Initalize the return object
  var siftscience_object = { event: {} };

  // Private : Request function for all requests to sift science
  //
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  var siftscience_request = function(_opts, _callback) {
    // Check for scope callback
    if (typeof(_callback) === 'function') {
      var callback = _callback;
    }
    // Check for global callback
    else if (typeof(_global_callback) === 'function') {
      var callback = _global_callback;
    }
    // Use the default promise callback
    else {
      var deferred = Q.defer();
      var callback = function(_err, _response) {
        // Request Failed
        if (_err)
          return deferred.reject(_err);
        // Request Success
        else if (_response && _response.body && typeof(_response.body.status) === 'number')
          return deferred.resolve(_response.body);
        // Not sure
        else
          return deferred.reject({ message: 'An unexpected error has occured.', siftscience_response: _response });
      };
      request(_opts, callback);
      return deferred.promise;
    }
    request(_opts, callback);
    return;
  };


  /****************************/
  /*    SIFTSCIENCE EVENTS    */
  /****************************/


  // Private : Request function for all events
  //
  // @param object   _data
  // @param function _callback
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
    return siftscience_request(opts, _callback);
  };

  // Private : Define array of natively supported siftscience events
  var siftscience_events = [ 'create_order', 'transaction', 'create_account', 'update_account', 'add_item_to_cart', 'remove_item_from_cart', 'submit_review', 'send_message', 'login', 'logout', 'link_session_to_user' ];

  // Private : Used to generate siftscience event functions in the following loop
  //
  // @param string _type
  //
  // @return function
  //
  var create_siftscience_event_function = function(_type) {
    // Public : Natively supported siftscience event requests
    //
    // @param object   _data     : refer to sift science docs https://siftscience.com/docs
    // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
    //
    // @return promise || void
    //
    return function(_data, _callback) {
      var data = _.extend(_data, { '$type': '$' + _type });
      return siftscience_event_request(data, _callback);
    };
  };

  // Create the siftscience event functions
  for (var i = 0, length = siftscience_events.length; i < length; i++) {
    var type = siftscience_events[i];
    siftscience_object.event[type] = create_siftscience_event_function(type);
  }


  /***********************/
  /*    CUSTOM EVENTS    */
  /***********************/


  // Public : Generic Custom Event
  //
  // @param string   _type
  // @param object   _data { '$user_id', '$session_id' }
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  siftscience_object.event.custom_event = function(_type, _data, _callback) {
    var data = _.extend(_data, { '$type': _type });
    return siftscience_event_request(data, _callback);
  };

  if (typeof(_custom_events) !== 'undefined' && _custom_events !== null && typeof(_custom_events) === 'object') {
    // Private : Used to generate custom event functions in the following loop
    //
    // @param string _type
    //
    // @return function
    //
    var create_custom_function = function(_type) {
      // Public : Injected custom event requests
      //
      // @param object   _data     : refer to sift science docs https://siftscience.com/docs
      // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
      //
      // @return promise || void
      //
      return function(_data, _callback) {
        var data = _.extend(_data, { '$type': _type });
        return siftscience_event_request(data, _callback);
      };
    };

    // Create the custom event functions
    for (var i = 0, length = _custom_events.length; i < length; i++) {
      // Get the custom type
      var type = _custom_events[i];
      // If the type is a string and it isn't already a defined event
      if (typeof(type) === 'string' && typeof(siftscience_object.event[type]) === 'undefined') {
        siftscience_object.event[type] = create_custom_function(type);
      }
    }

  }


  /****************/
  /*    LABELS    */
  /****************/


  // Public : Create Label for User
  //
  // @param string   _user_id
  // @param object   _data { '$is_bad', '$reasons', '$description' }
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  siftscience_object.label = function(_user_id, _data, _callback) {
    var data = _.extend(_data, { '$api_key': _api_key });
    var opts = {
      method: 'POST',
      url: sift_url + "/users/" + _user_id + "/labels",
      body: JSON.stringify(data),
      json: true
    };
    return siftscience_request(opts, _callback);
  };

  // Public : Delete Label for User
  //
  // @param string   _user_id
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  siftscience_object.remove_label = function(_user_id, _callback) {
    var opts = {
      method: 'DELETE',
      url: sift_url + "/users/" + _user_id + "/labels?api_key=" + _api_key,
      json: true
    };
    return siftscience_request(opts, _callback);
  };

  /****************/
  /*    SCORES    */
  /****************/


  // Public : Get User Score
  //
  // @param string   _user_id
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  siftscience_object.score = function(_user_id, _callback) {
    var opts = {
      method: 'GET',
      url: sift_url + "/score/" + _user_id + "/?api_key=" + _api_key,
      json: true
    };
    return siftscience_request(opts, _callback);
  };


  /****************/
  /*    RETURN    */
  /****************/


  // Return the object
  return siftscience_object;
};
