

/**********************/
/*    DEPENDENCIES    */
/**********************/


var request = require('request'),
    Q       = require('q'),
    _       = require('underscore');


/***************************/
/*    YIELD SIFTSCIENCE    */
/***************************/


// Export
//
// @param object _global_opts : required
//
//   @option string   api_key         : required (get your keys: https://siftscience.com/console/developer/api-keys)
//   @option string   account_id      : optional (required for fingerprint api, get your account_id: https://siftscience.com/console/account/profile)
//   @option string   partner_id      : optional (required for partner api, get your partner_id: https://siftscience.com/console/account/profile)
//   @option string[] custom_events   : optional (default: [] - ex: ['referral_code_redeemed', 'contacted_customer_support', ...])
//   @option function global_callback : optional (default: null - can be used to override promise and make regular callback on all requests. ex: function(_err, _response) { ... })
//   @option boolean  return_action   : optional (default: false - can be used to get extra params from sift science responses" https://siftscience.com/resources/tutorials/formulas#add-actions)
//   @option object   webhooks        : optional (default: {} - can be used to map callbacks to the webhook middleware)
//
// @return yield-siftscience object
//
module.exports = function(__global_opts) {


  /**************************/
  /*    VALIDATE OPTIONS    */
  /**************************/


  // __global_opts must be an Object
  if (!(__global_opts instanceof Object))
    throw new Error('Options must be an Object. If you have recently updated from <= 0.0.9 to >= 0.1.0, you likely need to change the way you require the package. https://github.com/otothea/yield-siftscience#usage');

  // api_key is required
  if (!__global_opts.api_key)
    throw new Error('Options must include an `api_key` property. https://github.com/otothea/yield-siftscience#usage');

  // account_id must be a String
  if (__global_opts.account_id && typeof(__global_opts.account_id) !== 'string')
    throw new Error('`account_id` property must be a String. https://github.com/otothea/yield-siftscience#usage');

  // partner_id must be a String
  if (__global_opts.partner_id && typeof(__global_opts.partner_id) !== 'string')
    throw new Error('`partner_id` property must be a String. https://github.com/otothea/yield-siftscience#usage');

  // custom_events must be an Array
  if (__global_opts.custom_events && !(__global_opts.custom_events instanceof Array))
    throw new Error('`custom_events` property must be an Array. https://github.com/otothea/yield-siftscience#usage');

  __global_opts.custom_events = __global_opts.custom_events || []; // Set default to empty array if needed

  // global_callback must be a Function
  if (__global_opts.global_callback && typeof(__global_opts.global_callback) !== 'function')
    throw new Error('`global_callback` property must be a Function. https://github.com/otothea/yield-siftscience#usage');

  // return_action must be a Boolean
  if (__global_opts.return_action && typeof(__global_opts.return_action) !== 'boolean')
    throw new Error('`return_action` property must be a Boolean. https://github.com/otothea/yield-siftscience#usage');

  // webhooks must be an Object
  if (__global_opts.webhooks && !(__global_opts.webhooks instanceof Object))
    throw new Error('`webhooks` property must be an Object. https://github.com/otothea/yield-siftscience#usage');

  __global_opts.webhooks = __global_opts.webhooks || {}; // Set default to empty object if needed


  /***************/
  /*    SETUP    */
  /***************/


  // Concat Sift Science API url with version
  var __sift_url  = 'https://api.siftscience.com/v203/';
  var __sift3_url = 'https://api3.siftscience.com/v3/'

  // Set up constant values
  var __constants = {
    SHIPPING_METHOD: {
      ELECTRONIC: '$electronic',
      PHYSICAL:   '$physical'
    },
    TRANSACTION_TYPE: {
      SALE:       '$sale',
      AUTHORIZE:  '$authorize',
      CAPTURE:    '$capture',
      VOID:       '$void',
      REFUND:     '$refund',
      DEPOSIT:    '$deposit',
      WITHDRAWAL: '$withdrawal',
      TRANSFER:   '$transfer'
    },
    STATUS: {
      SUCCESS: '$success',
      FAILURE: '$failure',
      PENDING: '$pending'
    },
    SOCIAL_SIGN_ON_TYPE: {
      FACEBOOK: '$facebook',
      GOOGLE:   '$google',
      YAHOO:    '$yahoo',
      TWITTER:  '$twitter',
      OTHER:    '$other'
    },
    PAYMENT_TYPE: {
      CREDIT_CARD:              '$credit_card',
      ELECTRONIC_FUND_TRANSFER: '$electronic_fund_transfer',
      CRYPTO_CURRENCY:          '$crypto_currency',
      CASH:                     '$cash',
      STORE_CREDIT:             '$store_credit',
      GIFT_CARD:                '$gift_card',
      POINTS:                   '$points',
      FINANCING:                '$financing',
      CHECK:                    '$check',
      MONEY_ORDER:              '$money_order',
      VOUCHER:                  '$voucher',
      INTERAC:                  '$interac',
      MASTERPASS:               '$masterpass',
      THIRD_PARTY_PROCESSOR:    '$third_party_processor'
    },
    RESPONSE_STATUS_MESSAGE: {
      0:   'Success',
      51:  'Invalid API key',
      52:  'Invalid characters in field name',
      53:  'Invalid characters in field value',
      54:  'Specified user_id has no scoreable events',
      55:  'Missing required field',
      56:  'Invalid JSON in request',
      57:  'Invalid HTTP body',
      60:  'Rate limited; too many events have been received in a short period of time',
      104: 'Invalid API version',
      105: 'Not a valid reserved field'
    },
    REASON: {
      CHARGEBACK:        '$chargeback',
      SPAM:              '$spam',
      FUNNELING:         '$funneling',
      FAKE:              '$fake',
      REFERRAL:          '$referral',
      DUPLICATE_ACCOUNT: '$duplicate_account'
    },
    DEVICE_LABEL: {
      BAD:     'bad',
      NOT_BAD: 'not_bad'
    }
  };

  // Initalize the return object
  var __sift_object = {
    event:         {},
    fingerprint:   {},
    partner:       {},
    webhook:       {},
    CONSTANTS:     __constants
  };

  // Private : Request function for all requests to sift science
  //
  // @param object   _opts     : required
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  var __sift_request = function(_opts, _callback) {
    // Add return_action to query string if needed
    if (__global_opts.return_action) {
      if (!_opts.qs)
        _opts.qs = {};
      _opts.qs.return_action = true;
    }

    // Add the json content type to all request headers
    if (!_opts.headers)
      _opts.headers = {};
    if (!_opts.headers['Content-Type'])
      _opts.headers['Content-Type'] = 'application/json';

    // Check for scope callback
    if (typeof(_callback) === 'function') {
      var callback = _callback;
    }

    // Check for global callback
    else if (typeof(__global_opts.global_callback) === 'function') {
      var callback = __global_opts.global_callback;
    }

    // Use the default promise callback
    else {
      var deferred = Q.defer();
      var callback = function(_err, _response) {
        // Request Failed
        if (_err)
          return deferred.reject(_err);
        // Request Success
        else if (_response && _response.body)
          return deferred.resolve(_response.body);
        // Not sure
        else
          return deferred.reject({ message: 'An unexpected error has occured.', response: _response.body, status: _response.statusCode });
      };

      // Submit the request
      request(_opts, callback);

      // Return a promise
      return deferred.promise;
    }

    // Submit the request
    request(_opts, callback);

    // Return nothing
    return;
  };


  /****************************/
  /*    SIFTSCIENCE EVENTS    */
  /****************************/


  // Private : Request function for all events
  //
  // @param object   _data     : required (refer to sift science docs https://siftscience.com/docs)
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  var __sift_event_request = function(_data, _callback) {
    var data = _.extend({ '$api_key': __global_opts.api_key }, _data);

    var opts = {
      method: 'POST',
      url:    __sift_url + "events",
      body:   data,
      json:   true
    };

    return __sift_request(opts, _callback);
  };

  // Private : Define array of natively supported siftscience events
  var __sift_events = [
    'create_order',
    'update_order',
    'transaction',
    'create_account',
    'update_account',
    'add_item_to_cart',
    'remove_item_from_cart',
    'submit_review',
    'send_message',
    'create_content',
    'login',
    'logout',
    'link_session_to_user'
  ];

  // Private : Used to generate siftscience event functions in the following loop
  //
  // @param string _type : required
  //
  // @return function
  //
  var __create_sift_event_function = function(_type) {
    // Public : Natively supported siftscience event requests
    //
    // @param object   _data     : required (refer to sift science docs https://siftscience.com/docs)
    // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
    //
    // @return promise || void
    //
    return function(_data, _callback) {
      // _data must be an Object
      if (!(_data instanceof Object))
        throw new Error('`_data` must be an Object.');

      var data = _.extend({ '$type': '$' + _type }, _data);

      return __sift_event_request(data, _callback);
    };
  };

  // Create the siftscience event functions
  __sift_events.forEach(function(type) {
    __sift_object.event[type] = __create_sift_event_function(type);
  });


  /***********************/
  /*    CUSTOM EVENTS    */
  /***********************/


  // Public : Generic Custom Event
  //
  // @param string   _type     : required
  // @param object   _data     : required ({ '$user_id': '1234', '$session_id': '1234' })
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.event.custom_event = function(_type, _data, _callback) {
    // _type must be a String
    if (typeof(_type) !== 'string')
      throw new Error('`_type` must be a String.');

    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var data = _.extend({ '$type': _type }, _data);

    return __sift_event_request(data, _callback);
  };

  if (typeof(__global_opts.custom_events) !== 'undefined' && __global_opts.custom_events !== null && typeof(__global_opts.custom_events) === 'object') {
    // Private : Used to generate custom event functions in the following loop
    //
    // @param string _type : required
    //
    // @return function
    //
    var __create_custom_function = function(_type) {
      // Public : Injected custom event requests
      //
      // @param object   _data     : required (refer to sift science docs https://siftscience.com/docs)
      // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
      //
      // @return promise || void
      //
      return function(_data, _callback) {
        // _data must be an Object
        if (!(_data instanceof Object))
          throw new Error('`_data` must be an Object.');

        var data = _.extend({ '$type': _type }, _data);

        return __sift_event_request(data, _callback);
      };
    };

    // Create the custom event functions
    __global_opts.custom_events.forEach(function(type) {
      // If the type is a string and it isn't already a defined event
      if (typeof(type) === 'string' && typeof(__sift_object.event[type]) === 'undefined') {
        __sift_object.event[type] = __create_custom_function(type);
      }
    });

  }


  /****************/
  /*    LABELS    */
  /****************/


  // Public : Create Label for User
  //
  // @param string   _user_id  : required
  // @param object   _data     : required ({ '$is_bad': true, '$reasons': [siftscience.CONSTANTS.REASON.SPAM], '$description': 'Spamming the system' })
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.label = function(_user_id, _data, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var data = _.extend({ '$api_key': __global_opts.api_key }, _data);

    var opts = {
      method: 'POST',
      url:    __sift_url + "users/" + _user_id + "/labels",
      body:   data,
      json:   true
    };

    return __sift_request(opts, _callback);
  };

  // Public : Remove Label for User
  //
  // @param string   _user_id  : required
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.unlabel = function(_user_id, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    var opts = {
      method: 'DELETE',
      url:    __sift_url + "users/" + _user_id + "/labels",
      qs:     { api_key: __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /****************/
  /*    SCORES    */
  /****************/


  // Public : Get User Score
  //
  // @param string   _user_id  : required
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.score = function(_user_id, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    var opts = {
      method: 'GET',
      url:    __sift_url + "score/" + _user_id,
      json:   true,
      qs:     { api_key: __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /************************/
  /*    FINGERPRINTING    */
  /************************/


  // Public : Get Session
  //
  // @param string   _session_id : required
  // @param function _callback   : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.fingerprint.get_session = function(_session_id, _callback) {
    // _session_id must be a String
    if (typeof(_session_id) !== 'string')
      throw new Error('`_session_id` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + "accounts/" + __global_opts.account_id + "/sessions/" + _session_id,
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  // Public : Get Device
  //
  // @param string   _device_fingerprint : required
  // @param function _callback           : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.fingerprint.get_device = function(_device_fingerprint, _callback) {
    // _device_fingerprint must be a String
    if (typeof(_device_fingerprint) !== 'string')
      throw new Error('`_device_fingerprint` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + "accounts/" + __global_opts.account_id + "/devices/" + _device_fingerprint,
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  // Public : Label Device
  //
  // @param string   _device_fingerprint : required
  // @param string   _label              : 'bad' || 'not_bad'
  // @param function _callback           : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.fingerprint.label_device = function(_device_fingerprint, _label, _callback) {
    // _device_fingerprint must be a String
    if (typeof(_device_fingerprint) !== 'string')
      throw new Error('`_device_fingerprint` must be a String.');

    // _label must be a String
    if (typeof(_label) !== 'string')
      throw new Error('`_label` must be a String.');

    var data = { label: _label };

    var opts = {
      method:  'PUT',
      url:     __sift3_url + "accounts/" + __global_opts.account_id + "/devices/" + _device_fingerprint + "/label",
      body:    data,
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  // Public : Get Devices
  //
  // @param string   _user_id  : required
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.fingerprint.get_devices = function(_user_id, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + "accounts/" + __global_opts.account_id + "/users/" + _user_id + "/devices",
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /******************/
  /*    PARTNERS    */
  /******************/


  // Public : Create Account
  //
  // @param object   _data     : required (refer to sift science docs https://siftscience.com/docs)
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.partner.create_account = function(_data, _callback) {
    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var opts = {
      method:  'POST',
      url:     __sift3_url + "partners/" + __global_opts.partner_id + "/accounts",
      body:    _data,
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  // Public : List Accounts
  //
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.partner.list_accounts = function(_callback) {
    var opts = {
      method:  'GET',
      url:     __sift3_url + "partners/" + __global_opts.partner_id + "/accounts",
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  // Public : Configure Notifications
  //
  // @param object   _data     : required (refer to sift science docs https://siftscience.com/docs)
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  __sift_object.partner.configure_notifications = function(_data, _callback) {
    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var opts = {
      method:  'PUT',
      url:     __sift3_url + "accounts/" + __global_opts.account_id + "/config",
      body:    _data,
      json:    true,
      headers: { 'Authorization': "Basic " + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /******************/
  /*    WEBHOOKS    */
  /******************/


  __sift_object.webhook = {
    express: function() {
      return function(req, res) {
        function done() {
          res.send();
        }

        if (__global_opts.webhooks.all)
          __global_opts.webhooks.all(req, res, done);

        if (__global_opts.webhooks[req.body.action.id])
          __global_opts.webhooks[req.body.action.id](req, res, done);
      }
    }
  };


  /****************/
  /*    RETURN    */
  /****************/


  // Return the object
  return __sift_object;
};
