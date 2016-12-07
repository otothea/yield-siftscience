var config      = require('./config.js');
var express     = require('express');
var bodyParser  = require('body-parser');

//In v204 of API return_action is deprecated in favor of return_score, return_workflow_status & abuse_types
var siftscience = require('../lib/app.js')({
  api_key:                config.api_key,
  account_id:             config.account_id,
  partner_id:             config.account_id,
  custom_events:          ['custom_event_1', 'custom_event_2'],
  return_score:           true,
  return_workflow_status: true,
  abuse_types:            ['legacy'],
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

var session_id  = '1',
    user_id     = '1',
    workflow_id = '1';

function init() {
  create_account()
    .then(update_account)
    .then(login)
    .then(custom_event_1)
    .then(label)
    .then(unlabel)
    .then(decision_status)
    .then(workflow_status)
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
    console.log('CREATE ACCOUNT:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('CREATE ACCOUNT ERROR:', err);
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
    console.log('UPDATE ACCOUNT:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('UPDATE ACCOUNT ERROR:', err);
  });
}

function login() {
  return siftscience.event.login({
    '$session_id':   session_id,
    '$user_id':      user_id,
    '$login_status': siftscience.CONSTANTS.STATUS.SUCCESS
  })
  .then(function(response) {
    console.log('LOGIN:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('LOGIN ERROR:', err);
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
    console.log('CUSTOM EVENT 1:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('CUSTOM EVENT 1 ERROR:', err);
  });
}

function label() {
  return siftscience.label(user_id, {
    '$description': 'Spamming and fraud',
    '$abuse_type':  siftscience.CONSTANTS.ABUSE_TYPE.LEGACY,
    '$is_bad':      true
  })
  .then(function(response) {
    console.log('LABEL:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('LABEL ERROR:', err);
  });
}

function unlabel() {
  return siftscience.unlabel(user_id, siftscience.CONSTANTS.ABUSE_TYPE.LEGACY)
  .then(function(response) {
    console.log('UNLABEL:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('UNLABEL ERROR:', err);
  });
}

function decision_status() {
  return siftscience.decision.status('users', user_id)
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('DECISION STATUS: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('DECISION STATUS ERROR:', err);
  });
}

function workflow_status() {
  return siftscience.workflow.status(workflow_id)
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('WORKFLOW STATUS: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('WORKFLOW STATUS ERROR:', err);
  });
}

function score() {
  return siftscience.score(user_id)
  .then(function(response) {
    console.log('SCORE:', siftscience.CONSTANTS.RESPONSE_STATUS_MESSAGE[response.status]);
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('SCORE ERROR:', err);
  });
}

function fingerprint_get_devices() {
  return siftscience.fingerprint.get_devices(user_id)
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('GET DEVICES: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('GET DEVICES ERROR:', err);
  });
}

function fingerprint_get_session() {
  return siftscience.fingerprint.get_session(session_id)
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('SESSION: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.error('SESSION ERROR:', err);
  });
}

function fingerprint_get_device(_response) {
  return siftscience.fingerprint.get_device(_response.device.id)
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('GET DEVICE: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
    return response;
  })
  .catch(function(err) {
    console.error('GET DEVICE ERROR:', err);
  });
}

function fingerprint_label_device(_response) {
  return siftscience.fingerprint.label_device(_response.id, siftscience.CONSTANTS.DEVICE_LABEL.BAD)
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('LABEL DEVICE: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .then(function() {
    return siftscience.fingerprint.label_device(_response.id, siftscience.CONSTANTS.DEVICE_LABEL.NOT_BAD)
  })
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('UNLABEL DEVICE: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('LABEL DEVICE ERROR:', err);
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
    if (response.error)
      throw response.description;
    console.log('CREATE PARTNER ACCOUNT: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('CREATE PARTNER ACCOUNT ERROR:', err);
  });
}

function partner_list_accounts() {
  return siftscience.partner.list_accounts()
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('LIST PARTNER ACCOUNTS: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('LIST PARTNER ACCOUNTS ERROR:', err);
  });
}

function partner_configure_notifications() {
  return siftscience.partner.configure_notifications({
    email_notification_threshold: 0.5,
    http_notification_threshold:  0.5,
    http_notification_url:        'https://api.partner.com/notify?account=%s'
  })
  .then(function(response) {
    if (response.error)
      throw response.description;
    console.log('CONFIGURE NOTIFICATIONS: Success');
    if (config.verbose)
      console.log('\n', response, '\n');
  })
  .catch(function(err) {
    console.error('CONFIGURE NOTIFICATIONS ERROR:', err);
  });
}

function start_test_server() {
  var app = express();

  app.get('/', function (req, res) {
    res.send('<!DOCTYPE html><head><script type="text/javascript">var _sift=window._sift=window._sift||[];_sift.push(["_setAccount","' + config.js_key + '"]);_sift.push(["_setSessionId","' + session_id + '"]);_sift.push(["_setUserId","' + user_id + '"]);_sift.push(["_trackPageview"]);(function(){function ls(){var e=document.createElement("script");e.src="https://cdn.siftscience.com/s.js";document.body.appendChild(e);}if(window.attachEvent){window.attachEvent("onload",ls);}else{window.addEventListener("load",ls,false);}})();</script></head><body><p>yield-siftscience test page</p></body></html>');
  });

  app.post('/siftscience', bodyParser.json(), siftscience.webhook.express());

  var server = app.listen(config.port, config.host, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('\nTest app listening at http://' + host + ':' + port, '\n');
  });
}
