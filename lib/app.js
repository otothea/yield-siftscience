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
// @param function _global_callback : optional (ex: function(_err, _response) { ... })
//
// @return yield-siftscience object
//
module.exports = function(_api_key, _version, _custom_events, _global_callback) {
  // Set default version if none provided
  var version = typeof(_version) === 'string' ? _version : 'v203';

  // Concat sift url with version
  var sift_url = 'https://api.siftscience.com/' + version;

  // Initalize the return object
  var obj = { event: {} };

  // Private : Request function for events
  //
  // @param object   _data     : required
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  var event_request = function(_data, _callback) {
    var data = _.extend(_data, { '$api_key': _api_key });
    var opts = {
      method: 'POST',
      url: sift_url + "/events",
      body: JSON.stringify(data),
      json: true
    };
    if (typeof(_callback) === 'function') {
      var callback = _callback;
    }
    else if (typeof(_global_callback) === 'function') {
      var callback = _global_callback;
    }
    else {
      var deferred = Q.defer();
      var callback = function(_err, _response) {
        if (_err) return deferred.reject(_err);
        else if (_response && _response.body && _response.body.status && _response.body.status != 0) return deferred.reject(_response.body);
        else return deferred.resolve(_response.body);
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

  // Public : Create Order Event
  //
  // @param object   _data { '$session_id', '$user_id', '$user_email', '$order_id', '$amount', '$currency_code', '$payment_methods', '$billing_address', '$shipping_address', '$items' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.create_order = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$create_order' });
    return event_request(data, _callback);
  };

  // Public : Transaction Event
  //
  // @param object   _data { '$session_id', '$user_id', '$user_email', '$transaction_type', '$transaction_status', '$amount', '$currency_code', '$transaction_id', 'reason', '$payment_method', '$billing_address' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.transaction = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$transaction' });
    return event_request(data, _callback);
  };

  // Public : Create Account Event
  //
  // @param object   _data { '$session_id', '$user_id', '$user_email', 'email_verified' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.create_account = function(_data, _callback) {
    var data =_.extend(_data, { '$type': '$create_account' });
    return event_request(data, _callback);
  };

  // Public : Update Account Event
  //
  // @param object   _data { '$session_id', '$user_id', '$changed_password', 'email_verified', '$payment_methods', '$billing_address' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.update_account = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$update_account' });
    return event_request(data, _callback);
  };

  // Public : Add Item to Cart Event
  //
  // @param object   _data { '$user_id', '$session_id' '$item' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.add_item_to_cart = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$add_item_to_cart' });
    return event_request(data, _callback);
  };

  // Public : Remove Item from Cart Event
  //
  // @param object   _data { '$user_id', '$session_id' '$item' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.remove_item_from_cart = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$remove_item_from_cart' });
    return event_request(data, _callback);
  };

  // Public : Submit Review Event
  //
  // @param object   _data { '$user_id', '$content', '$review_title', '$item_id', '$reviewed_user_id', '$submission_status', 'rating' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.submit_review = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$submit_review' });
    return event_request(data, _callback);
  };

  // Public : Send Message Event
  //
  // @param object   _data { '$user_id', '$recipient_user_id', '$subject', '$content' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.send_message = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$send_message' });
    return event_request(data, _callback);
  };

  // Public : Login Event
  //
  // @param object   _data { '$session_id', '$user_id', '$login_status' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.login = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$login' });
    return event_request(data, _callback);
  };

  // Public : Logout Event
  //
  // @param object   _data { '$session_id', '$user_id' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.logout = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$logout' });
    return event_request(data, _callback)
  };

  // Public : Link Session to User Event
  //
  // @param object   _data { '$user_id', '$session_id' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.link_session_to_user = function(_data, _callback) {
    var data = _.extend(_data, { '$type': '$link_session_to_user' });
    return event_request(data, _callback);
  };

  // Public : Generic Custom Event
  //
  // @param string   _type
  // @param object   _data { '$user_id', '$session_id' }
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.event.custom_event = function(_type, _data, _callback) {
    var data = _.extend(_data, { '$type': _type });
    return event_request(data, _callback);
  };

  //
  // Add Injected Custom Events
  //
  if (typeof(_custom_events) === 'object') {
    for (var i = 0, length = _custom_events.length; i < length; i++) {
      // Get the custom type
      var type = _custom_events[i];
      // If the type is a string
      // and it isn't already a defined event
      if (typeof(type) === 'string' && typeof(obj.event[type]) === 'undefined') {
        obj.event[type] = function(_data, _callback) {
          var data = _.extend(_data, { '$type': type });
          return event_request(data, _callback);
        };
      }
    }
  }

  //
  // Labels
  //

  // Public : Create Label for User
  //
  // @param string _user_id
  // @param object _data { '$is_bad', '$reasons', '$description' }
  //
  // @return promise
  //
  obj.label = function(_user_id, _data, _callback) {
    var data = _.extend(_data, { '$api_key': _api_key });
    var opts = {
      method: 'POST',
      url: sift_url + "/users/" + _user_id + "/labels",
      body: JSON.stringify(data),
      json: true
    };
    if (typeof(_callback) === 'function') {
      var callback = _callback;
    }
    else if (typeof(_global_callback) === 'function') {
      var callback = _global_callback;
    }
    else {
      var deferred = Q.defer();
      var callback = function(_err, _response) {
        if (_err) return deferred.reject(_err);
        else if (_response && _response.body && _response.body.status && _response.body.status != 0) return deferred.reject(_response.body);
        else return deferred.resolve(_response.body);
      };
      request(opts, callback);
      return deferred.promise;
    }
    request(opts, callback);
    return;
  };

  //
  // Scores
  //

  // Public : Get User Score
  //
  // @param string   _user_id
  // @param function _callback : optional (can be used to override promise and make strictly async)
  //
  // @return promise
  //
  obj.score = function(_user_id, _callback) {
    var opts = {
      method: 'GET',
      url: sift_url + "/score/" + _user_id + "/?api_key=" + _api_key,
      json: true
    };
    if (typeof(_callback) === 'function') {
      var callback = _callback;
    }
    else if (typeof(_global_callback) === 'function') {
      var callback = _global_callback;
    }
    else {
      var deferred = Q.defer();
      var callback = function(_err, _response) {
        if (_err) return deferred.reject(_err);
        else if (_response && _response.body && _response.body.status && _response.body.status != 0) return deferred.reject(_response.body);
        else return deferred.resolve(_response.body);
      };
      request(opts, callback);
      return deferred.promise;
    }
    request(opts, callback);
    return;
  };

  // Return the object
  return obj;
};
