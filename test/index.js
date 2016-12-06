var config      = require('./config.js');
var express     = require('express');
var bodyParser  = require('body-parser');

//In v204 of API return_action is deprecated in favor of return_score, return_workflow_status & abuse_types
var siftscience = require('../lib/app.js')({
  api_key:       config.api_key,
  account_id:    config.account_id,
  partner_id:    config.account_id,
  custom_events: ['custom_event_1', 'custom_event_2'],
  // return_action: true,
  return_score: true,
  return_workflow_status: true,
  abuse_types: ['payment_abuse', 'promo_abuse'],
  webhooks: {
    all: function(req, res, done) {
      console.log('all: ', req.body, '\n');
      done();
    },
    test: function(req, res, done) {
      console.log('test: ', req.body, '\n');
      done();
    },
    not: function(req, res, done) {
      console.log('not: ', req.body, '\n');
      done();
    }
  }
});

//
// Run a bunch of test requests
//

var session_id = '1',
    user_id    = '1';

function init() {
  create_account()
    .then(update_account)
    .then(login)
    .then(custom_event_1)
    .then(label)
    .then(score)
    .then(fingerprint_get_devices)
    .then(fingerprint_get_session)
    .then(fingerprint_get_device)
    .then(fingerprint_label_device)
    .then(partner_create_account)
    .then(partner_list_accounts)
    .then(partner_configure_notifications)
    .then(start_test_server)
  ;
}

init();

function create_account() {
  return siftscience.event.create_account({
    '$session_id': session_id,
    '$user_id':    user_id,
    '$user_email': 'test@email.com',
    '$name':       'Test',
    '$phone':      '123-456-7890'
  })
  .then(function(response) {
    console.log('CREATE ACCOUNT: ', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status], '\n\n', response, '\n');
  })
  .catch(function(err) {
    console.log('CREATE ACCOUNT ERROR: ', err, '\n');
    throw err;
  });
}

function update_account() {
  return siftscience.event.update_account({
    '$session_id': session_id,
    '$user_id':    user_id,
    '$user_email': 'test@email.com',
    '$name':       'Test',
    '$phone':      '123-456-7890'
  })
  .then(function(response) {
    console.log('UPDATE ACCOUNT: ', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status], '\n\n', response, '\n');
  })
  .catch(function(err) {
    console.log('UPDATE ACCOUNT ERROR: ', err, '\n');
    throw err;
  });
}

function login() {
  return siftscience.event.login({
    '$session_id':   session_id,
    '$user_id':      user_id,
    '$login_status': siftscience.CONSTANTS.STATUS.SUCCESS
  })
  .then(function(response) {
    console.log('LOGIN: ', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status], '\n\n', response, '\n');
  })
  .catch(function(err) {
    console.log('LOGIN ERROR: ', err, '\n');
    throw err;
  });
}

function custom_event_1() {
  return siftscience.event.custom_event_1({
    '$session_id': session_id,
    '$user_id':    user_id,
    'custom_1':    'custom 1',
    'custom_2':    'custom 2'
  })
  .then(function(response) {
    console.log('CUSTOM EVENT 1: ', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status], '\n\n', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('CUSTOM EVENT 1 ERROR: ', err, '\n');
    throw err;
  });
}

function label() {
  return siftscience.label(user_id, {
    '$description': 'Spamming and fraud',
    '$reasons':     [siftscience.CONSTANTS.REASON.CHARGEBACK, siftscience.CONSTANTS.REASON.SPAM],
    '$is_bad':      true
  })
  .then(function(response) {
    console.log('LABEL: ', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status], '\n\n', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('LABEL ERROR: ', err, '\n');
    throw err;
  });
}

function score() {
  return siftscience.score(user_id)
  .then(function(response) {
    console.log('SCORE: ', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status], '\n\n', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('SCORE ERROR: ', err, '\n');
    throw err;
  });
}

function fingerprint_get_devices() {
  return siftscience.fingerprint.get_devices(user_id)
  .then(function(response) {
    console.log('GET DEVICES: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('GET DEVICES ERROR: ', err, '\n');
    throw err;
  });
}

function fingerprint_get_session() {
  return siftscience.fingerprint.get_session(session_id)
  .then(function(response) {
    console.log('SESSION: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('SESSION ERROR: ', err, '\n');
    throw err;
  });
}

function fingerprint_get_device(_response) {
  return siftscience.fingerprint.get_device(_response.device.id)
  .then(function(response) {
    console.log('GET DEVICE: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('GET DEVICE ERROR: ', err, '\n');
    throw err;
  });
}

function fingerprint_label_device(_response) {
  return siftscience.fingerprint.label_device(_response.id, siftscience.CONSTANTS.DEVICE_LABEL.BAD)
  .then(function(response) {
    console.log('LABEL DEVICE: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('LABEL DEVICE ERROR: ', err, '\n');
    throw err;
  });
}

function partner_create_account() {
  return siftscience.partner.create_account({
    site_url:      'merchant123.com',
    site_email:    'owner@merchant123.com',
    analyst_email: 'john.doe@merchant123.com',
    password:      's0mepA55word'
  })
  .then(function(response) {
    console.log('CREATE PARTNER ACCOUNT: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('CREATE PARTNER ACCOUNT ERROR: ', err, '\n');
    throw err;
  });
}

function partner_list_accounts() {
  return siftscience.partner.list_accounts()
  .then(function(response) {
    console.log('LIST PARTNER ACCOUNTS: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('LIST PARTNER ACCOUNTS ERROR: ', err, '\n');
    throw err;
  });
}

function partner_configure_notifications() {
  return siftscience.partner.configure_notifications({
    email_notification_threshold: 0.5,
    http_notification_threshold:  0.5,
    http_notification_url:        'https://api.partner.com/notify?account=%s'
  })
  .then(function(response) {
    console.log('CONFIGURE NOTIFICATIONS: ', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.log('CONFIGURE NOTIFICATIONS ERROR: ', err, '\n');
    throw err;
  });
}

function start_test_server() {
  var app = express();

  app.get('/', function (req, res) {
    res.send('<!DOCTYPE html><head><script type="text/javascript">var _sift=_sift||[];_sift.push(["_setAccount","' + config.js_key + '"]);_sift.push(["_setSessionId","' + session_id + '"]);_sift.push(["_setUserId","' + user_id + '"]);_sift.push(["_trackPageview"]);(function(){function ls(){var e=document.createElement("script");e.type="text/javascript";e.async=true;e.src=("https:"==document.location.protocol?"https://":"http://")+"cdn.siftscience.com/s.js";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(e,s);}if(window.attachEvent){window.attachEvent("onload",ls);}else{window.addEventListener("load",ls,false);}})();</script></head><body><p>yield-siftscience test page</p></body></html>');
  });

  app.post('/siftscience', bodyParser.json(), siftscience.webhook.express());

  var server = app.listen(config.port, config.host, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Test app listening at http://' + host + ':' + port, '\n');
  });
}
