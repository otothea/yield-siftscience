

/**********************/
/*    DEPENDENCIES    */
/**********************/


var request = require('request'),
    Q       = require('q'),
    _       = require('underscore');


/***************************/
/*    YIELD SIFTSCIENCE    */
/***************************/


/**
 * Export
 *
 * @param {object} _global_opts
 *
 *   @option {string}   api_key                  : get your keys: https://siftscience.com/console/developer/api-keys
 *   @option {string}   [account_id]             : (required for fingerprint api) get your account_id: https://siftscience.com/console/account/profile
 *   @option {string}   [partner_id]             : (required for partner api) get your partner_id: https://siftscience.com/console/account/profile
 *   @option {string[]} [custom_events]          : (default: [] - ex: ['referral_code_redeemed', 'contacted_customer_support', ...])
 *   @option {function} [global_callback]        : (default: null - can be used to override promise and make regular callback on all requests. ex: function(_err, _response) { ... })
 *   @option {string[]} [abuse_types]            : (default: [] - specify an array of sift science products. This parameter restricts the list of score or workflow decision retrieved to the specific products requested. https://siftscience.com/developers/docs/curl/decisions-api/decision-status. Possible values: Array with one or more of - payment_abuse,promo_abuse,content_abuse,account_abuse,legacy)
 *   @option {boolean}  [return_score]           : (default: false - can be used to return score from sift science synchronously. https://siftscience.com/developers/docs/curl/score-api/synchronous-scores)
 *   @option {boolean}  [return_workflow_status] : (default: false - can be used to return workflow status from sift science synchronously. https://siftscience.com/developers/docs/curl/workflows-api/workflow-decisions)
 *   @option {object}   [webhooks]               : (default: {} - can be used to map callbacks to the webhook middleware)
 *   @option {boolean}  [return_action]          : (deprecated) (default: false - can be used to get extra params from sift science responses. https://siftscience.com/resources/tutorials/formulas#add-actions)
 *
 * Note: In v204 of the sift science API, return_action is deprecated in favor of the more granular combined use of abuse_types, return_score and return_workflow_status flags. (https://siftscience.com/resources/tutorials/formulas)
 *
 * @return {object}
 */
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
  if (__global_opts.custom_events && !Array.isArray(__global_opts.custom_events))
    throw new Error('`custom_events` property must be an Array. https://github.com/otothea/yield-siftscience#usage');

  __global_opts.custom_events = __global_opts.custom_events || []; // Set default to empty array if needed

  // global_callback must be a Function
  if (__global_opts.global_callback && typeof(__global_opts.global_callback) !== 'function')
    throw new Error('`global_callback` property must be a Function. https://github.com/otothea/yield-siftscience#usage');

  // return_action must be a Boolean
  if (__global_opts.return_action && typeof(__global_opts.return_action) !== 'boolean')
    throw new Error('`return_action` property must be a Boolean. https://github.com/otothea/yield-siftscience#usage');

  // abuse_types must be an Array
  if (__global_opts.abuse_types && !Array.isArray(__global_opts.abuse_types))
    throw new Error('`abuse_types` property must be an Array. https://github.com/otothea/yield-siftscience#usage');

  // return_score must be a Boolean
  if (__global_opts.return_score && typeof(__global_opts.return_score) !== 'boolean')
    throw new Error('`return_score` property must be a Boolean. https://github.com/otothea/yield-siftscience#usage');

  // return_workflow_status must be a Boolean
  if (__global_opts.return_workflow_status && typeof(__global_opts.return_workflow_status) !== 'boolean')
    throw new Error('`return_workflow_status` property must be a Boolean. https://github.com/otothea/yield-siftscience#usage');

  // webhooks must be an Object
  if (__global_opts.webhooks && !(__global_opts.webhooks instanceof Object))
    throw new Error('`webhooks` property must be an Object. https://github.com/otothea/yield-siftscience#usage');

  __global_opts.webhooks = __global_opts.webhooks || {}; // Set default to empty object if needed


  /***************/
  /*    SETUP    */
  /***************/


  // Concat Sift Science API url with version
  var __sift_url  = 'https://api.siftscience.com/v204/';
  var __sift3_url = 'https://api3.siftscience.com/v3/';

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
    FAILURE_REASON: {
      ALREADY_USED:   '$already_used',
      INVALID_CODE:   '$invalid_code',
      NOT_APPLICABLE: '$not_applicable',
      EXPIRED:        '$expired'
    },
    SOCIAL_SIGN_ON_TYPE: {
      FACEBOOK: '$facebook',
      GOOGLE:   '$google',
      YAHOO:    '$yahoo',
      TWITTER:  '$twitter',
      OTHER:    '$other',
      LINKEDIN: '$linkedin'
    },
    CONTENT_STATUS: {
      DRAFT:              '$draft',
      PENDING:            '$pending',
      ACTIVE:             '$active',
      PAUSED:             '$paused',
      DELETED_BY_USER:    '$deleted_by_user',
      DELETED_BY_COMPANY: '$deleted_by_company'
    },
    CHARGEBACK_STATE: {
      RECEIVED: '$received',
      ACCEPTED: '$accepted',
      DISPUTED: '$disputed',
      WON:      '$won',
      LOST:     '$lost'
    },
    CHARGEBACK_REASON: {
      FRAUD:                '$fraud',
      DUPLICATE:            '$duplicate',
      PRODUCT_NOT_RECEIVED: '$product_not_received',
      PRODUCT_UNACCEPTABLE: '$product_unacceptable',
      OTHER:                '$other'
    },
    ORDER_STATUS: {
      APPROVED:  '$approved',
      CANCELED:  '$canceled',
      HELD:      '$held',
      FULFILLED: '$fulfilled',
      RETURNED:  '$returned'
    },
    ORDER_CANCEL_REASON: {
      PAYMENT_RISK: '$payment_risk',
      ABUSE:        '$abuse',
      POLICY:       '$policy',
      OTHER:        '$other'
    },
    ORDER_STATUS_SOURCE: {
      AUTOMATED: '$automated',
      MANUAL_REVIEW: '$manual_review'
    },
    VERIFICATION_TYPE: {
      SMS:        '$sms',
      PHONE_CALL: '$phone_call',
      EMAIL:      '$email',
      APP_TFA:    '$app_tfa',
      CAPTCHA:    '$captcha'
    },
    PAYMENT_TYPE: {
      CASH:                     '$cash',
      CHECK:                    '$check',
      CREDIT_CARD:              '$credit_card',
      CRYPTO_CURRENCY:          '$crypto_currency',
      DIGITAL_WALLET:           '$digital_wallet',
      ELECTRONIC_FUND_TRANSFER: '$electronic_fund_transfer',
      FINANCING:                '$financing',
      GIFT_CARD:                '$gift_card',
      INTERAC:                  '$interac', // Deprecated?
      INVOICE:                  '$invoice',
      MONEY_ORDER:              '$money_order',
      MASTERPASS:               '$masterpass', // Deprecated?
      POINTS:                   '$points',
      STORE_CREDIT:             '$store_credit',
      THIRD_PARTY_PROCESSOR:    '$third_party_processor',
      VOUCHER:                  '$voucher'
    },
    RESPONSE_STATUS_MESSAGE: {
      '-4':  'Service currently unavailable. Please try again later.',
      '-3':  'Server-side timeout processing request. Please try again later.',
      '-2':  'Unexpected server-side error',
      '-1':  'Unexpected server-side error',
      '0':   'Success',
      '51':  'Invalid API key',
      '52':  'Invalid characters in field name',
      '53':  'Invalid characters in field value',
      '54':  'Specified user_id has no scoreable events',
      '55':  'Missing required field',
      '56':  'Invalid JSON in request',
      '57':  'Invalid HTTP body',
      '60':  'Rate limited',
      '104': 'Invalid API version',
      '105': 'Not a valid reserved field',
      '111': 'This feature is not enabled in your feature plan.'
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
    },
    DEVICE_PERVASIVENESS: {
      LOW:    'low',
      MEDIUM: 'medium',
      HIGH:   'high'
    },
    ABUSE_TYPE: {
      PAYMENT_ABUSE:   'payment_abuse',
      CONTENT_ABUSE:   'content_abuse',
      PROMOTION_ABUSE: 'promotion_abuse',
      PROMO_ABUSE:     'promo_abuse',
      ACCOUNT_ABUSE:   'account_abuse',
      LEGACY:          'legacy'
    },
    DECISION: {
      PAYMENT_ABUSE:   'payment_abuse',
      PROMOTION_ABUSE: 'promotion_abuse',
      PROMO_ABUSE:     'promo_abuse',
      CONTENT_ABUSE:   'content_abuse',
      ACCOUNT_ABUSE:   'account_abuse',
      LEGACY:          'legacy'
    },
    DECISION_CATEGORY: {
      BLOCK:  'BLOCK',
      WATCH:  'WATCH',
      ACCEPT: 'ACCEPT'
    },
    DECISION_SOURCE: {
      MANUAL_REVIEW:  'MANUAL_REVIEW',
      AUTOMATED_RULE: 'AUTOMATED_RULE',
      CHARGEBACK:     'CHARGEBACK'
    },
    STATE: {
      RUNNING:  'running',
      FINISHED: 'finished',
      FAILED:   'failed'
    },
    ENTITY_TYPE: {
      USERS:  'users',
      ORDERS: 'orders',
      USER:   'user',
      ORDER:  'order'
    },
    APP: {
      DECISION:        'decision',
      REVIEW_QUEUE:    'review_queue',
      USER_SCORER:     'user_scorer',
      ORDER_SCORER:    'order_scorer',
      EVENT_PROCESSOR: 'event_processor'
    },
    ACCOUNT_STATE: {
      ACTIVE:   'ACTIVE',
      DISABLED: 'DISABLED',
      DELETED:  'DELETED'
    }
  };

  // Initalize the return object
  var __sift_object = {
    event:         {},
    decision:      {},
    workflow:      {},
    fingerprint:   {},
    partner:       {},
    webhook:       {},
    CONSTANTS:     __constants
  };

  /**
   * Private : Request function for all requests to sift science
   *
   * @param {object}   _opts
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  function __sift_request(_opts, _callback) {
    // Add return_action to query string if needed
    if (__global_opts.return_action) {
      if (!_opts.qs)
        _opts.qs = {};
      _opts.qs.return_action = true;
    }

    // Add abuse_types to query string if needed
    if (__global_opts.abuse_types && Array.isArray(__global_opts.abuse_types)) {
      if (!_opts.qs)
        _opts.qs = {};
      if (!_opts.qs.abuse_types)
        _opts.qs.abuse_types = __global_opts.abuse_types.join(',');
    }

    // Add return_score to query string if needed
    if (__global_opts.return_score) {
      if (!_opts.qs)
        _opts.qs = {};
      _opts.qs.return_score = true;
    }

    // Add return_workflow_status to query string if needed
    if (__global_opts.return_workflow_status) {
      if (!_opts.qs)
        _opts.qs = {};
      _opts.qs.return_workflow_status = true;
    }

    // Add the json content type to all request headers
    if (!_opts.headers)
      _opts.headers = {};
    if (!_opts.headers['Content-Type'])
      _opts.headers['Content-Type'] = 'application/json';

    var callback = null;

    // Check for scope callback
    if (typeof(_callback) === 'function') {
      callback = _callback;
    }
    // Check for global callback
    else if (typeof(__global_opts.global_callback) === 'function') {
      callback = __global_opts.global_callback;
    }
    // Use the default promise callback
    else {
      var deferred = Q.defer();
      callback = function(_err, _response) {
        // Request Failed
        if (_err)
          return deferred.reject(_err);
        // Request Success
        else if (_response && 'body' in _response)
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
  }


  /****************************/
  /*    SIFTSCIENCE EVENTS    */
  /****************************/


  /**
   * Private : Request function for all events
   *
   * @param {object}   _data       : refer to sift science docs https://siftscience.com/docs
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  function __sift_event_request(_data, _callback) {
    var data = _.extend({ '$api_key': __global_opts.api_key }, _data);

    var opts = {
      method: 'POST',
      url:    __sift_url + 'events',
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
    'create_content',
    'update_content',
    'content_status',
    'flag_content',
    'add_promotion',
    'add_item_to_cart',
    'remove_item_from_cart',
    'submit_review',
    'send_message',
    'login',
    'logout',
    'link_session_to_user',
    'chargeback',
    'order_status',
    'verification'
  ];

  /**
   * Private : Used to generate siftscience event functions in the following loop
   *
   * @param {string} _type
   *
   * @return {function}
   */
  function __create_sift_event_function(_type) {
    /**
     * Public : Natively supported siftscience event requests
     *
     * @param {object}   _data       : refer to sift science docs https://siftscience.com/docs
     * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
     *
     * @return {promise|void}
     */
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


  /**
   * Public : Generic Custom Event
   *
   * @param {string}   _type
   * @param {object}   _data       : ex: { '$user_id': '1234', '$session_id': '1234' }
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
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
    /**
     * Private : Used to generate custom event functions in the following loop
     *
     * @param {string} _type
     *
     * @return {function}
     */
    function __create_custom_function(_type) {
      /**
       * Public : Injected custom event requests
       *
       * @param {object}   _data       : refer to sift science docs https://siftscience.com/docs
       * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
       *
       * @return {promise|void}
       */
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


  /**
   * Public : Create Label for User
   *
   * @param {string}   _user_id
   * @param {object}   _data       : ex: { '$is_bad': true, '$abuse_type': siftscience.CONSTANTS.ABUSE_TYPE.ACCOUNT_ABUSE, '$description': 'Spamming the system' }
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
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
      url:    __sift_url + 'users/' + _user_id + '/labels',
      body:   data,
      json:   true
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Remove Label for User
   *
   * @param {string}   _user_id
   * @param {string}   [_abuse_type] : (default: '' - remove all labels)
   * @param {function} [_callback]   : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.unlabel = function(_user_id, _abuse_type, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    // _user_id must be a String
    if (_abuse_type && typeof(_abuse_type) !== 'string')
      throw new Error('`_abuse_type` must be a String.');

    var qs = {
      api_key: __global_opts.api_key
    };

    if (_abuse_type)
      qs.abuse_type = _abuse_type

    var opts = {
      method: 'DELETE',
      url:    __sift_url + 'users/' + _user_id + '/labels',
      qs:     qs
    };

    return __sift_request(opts, _callback);
  };


  /*******************/
  /*    DECISIONS    */
  /*******************/


  /**
   * Public : Get decisions
   *
   * @param {string}   [_entity]
   * @param {string}   [_abuse_types] : (default: []) Array of abuse types to filter with
   * @param {number}   [_from]        : (default: 0) Offset to start searching from
   * @param {number}   [_limit]       : (default: 100) Number of decisions to return
   * @param {function} [_callback]    : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @returns {promise|void}
   */
  __sift_object.decision.list = function(_entity, _abuse_types, _from, _limit, _callback) {
    // _entity must be a String
    if (_entity && typeof(_entity) !== 'string')
      throw new Error('`_entity` must be a String.');

    // _abuse_types must be an Array
    if (_abuse_types && !Array.isArray(_abuse_types))
      throw new Error('`_abuse_types` must be an Array.');

    var qs = {
      from: _from || 0,
      limit: _limit || 100
    };

    if (_entity)
      qs.entity_type = _entity;

    if (Array.isArray(_abuse_types))
      qs.abuse_types = _abuse_types.join(',');

    var opts = {
      method:  'GET',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/decisions',
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key },
      qs:      qs
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Apply decision
   *
   * @param {string}      _user_id    : User id to apply decision
   * @param {string|null} _order_id   : Optionally set to apply decision to a specific order for the user
   * @param {number}      _data       : ex: { 'decision_id': 'user_payment_abuse', 'source': siftscience.CONSTANTS.DECISION_SOURCE.MANUAL_REVIEW, 'analyst': 'analyst@example.com' }
   * @param {function}    [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @returns {promise|void}
   */
  __sift_object.decision.apply = function(_user_id, _order_id, _data, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    // _order_id must be a String or null
    if (typeof(_order_id) !== 'string' && _order_id !== null)
      throw new Error('`_order_id` must be a String or null.');

    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var opts = {
      method:  'POST',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/users/' + _user_id + '/decisions',
      body:    _data,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    // Update the url if there is an _order_id set
    if (typeof(_order_id) === 'string') {
      opts.url = __sift3_url + 'accounts/' + __global_opts.account_id + '/users/' + _user_id + '/orders/' + _order_id + '/decisions';
    }

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Get decision status
   *
   * @param {string}   _entity
   * @param {string}   _entity_id
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @returns {promise|void}
   */
  __sift_object.decision.status = function(_entity, _entity_id, _callback) {
    // _entity must be a String
    if (typeof(_entity) !== 'string')
      throw new Error('`_entity` must be a String.');

    // _entity_id must be a String
    if (typeof(_entity_id) !== 'string')
      throw new Error('`_entity_id` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/' + _entity + '/' + _entity_id + '/decisions',
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /*******************/
  /*    WORKFLOWS    */
  /*******************/


  /**
   * Public : Get workflow status
   *
   * @param {string}   _workflow_run_id
   * @param {function} [_callback]      : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @returns {promise|void}
   */
  __sift_object.workflow.status = function(_workflow_run_id, _callback) {
    var opts = {
      method: 'GET',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/workflows/runs/' + _workflow_run_id,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /****************/
  /*    SCORES    */
  /****************/


  /**
   * Public : Get User Score
   *
   * @param {string}   _user_id
   * @param {string[]} [_abuse_types] : (default: [] - get all scores)
   * @param {function} [_callback]    : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.score = function(_user_id, _abuse_types, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    // _abuse_types must be an Array
    if (_abuse_types && !Array.isArray(_abuse_types))
      throw new Error('`_abuse_types` must be an Array.');

    var qs = {
      api_key: __global_opts.api_key
    };

    if (Array.isArray(_abuse_types))
      qs.abuse_types = _abuse_types.join(',');

    var opts = {
      method: 'GET',
      url:    __sift_url + 'score/' + _user_id,
      json:   true,
      qs:     { api_key: __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };


  /************************/
  /*    FINGERPRINTING    */
  /************************/



  /**
   * Public : Get Device
   *
   * @param {string}   _device_id
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.fingerprint.get_device = function(_device_id, _callback) {
    // _device_id must be a String
    if (typeof(_device_id) !== 'string')
      throw new Error('`_device_id` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/devices/' + _device_id,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Label Device
   *
   * @param {string}   _device_id
   * @param {string}   _label      : 'bad' || 'not_bad'
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.fingerprint.label_device = function(_device_id, _label, _callback) {
    // _device_id must be a String
    if (typeof(_device_id) !== 'string')
      throw new Error('`_device_id` must be a String.');

    // _label must be a String
    if (typeof(_label) !== 'string')
      throw new Error('`_label` must be a String.');

    var data = { label: _label };

    var opts = {
      method:  'PUT',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/devices/' + _device_id + '/label',
      body:    data,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Get Session
   *
   * @param {string}   _session_id
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.fingerprint.get_session = function(_session_id, _callback) {
    // _session_id must be a String
    if (typeof(_session_id) !== 'string')
      throw new Error('`_session_id` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/sessions/' + _session_id,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Get Devices
   *
   * @param {string}   _user_id
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.fingerprint.get_devices = function(_user_id, _callback) {
    // _user_id must be a String
    if (typeof(_user_id) !== 'string')
      throw new Error('`_user_id` must be a String.');

    var opts = {
      method:  'GET',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/users/' + _user_id + '/devices',
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  /******************/
  /*    PARTNERS    */
  /******************/


  /**
   * Public : Configure Notifications
   *
   * @param {object}   _data       : refer to sift science docs https://siftscience.com/docs
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.partner.configure_notifications = function(_data, _callback) {
    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var opts = {
      method:  'PUT',
      url:     __sift3_url + 'accounts/' + __global_opts.account_id + '/config',
      body:    _data,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : Create Account
   *
   * @param {object}   _data       : refer to sift science docs https://siftscience.com/docs
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.partner.create_account = function(_data, _callback) {
    // _data must be an Object
    if (!(_data instanceof Object))
      throw new Error('`_data` must be an Object.');

    var opts = {
      method:  'POST',
      url:     __sift3_url + 'partners/' + __global_opts.partner_id + '/accounts',
      body:    _data,
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
    };

    return __sift_request(opts, _callback);
  };

  /**
   * Public : List Accounts
   *
   * @param {function} [_callback] : can be used to override promise and make regular callback. ex: function(_err, _response) { ... }
   *
   * @return {promise|void}
   */
  __sift_object.partner.list_accounts = function(_callback) {
    var opts = {
      method:  'GET',
      url:     __sift3_url + 'partners/' + __global_opts.partner_id + '/accounts',
      json:    true,
      headers: { 'Authorization': 'Basic ' + __global_opts.api_key }
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
