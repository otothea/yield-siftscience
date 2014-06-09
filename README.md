Yield Sift Science
===

A promise-wrapped helper lib for yielding Sift Science API calls

### Installation

Using [npm](https://npmjs.org):

```bash
$ npm install otothea/yield-siftscience
```

### Usage

```js
var siftscience = require('yield-siftscience')('YOUR_SIFT_SCIENCE_API_KEY');
```

Send Event:
```js
var result = yield siftscience.event.create_account({
  '$session_id': 'abcdefghijklmnopqrstuvwxyz',
  '$user_id': '12345',
  '$user_email': 'example@email.com'
});
console.log(result);
```

Send Label:
```js
var result = yield siftscience.label('user_id', {
  '$is_bad': true,
  '$reasons': [ '$spam', '$chargeback' ],
  '$description': 'Because they are spamming and abusing our system'
});
```

Get Score:
```js
var score = yield siftscience.score('user_id');
console.log(score);
```

### Sift Science Documentation

[siftscience.com](https://siftscience.com/docs)