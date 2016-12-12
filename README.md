# Yield Sift Science - NodeJS

A promise-wrapped helper lib for yielding Sift Science API calls in nodejs.

Also supports regular [callbacks](#callbacks).

#### Table of contents:

  - [Installation](#installation)
  - [Usage](#usage)
  - [Events API](#events-api)
  - [Labels API](#labels-api)
  - [Decision API](#decision-api)
  - [Workflow API](#workflow-api)
  - [Score API](#score-api)
  - [Device Fingerprinting API](#device-fingerprinting-api)
  - [Partner API](#partner-api)
  - [Callbacks](#callbacks)
  - [Constants](#constants)
  - [Webhooks](#webhooks)
  - [Sift Science Documentation](https://siftscience.com/docs)
  - [Testing](#testing)
  - [Change Log](#change-log)

## INSTALLATION

#### Using [npm](https://npmjs.org):

```bash
$ npm install yield-siftscience
```

## USAGE

#### Require with [API Key](https://siftscience.com/console/developer/api-keys):

```js
var siftscience = require('yield-siftscience')({
  api_key: 'YOUR_SIFT_SCIENCE_REST_API_KEY'
});
```

#### Available Options:

  - {string} **api_key** ([get your api key](https://siftscience.com/console/developer/api-keys))
  - {string} **[account_id]** (required for [device fingerprinting api](#device-fingerprinting-api), [get your account id](https://siftscience.com/console/account/profile))
  - {string} **[partner_id]** (required for [partner api](#partner-api), [get your partner id](https://siftscience.com/console/account/profile))
  - {string[]} **[custom_events]** (ex: `['referral_code_redeemed', 'contacted_customer_support', ...]`)
  - {function} **[global_callback]** (ex: `function(err, response) { ... }` - can be used to override promise and make regular callback on all requests)
  - {string[]} **[abuse_types]** (default: `[]` - specify an array of sift science products. This parameter restricts the list of score or workflow decision retrieved to the specific products requested. [more info](https://siftscience.com/developers/docs/curl/decisions-api/decision-status). Possible values: Array with one or more of - `['payment_abuse','promo_abuse','content_abuse','account_abuse','legacy']`)
  - {boolean} **[return_score]** (default: `false` - can be used to return score from sift science synchronously [more info](https://siftscience.com/developers/docs/curl/score-api/synchronous-scores))
  - {boolean} **[return_workflow_status]** (default: `false` - can be used to return workflow status from sift science synchronously [more info](https://siftscience.com/developers/docs/curl/workflows-api/workflow-decisions))
  - {object} **[webhooks]** (default: `{}` - see [webhooks](#webhooks) for usage)
  - {boolean} **[return_action]** *DEPRECATED* (default: `false` - can be used to get extra params from sift science responses [more info](https://siftscience.com/resources/tutorials/formulas#add-actions))

**Note:** In v204 of the sift science API, return_action is deprecated in favor of the more granular combined use of abuse_types, return_score and return_workflow_status flags. [more info](https://siftscience.com/resources/tutorials/formulas)

## EVENTS API

[https://siftscience.com/developers/docs/curl/events-api](https://siftscience.com/developers/docs/curl/events-api)

#### Send Event:

```js
var result = yield siftscience.event.create_account({
  '$session_id': session.id,
  '$user_id':    user.id,
  '$user_email': user.email
});
```

```js
var result = yield siftscience.event.login({
  '$session_id':   session.id,
  '$user_id':      user.id,
  '$login_status': siftscience.CONSTANTS.STATUS.SUCCESS
});
```

#### Send Generic Custom Event:

```js
var result = yield siftscience.event.custom_event('referral_code_redeemed', {
  '$session_id': session.id,
  '$user_id':    user.id,
  'code':        'abc123'
});
```

```js
var result = yield siftscience.event.custom_event('contacted_customer_support', {
  '$session_id': session.id,
  '$user_id':    user.id
});
```

#### Inject Custom Events:

Optionally, you can pass in an array of custom event names to add to the lib

```js
var siftscience = require('yield-siftscience')({
  api_key:       'YOUR_SIFT_SCIENCE_REST_API_KEY',
  custom_events: ['referral_code_redeemed', 'contacted_customer_support', ...]
});
```

Then you could use

```js
var result = yield siftscience.event.referral_code_redeemed({
  '$session_id': session.id,
  '$user_id':    user.id,
  'code':        'abc123'
});
```

```js
var result = yield siftscience.event.contacted_customer_support({
  '$session_id': session.id,
  '$user_id':    user.id,
});
```

## LABELS API

[https://siftscience.com/developers/docs/curl/labels-api](https://siftscience.com/developers/docs/curl/labels-api)

#### Send Label:

```js
var result = yield siftscience.label(user.id, {
  '$is_bad':      true,
  '$abuse_type':  siftscience.CONSTANTS.ABUSE_TYPE.PAYMENT_ABUSE,
  '$description': 'Because they are spamming and abusing our system',
  '$source':      'manual review',
  '$analyst':     'admin@example.com'
});
```

#### Remove Label:

```js
var result = yield siftscience.unlabel(user.id);
```

## DECISION API

[https://siftscience.com/developers/docs/curl/decisions-api](https://siftscience.com/developers/docs/curl/decisions-api)

#### Get decision status:

```js
var result = yield siftscience.decision.status(siftscience.CONSTANTS.ENTITY_TYPE.USERS, entity.id)
```

## WORKFLOW API

[https://siftscience.com/developers/docs/curl/workflows-api](https://siftscience.com/developers/docs/curl/workflows-api)

#### Get workflow status:

```js
var result = yield siftscience.workflow.status(workflow.id)
```

## SCORE API

[https://siftscience.com/developers/docs/curl/score-api](https://siftscience.com/developers/docs/curl/score-apii)

#### Get Score:

```js
var result = yield siftscience.score(user.id);
```

## DEVICE FINGERPRINTING API

[https://siftscience.com/developers/docs/curl/device-fingerprinting-api](https://siftscience.com/developers/docs/curl/device-fingerprinting-api)

#### JavaScript Snippet:

[https://siftscience.com/developers/docs/javascript/javascript-api](https://siftscience.com/developers/docs/javascript/javascript-api)

Install the following JavaScript snippet on every public-facing page on your site. Do not include this snippet on internal tools or administration systems.

Replace `'UNIQUE_SESSION_ID'`, `'UNIQUE_USER_ID'`, and `'INSERT_JS_SNIPPET_KEY_HERE'` with proper values

```html
<script type="text/javascript">
  var _user_id = 'UNIQUE_USER_ID';
  var _session_id = 'UNIQUE_SESSION_ID';

  var _sift = window._sift = window._sift || [];
  _sift.push(['_setAccount', 'INSERT_JS_SNIPPET_KEY_HERE']);
  _sift.push(['_setUserId', _user_id]);
  _sift.push(['_setSessionId', _session_id]);
  _sift.push(['_trackPageview']);

  (function() {
    function ls() {
      var e = document.createElement('script');
      e.src = 'https://cdn.siftscience.com/s.js';
      document.body.appendChild(e);
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
});
```

#### Get Session:

```js
var result = yield siftscience.fingerprint.get_session(session.id);
```

#### Get Device:

```js
var result = yield siftscience.fingerprint.get_device(device_fingerprint);
```

#### Label Device:

```js
var result = yield siftscience.fingerprint.label_device(device_fingerprint, siftscience.CONSTANTS.DEVICE_LABEL.BAD);
```

#### Get Devices:

```js
var result = yield siftscience.fingerprint.get_devices(user.id);
```

## PARTNER API

[https://siftscience.com/developers/docs/curl/partner-api](https://siftscience.com/developers/docs/curl/partner-api)

**NOTE:** I have not tested these as I do not have a partner account with sift science. Please report any bugs.

#### Init with Account ID and Partner ID (they may be the same thing, I'm not sure):

An Account & Partner ID are required to use the partner api. [Get your Account & Partner ID](https://siftscience.com/console/account/profile)

```js
var siftscience = require('yield-siftscience')({
  api_key:    'YOUR_SIFT_SCIENCE_REST_API_KEY',
  account_id: 'YOUR_SIFT_SCIENCE_ACCOUNT_ID',
  partner_id: 'YOUR_SIFT_SCIENCE_PARTNER_ID'
});
```

#### Create Account:

```js
var result = yield siftscience.partner.create_account({
  site_url:      'merchant123.com',
  site_email:    'owner@merchant123.com',
  analyst_email: 'john.doe@merchant123.com',
  password:      's0mepA55word'
});
```

#### List Accounts:

```js
var result = yield siftscience.partner.list_accounts();
```

#### Configure Notifications:

```js
var result = yield siftscience.partner.configure_notifications({
  email_notification_threshold: 0.5,
  http_notification_threshold:  0.5,
  http_notification_url:       'https://api.partner.com/notify?account=%s'
});
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
  api_key:         'YOUR_SIFT_SCIENCE_REST_API_KEY',
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
    OTHER:    '$other'
  },
  PAYMENT_TYPE: {
    CASH:                     '$cash',
    CHECK:                    '$check',
    CREDIT_CARD:              '$credit_card',
    CRYPTO_CURRENCY:          '$crypto_currency',
    ELECTRONIC_FUND_TRANSFER: '$electronic_fund_transfer',
    FINANCING:                '$financing',
    GIFT_CARD:                '$gift_card',
    INTERAC:                  '$interac',
    INVOICE:                  '$invoice',
    MONEY_ORDER:              '$money_order',
    MASTERPASS:               '$masterpass',
    POINTS:                   '$points',
    STORE_CREDIT:             '$store_credit',
    THIRD_PARTY_PROCESSOR:    '$third_party_processor',
    VOUCHER:                  '$voucher'
  },
  RESPONSE_STATUS_MESSAGE: {
    '-4':  'Service currently unavailable.Please try again later.',
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
  ABUSE_TYPE: {
    PAYMENT_ABUSE:   'payment_abuse',
    CONTENT_ABUSE:   'content_abuse',
    PROMOTION_ABUSE: 'promotion_abuse',
    ACCOUNT_ABUSE:   'account_abuse'
  },
  DECISION: {
    PAYMENT_ABUSE: 'payment_abuse',
    PROMO_ABUSE:   'promo_abuse',
    CONTENT_ABUSE: 'content_abuse',
    ACCOUNT_ABUSE: 'account_abuse',
    LEGACY:        'legacy'
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
  }
};
```

## WEBHOOKS

**NOTE:** Currently only supports express/body-parser

#### Install Express/Body-Parser:

```bash
$ npm install --save express
$ npm install --save body-parser
$ npm install --save yield-siftscience
```

#### Example App:

Let's say you have [created an action](https://siftscience.com/console/actions/users) called "Test" with Action ID `test`

```js
var express    = require('express');
var bodyParser = require('body-parser');

// Require yield-siftscience with a webhooks mapping option
var siftscience = require('yield-siftscience')({
  api_key: 'YOUR_SIFT_SCIENCE_REST_API_KEY',
  webhooks: {
    // This will receive all webhooks, regardless of Action ID
    all: function(req, res, done) {
      console.log('all: ', req.body);
      done();
    },
    // This will receive webhooks with Action ID 'test'
    test: function(req, res, done) {
      console.log('test: ', req.body);
      done();
    }
  }
});

// Set up the webhook listener
var app = express();
app.post('/siftscience', bodyParser.json(), siftscience.webhook.express());

app.listen(config.port);
```

## SIFT SCIENCE DOCUMENTATION

[https://siftscience.com/developers/docs/curl/apis-overview](https://siftscience.com/developers/docs/curl/apis-overview)

## TESTING

#### Copy Example Config:

```bash
$ cp test/config-example.js test/config.js
$ nano test/config.js
```

#### Set Sandbox [API Key](https://siftscience.com/console/developer/api-keys), [JS Key](https://siftscience.com/console/developer/api-keys), [Account ID](https://siftscience.com/console/account/profile), [Workflow Run ID](https://siftscience.com/console/developer/workflow-logs)

```js
module.exports = {
  api_key:         'xxxxxxxxxxxxxxxx',
  js_key:          'xxxxxxxxxx',
  account_id:      'xxxxxxxxxxxxxxxxxxxxxxxx',
  workflow_run_id: 'xxxxxxxxxxxxx',
  host:            'localhost',
  port:            3000
};
```

#### Install Dependencies:

```bash
$ npm install
```

#### Run Test:

```bash
$ npm test
```

#### Visit Page:

Visiting the test web page will trigger a page view for user_id = '1' and session_id = '1'

```
http://localhost:3000
```

**NOTE:** You will have to run the test a second time if this is your first time visiting the test web page

## CHANGE LOG

#### 0.2.0:

  - Update to API v204
  - **BREAKING CHANGE:** `siftscience.unlabel()` function signature has changed to support abuse type
  - **BREAKING CHANGE:** `siftscience.score()` function signature has changed to support abuse types
  - Add support for decision status api
  - Add support for workflow status api

#### 0.1.2:

  - Add validations for all arguments
  - Update readme with more links to source reference

#### 0.1.1:

  - Found the `return_action` documentation - [MORE INFO](https://siftscience.com/resources/tutorials/formulas#add-actions)
  - Remove support for api version option - will only be supporting the most current version `v203`
  - Add validations for all init options

#### 0.1.0:

  - **BREAKING CHANGE:** Consolidate init args into one `options` arg - see [USAGE](#usage)
  - Add support for `return_action` in init options - [MORE INFO](https://siftscience.com/resources/tutorials/formulas#add-actions)
  - Add support for device fingerprinting api
  - Add support for partner api - **NOTE:** I do not have a partner account with sift science, this is untested. Please report any bugs.
  - Add `CONSTANTS` object to `siftscience` object for things like `$reasons` and `$shipping_method` - see [LABELS API](#labels-api)
  - Add express/body-parser webhook support
  - Add a minimal test package

#### 0.0.9:

  - Add `unlabel` method to `siftscience` object
