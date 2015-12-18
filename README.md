Yield Sift Science - NodeJS
===

A promise-wrapped helper lib for yielding Sift Science API calls in nodejs.

Also supports regular [callbacks](#callbacks).

## INSTALLATION

#### Using [npm](https://npmjs.org):
```bash
$ npm install yield-siftscience
```

## USAGE

#### Require with [API key](https://siftscience.com/console/developer/api-keys):

Default API version
```js
var siftscience = require('yield-siftscience')({
  api_key: 'YOUR_SIFT_SCIENCE_REST_API_KEY'
});
```

For a specific siftscience API version
```js
var siftscience = require('yield-siftscience')({
  api_key: 'YOUR_SIFT_SCIENCE_REST_API_KEY',
  version: 'v203'
});
```

#### Available options:
  - api_key:         'XXXXXXXXXXXX',                    // required  (get your keys: https://siftscience.com/console/developer/api-keys)
  - account_id:      'XXXXXXXXXXXX',                    // optional* (required for fingerprint api, get your account id: https://siftscience.com/console/account/profile)
  - version:         'xXXX',                            // optional  (default: 'v203')
  - custom_events:   ['xxxx_xxxx'],                     // optional  (ex: ['submit_comment', 'delete_account', ...])
  - global_callback: function(_err, _response) { ... }, // optional  (can be used to override promise and make regular callback on all requests)
  - return_action:   true                               // optional  (default: false - can be used to get extra params from sift science responses although it is undocumented)

## EVENTS API

#### Send Event:
```js
var create_account = yield siftscience.event.create_account({
  '$session_id': session.id,
  '$user_id': user.id,
  '$user_email': user.email
});

var login = yield siftscience.event.login({
  '$session_id': session.id,
  '$user_id': user.id,
  '$login_status': siftscience.CONSTANTS.LOGIN_STATUS.SUCCESS
});
```

#### Send Generic Custom Event:
```js
var submit_comment = yield siftscience.event.custom_event('submit_comment', {
  '$session_id': session.id,
  '$user_id': user.id,
  '$user_email': user.email,
  'content': 'blah blah blah comment'
});

var delete_account = yield siftscience.event.custom_event('delete_account', {
  '$session_id': session.id,
  '$user_id': user.id
});
```

#### Inject Custom Events:

Optionally, you can pass in an array of custom event names to add to the lib

```js
var siftscience = require('yield-siftscience')({
  api_key:       'YOUR_SIFT_SCIENCE_REST_API_KEY',
  custom_events: ['submit_comment', 'delete_account', ...]
});
```

Then you could use

```js
var submit_comment = yield siftscience.event.submit_comment({
  '$session_id': session.id,
  '$user_id': user.id,
  '$user_email': user.email,
  'content': 'blah blah blah comment'
});

var delete_account = yield siftscience.event.delete_account({
  '$session_id': session.id,
  '$user_id': user.id,
});
```

## LABELS API

#### Send Label:
```js
var result = yield siftscience.label(user.id, {
  '$is_bad': true,
  '$reasons': [ siftscience.CONSTANTS.REASON.SPAM, siftscience.CONSTANTS.REASON.CHARGEBACK ],
  '$description': 'Because they are spamming and abusing our system'
});
```

#### Remove Label:
```js
var result = yield siftscience.unlabel(user.id);
```

## SCORE API

#### Get Score:
```js
var score = yield siftscience.score(user.id);
```

## DEVICE FINGERPRINTING API

#### JavaScript Snippet:

Add this snippet to your html pages. Replace `'UNIQUE_SESSION_ID'`, `'UNIQUE_USER_ID'`, and `'INSERT_JS_SNIPPET_KEY_HERE'` to proper values

```js
<script type="text/javascript">
var _session_id = 'UNIQUE_SESSION_ID'; // IMPORTANT! Set to a unique session ID for the visitor's current browsing session.
var _user_id = 'UNIQUE_USER_ID';       // IMPORTANT! Set to the user's unique ID, username, or email address if known when the snippet loads

var _sift = _sift || [];
_sift.push(['_setAccount', 'INSERT_JS_SNIPPET_KEY_HERE']);
_sift.push(['_setSessionId', _session_id]);
_sift.push(['_setUserId', _user_id]);
_sift.push(['_trackPageview']);
(function() {
  function ls() {
    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.async = true;
    e.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'cdn.siftscience.com/s.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(e, s);
  }
  if (window.attachEvent) {
    window.attachEvent('onload', ls);
  } else {
    window.addEventListener('load', ls, false);
  }
})();
</script>
```

#### Init with Account ID:

An Account ID is required to use the fingerprint api. [Get your Account ID](https://siftscience.com/console/account/profile)

```js
var siftscience = require('yield-siftscience')({
  api_key:    'YOUR_SIFT_SCIENCE_REST_API_KEY',
  account_id: 'YOUR_SIFT_SCIENCE_ACCOUNT_ID'
})
```

#### Get Session:

```js
var result = yield siftscience.fingerprint.getSession(session.id);
```

#### Get Device:

```js
var result = yield siftscience.fingerprint.getDevice(device_fingerprint);
```

#### Label Device:

```js
var result = yield siftscience.fingerprint.labelDevice(device_fingerprint, siftscience.CONSTANTS.DEVICE_LABEL.BAD);
```

#### Get Devices:

```js
var result = yield siftscience.fingerprint.getDevices(user.id);
```

## CALLBACKS

#### Don't know what yielding or promising is? All calls support regular callbacks:
```js
siftscience.score(user.id, function(_err, _response) {
  if (_err) {
    console.log(_err);
  }
  else {
    var score = _response.body;
    console.log(score);
  }
});
```

#### You can also inject a global callback for all requests:
```js
var siftscience = require('yield-siftscience')({
  api_key: 'YOUR_SIFT_SCIENCE_REST_API_KEY',
  global_callback: function(_err, _response) {
    if (_err) {
      console.log(_err);
    }
    else {
      var result = _response.body;
      console.log(result);
    }
  }
});
```

## CONSTANTS

```js
siftscience.CONSTANTS = {
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
  TRANSACTION_STATUS: {
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
  SUBMISSION_STATUS: {
    SUCCESS: '$success',
    FAILURE: '$failure',
    PENDING: '$pending'
  },
  LOGIN_STATUS: {
    SUCCESS: '$success',
    FAILURE: '$failure'
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
  TRANSACTION_STATUS: {
    SUCCESS: '$success',
    FAILURE: '$failure',
    PENDING: '$pending'
  },
  RESPONSE_STATUS_MESSAGE: {
    '0':   'Success',
    '51':  'Invalid API key',
    '52':  'Invalid characters in field name',
    '53':  'Invalid characters in field value',
    '54':  'Specified user_id has no scoreable events',
    '55':  'Missing required field',
    '56':  'Invalid JSON in request',
    '57':  'Invalid HTTP body',
    '60':  'Rate limited; too many events have been received in a short period of time',
    '104': 'Invalid API version',
    '105': 'Not a valid reserved field'
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
```

## CODE DOCUMENTATION

Please look at the code [yield-siftscience/lib/app.js](https://github.com/otothea/yield-siftscience/blob/master/lib/app.js) for more technical documentation

## SIFT SCIENCE DOCUMENTATION

[siftscience.com/docs](https://siftscience.com/docs)

## CHANGE LOG

#### 0.0.10
  - **BREAKING CHANGE:** Consolidate init args into one `options` arg - see [USAGE](#usage)
  - Add support for `return_action` in init options - this is undocumented by sift science is not commonly used
  - Add support for device fingerprinting api
  - Add `CONSTANTS` object to `siftscience` object for things like `$reasons` and `$shipping_method` - see [LABELS API](#labels-api)

#### 0.0.9
  - Add `unlabel` method to `siftscience` object
