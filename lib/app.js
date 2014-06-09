var request = require('request'),
    Q       = require('q'),
    _       = require('underscore');

module.exports = function(_apiKey) {
  // Initalize the return object
  var obj = {};

  // Private : Request for events
  var event_request = function(_data) {
    var deferred = Q.defer();
    // Add API key
    var data = _.extend(_data, {
      '$api_key': _apiKey
    });
    var opts = {
      method: 'POST',
      url: "https://api.siftscience.com/v203/events",
      body: JSON.stringify(data),
      json: true
    };
    var callback = function(_err, _response) {
      if (_err) return deferred.reject(_err);
      else if (_response && _response.body && _response.body.error) return deferred.reject(_response.body.error);
      else return deferred.resolve(_response.body);
    };
    request(opts, callback);
    return deferred.promise;
  };

  //
  // Events
  //

  // Initialize object's event property
  obj.event = {};

  // Public : Login Event
  //
  // @object _data { '$session_id', '$user_id', '$login_status' }
  // @return promise
  //
  obj.event.login = function(_data) {
    // Add event type
    var data = _.extend(_data, {
      '$type': '$login'
    });
    // Send request
    return event_request(data);
  };

  // Public : Logout Event
  //
  // @object _data { '$session_id', '$user_id' }
  // @return promise
  //
  obj.event.logout = function(_data) {
    // Add event type
    var data = _.extend(_data, {
      '$type': '$logout'
    });
    // Send request
    return event_request(data)
  };

  // Public : Create Account Event
  //
  // @object _data { '$session_id', '$user_id', '$user_email', 'email_verified' }
  // @return promise
  //
  obj.event.create_account = function(_data) {
    // Add event type
    var data =_.extend(_data, {
      '$type': '$create_account'
    });
    // Send request
    return event_request(data);
  };

  // Public : Update Account Event
  //
  // @object _data { '$session_id', '$user_id', '$changed_password', 'email_verified', '$payment_methods', '$billing_address' }
  // @return promise
  //
  obj.event.update_account = function(_data) {
    // Add event type
    var data = _.extend(_data, {
      '$type': '$update_account'
    });
    // Send the request
    return event_request(data);
  };

  // Public : Create Order Event
  //
  // @object _data { '$session_id', '$user_id', '$user_email', '$order_id', '$amount', '$currency_code', '$payment_methods', '$billing_address', '$shipping_address', '$items' }
  // @return promise
  //
  obj.event.create_order = function(_data) {
    // Add event type
    var data = _.extend(_data, {
      '$type': '$create_order'
    });
    // Send the request
    return event_request(data);
  };

  // Public : Transaction Event
  //
  // @object _data { '$session_id', '$user_id', '$user_email', '$transaction_type', '$transaction_status', '$amount', '$currency_code', '$transaction_id', 'reason', '$payment_method', '$billing_address' }
  // @return promise
  //
  obj.event.transaction = function(_data) {
    // Add event type
    var data = _.extend(_data, {
      '$type': '$transaction'
    });
    // Send the request
    return event_request(data);
  };

  //
  // Labels
  //

  // Public : Create Label for User
  //
  // @string _user_id
  // @object _data { '$is_bad', '$reasons', '$description' }
  // @return promise
  //
  obj.label = function(_user_id, _data) {
    var deferred = Q.defer();
    var data = _.extend(_data, {
      '$api_key': _apiKey
    });
    var opts = {
      method: 'POST',
      url: "https://api.siftscience.com/v203/users/" + _user_id + "/labels",
      body: JSON.stringify(data),
      json: true
    };
    var callback = function(_err, _response) {
      if (_err) return deferred.reject(_err);
      else if (_response && _response.body && _response.body.error) return deferred.reject(_response.body.error);
      else return deferred.resolve(_response.body);
    };
    request(opts, callback);
    return deferred.promise;
  };

  //
  // Scores
  //

  // Public : Get User Score
  //
  // @string _user_id
  // @return promise
  //
  obj.score = function(_user_id) {
    var deferred = Q.defer();
    var opts = {
      method: 'GET',
      url: "https://api.siftscience.com/v203/score/" + _user_id + "/?api_key=" + _apiKey,
      json: true
    };
    var callback = function(_err, _response) {
      if (_err) return deferred.reject(err);
      else if (_response && _response.body && _response.body.error) return deferred.reject(_response.body.error);
      else return deferred.resolve(_response.body);
    };
    request(opts, callback);
    return deferred.promise;
  };

  // Return the object
  return obj;
};
