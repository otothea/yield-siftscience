

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
//   @option string   version         : optional (default: 'v203')
//   @option string[] custom_events   : optional (ex: ['submit_comment', 'delete_account', ...])
//   @option function global_callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
//   @option boolean  return_action   : optional (default: false - can be used to get extra params from sift science responses although it is undocumented)
//
// @return yield-siftscience object
//
module.exports = function(__global_opts) {


  /***************/
  /*    SETUP    */
  /***************/


  // Check for non-object options
  if (typeof(__global_opts) !== 'object') {
    var err     = new Error('InvalidArgument');
    err.message = 'Argument must be an object. If you have recently updated from <= 0.0.9 to >= 0.0.10, you likely need to change the way you require the package. https://github.com/otothea/yield-siftscience#usage';
    throw err;
  }

  // Set default version if none provided
  __global_opts.version = typeof(__global_opts.version) === 'string' ? __global_opts.version : 'v203';

  // Concat Sift Science API url with version
  var sift_url  = 'https://api.siftscience.com/' + __global_opts.version + '/';
  var sift3_url = 'https://api3.siftscience.com/v3/'

  // Set up constant values
  var constants = {
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
  var sift_object = {
    event:         {},
    fingerprint:   {},
    partner:       {},
    CONSTANTS:     constants,
    __global_opts: __global_opts
  };

  // Private : Request function for all requests to sift science
  //
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  var sift_request = function(_opts, _callback) {
    // Add return_action if needed
    if (__global_opts.return_action) {
      if (!_opts.qs) {
        _opts.qs = {};
      }
      _opts.qs.return_action = true;
    }

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
  var sift_event_request = function(_data, _callback) {
    var data = _.extend(_data, { '$api_key': __global_opts.api_key });
    var opts = {
      method: 'POST',
      url:    sift_url + "events",
      body:   JSON.stringify(data),
      json:   true
    };
    return sift_request(opts, _callback);
  };

  // Private : Define array of natively supported siftscience events
  var sift_events = [
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
  // @param string _type
  //
  // @return function
  //
  var create_sift_event_function = function(_type) {
    // Public : Natively supported siftscience event requests
    //
    // @param object   _data     : refer to sift science docs https://siftscience.com/docs
    // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
    //
    // @return promise || void
    //
    return function(_data, _callback) {
      var data = _.extend(_data, { '$type': '$' + _type });
      return sift_event_request(data, _callback);
    };
  };

  // Create the siftscience event functions
  sift_events.forEach(function(type) {
    sift_object.event[type] = create_sift_event_function(type);
  });


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
  sift_object.event.custom_event = function(_type, _data, _callback) {
    var data = _.extend(_data, { '$type': _type });
    return sift_event_request(data, _callback);
  };

  if (typeof(__global_opts.custom_events) !== 'undefined' && __global_opts.custom_events !== null && typeof(__global_opts.custom_events) === 'object') {
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
        return sift_event_request(data, _callback);
      };
    };

    // Create the custom event functions
    __global_opts.custom_events.forEach(function(type) {
      // If the type is a string and it isn't already a defined event
      if (typeof(type) === 'string' && typeof(sift_object.event[type]) === 'undefined') {
        sift_object.event[type] = create_custom_function(type);
      }
    });

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
  sift_object.label = function(_user_id, _data, _callback) {
    var data = _.extend(_data, { '$api_key': __global_opts.api_key });
    var opts = {
      method: 'POST',
      url:    sift_url + "users/" + _user_id + "/labels",
      body:   JSON.stringify(data),
      json:   true
    };
    return sift_request(opts, _callback);
  };

  // Public : Remove Label for User
  //
  // @param string   _user_id
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.unlabel = function(_user_id, _callback) {
    var opts = {
      method: 'DELETE',
      url:    sift_url + "users/" + _user_id + "/labels",
      qs: {
        api_key: __global_opts.api_key
      }
    };
    return sift_request(opts, _callback);
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
  sift_object.score = function(_user_id, _callback) {
    var opts = {
      method: 'GET',
      url:    sift_url + "score/" + _user_id,
      json:   true,
      qs: {
        api_key: __global_opts.api_key
      }
    };
    return sift_request(opts, _callback);
  };


  /************************/
  /*    FINGERPRINTING    */
  /************************/


  // Public : Get Session
  //
  // @param string   _session_id
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.fingerprint.get_session = function(_session_id, _callback) {
    var opts = {
      method: 'GET',
      url:    sift3_url + "accounts/" + __global_opts.account_id + "/sessions/" + _session_id,
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };

  // Public : Get Device
  //
  // @param string   _device_fingerprint
  // @param function _callback           : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.fingerprint.get_device = function(_device_fingerprint, _callback) {
    var opts = {
      method: 'GET',
      url:    sift3_url + "accounts/" + __global_opts.account_id + "/devices/" + _device_fingerprint,
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };

  // Public : Label Device
  //
  // @param string   _device_fingerprint
  // @param string   _label              : 'bad' || 'not_bad'
  // @param function _callback           : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.fingerprint.label_device = function(_device_fingerprint, _label, _callback) {
    var data = { label: _label };
    var opts = {
      method: 'PUT',
      url:    sift3_url + "accounts/" + __global_opts.account_id + "/devices/" + _device_fingerprint + "/label",
      body:   JSON.stringify(data),
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };

  // Public : Get Devices
  //
  // @param string   _user_id
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.fingerprint.get_devices = function(_user_id, _callback) {
    var opts = {
      method: 'GET',
      url:    sift3_url + "accounts/" + __global_opts.account_id + "/users/" + _user_id + "/devices",
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };


  /******************/
  /*    PARTNERS    */
  /******************/


  // Public : Create Account
  //
  // @param object   _data
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.partner.create_account = function(_data, _callback) {
    var opts = {
      method: 'POST',
      url:    sift3_url + "partners/" + __global_opts.partner_id + "/accounts",
      body:   JSON.stringify(_data),
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };

  // Public : List Accounts
  //
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.partner.list_accounts = function(_callback) {
    var opts = {
      method: 'GET',
      url:    sift3_url + "partners/" + __global_opts.partner_id + "/accounts",
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };

  // Public : Configure Notifications
  //
  // @param object   _data
  // @param function _callback : optional (can be used to override promise and make regular callback. ex: function(_err, _response) { ... })
  //
  // @return promise || void
  //
  sift_object.partner.configure_notifications = function(_data, _callback) {
    var opts = {
      method: 'PUT',
      url:    sift3_url + "accounts/" + __global_opts.account_id + "/config",
      body:   JSON.stringify(_data),
      json:   true,
      headers: {
        'Authorization': "Basic " + __global_opts.api_key,
        'Content-Type':  "application/json"
      }
    };
    return sift_request(opts, _callback);
  };


  /****************/
  /*    RETURN    */
  /****************/


  // Return the object
  return sift_object;
};
