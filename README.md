Yield Sift Science
===

A promise-wrapped helper lib for yielding Sift Science API calls.

Also supports regular callback functions.

## Installation

**Using [npm](https://npmjs.org):**
```bash
$ npm install yield-siftscience
```

## Usage

**Require with [API key](https://siftscience.com/console/api-keys):**
```js
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY');
```

**Send Event:**
```js
var result = yield siftscience.event.create_account({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com'
});
console.log(result);
```

**Send Generic Custom Event:**
```js
var score = yield siftscience.custom_event('submit_comment', {
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com',
  'content': 'blah blah blah comment'
});
console.log(score);
```

**Inject Custom Events:**

Optionally, you can pass in an array of custom event names to add to the lib

```js
var custom_events = ['submit_comment', ...];
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY', null, custom_events);
```
Then you could use
```js
var result = yield siftscience.event.submit_comment({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com',
  'content': 'blah blah blah comment'
});
console.log(result);
```

**Send Label:**
```js
var result = yield siftscience.label('user_id', {
  '$is_bad': true,
  '$reasons': [ '$spam', '$chargeback' ],
  '$description': 'Because they are spamming and abusing our system'
});
console.log(result);
```

**Get Score:**
```js
var score = yield siftscience.score('user_id');
console.log(score);
```

**Don't know what yielding or promising is? Do it with a regular callback:**
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

**You can also inject a global callback for all requests:**
```js
var global_callback = function(_err, _response) {
  if (_err) {
    console.log(_err);
  }
  else {
    var score = _response.body;
    console.log(score);
  }
};
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_REST_API_KEY', null, null, global_callback);
```

## More Documentation

[yield-siftscience/lib/app.js](https://github.com/otothea/yield-siftscience/blob/master/lib/app.js)

## Sift Science Documentation

[siftscience.com/docs](https://siftscience.com/docs)
