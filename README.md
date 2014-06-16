Yield Sift Science - NodeJS
===

A promise-wrapped helper lib for yielding Sift Science API calls in nodejs.

Also supports regular [callbacks](#callbacks).

## Installation

####Using [npm](https://npmjs.org):
```bash
$ npm install yield-siftscience
```

## Usage

####Require with [API key](https://siftscience.com/console/api-keys):
```js
// Default version
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY');

// For a specific siftscience API version
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY', 'v203');
```

####Send Event:
```js
var create_account = yield siftscience.event.create_account({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com'
});
console.log(create_account);

var login = yield siftscience.event.login({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$login_status': '$success'
});
console.log(login);
```

####Send Generic Custom Event:
```js
var submit_comment = yield siftscience.event.custom_event('submit_comment', {
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com',
  'content': 'blah blah blah comment'
});
console.log(submit_comment);

var delete_account = yield siftscience.event.custom_event('delete_account', {
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345'
});
console.log(delete_account);
```

####Inject Custom Events:

Optionally, you can pass in an array of custom event names to add to the lib

```js
var custom_events = ['submit_comment', 'delete_account', ...];
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY', null, custom_events);
```

Then you could use

```js
var submit_comment = yield siftscience.event.submit_comment({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com',
  'content': 'blah blah blah comment'
});
console.log(submit_comment);

var delete_account = yield siftscience.event.delete_account({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
});
console.log(delete_account);
```

####Send Label:
```js
var result = yield siftscience.label('user_id', {
  '$is_bad': true,
  '$reasons': [ '$spam', '$chargeback' ],
  '$description': 'Because they are spamming and abusing our system'
});
console.log(result);
```

####Get Score:
```js
var score = yield siftscience.score('user_id');
console.log(score);
```

## Callbacks

####Don't know what yielding or promising is? Do it with a regular callback:
```js
var callback = function(_err, _response) {
  if (_err) {
    console.log(_err);
  }
  else {
    var score = _response.body;
    console.log(score);
  }
};
siftscience.score('user_id', callback);
```

####You can also inject a global callback for all requests:
```js
var global_callback = function(_err, _response) {
  if (_err) {
    console.log(_err);
  }
  else {
    var result = _response.body;
    console.log(result);
  }
};
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY', null, null, global_callback);
```

## More Documentation

[yield-siftscience/lib/app.js](https://github.com/otothea/yield-siftscience/blob/master/lib/app.js)

## Sift Science Documentation

[siftscience.com/docs](https://siftscience.com/docs)
