var config      = require('./config.js');
var siftscience = require('../lib/app.js')({
  api_key:       config.api_key,
  account_id:    config.account_id,
  custom_events: [ 'custom_event_1', 'custom_event_2' ],
  return_action: true
});

//
// CREATE ACCOUNT EVENT
//
siftscience.event.create_account({
  '$user_id':    '1',
  '$session_id': '1',
  '$user_email': 'test@email.com',
  '$name':       'Test',
  '$phone':      '123-456-7890'
})
.then(function(response) {
  console.log('CREATE ACCOUNT: ', response, '\n');

  //
  // UPDATE ACCOUNT EVENT
  //
  siftscience.event.update_account({
    '$user_id':    '1',
    '$session_id': '1',
    '$user_email': 'test@email.com',
    '$name':       'Test',
    '$phone':      '123-456-7890'
  })
  .then(function(response) {
    console.log('UPDATE ACCOUNT: ', response, '\n');

    //
    // LOGIN EVENT
    //
    siftscience.event.login({
      '$user_id':    '1',
      '$session_id': '1'
    })
    .then(function(response) {
      console.log('LOGIN: ', response, '\n');

      //
      // CUSTOM EVENT 1
      //
      siftscience.event.custom_event_1({
        '$user_id':      '1',
        '$session_id':   '1',
        'custom_prop_1': 'custom prop 1',
        'custom_prop_2': 'custom prop 2'
      })
      .then(function(response) {
        console.log('CUSTOM EVENT 1: ', response, '\n');

        //
        // LABEL USER
        //
        siftscience.label('1', {
          '$is_bad':      true,
          '$reasons':     [ siftscience.CONSTANTS.REASON.CHARGEBACK, siftscience.CONSTANTS.REASON.SPAM ],
          '$description': 'Spamming and fraud'
        })
        .then(function(response) {
          console.log('LABEL: ', response, '\n');

          //
          // SCORE USER
          //
          siftscience.score('1')
          .then(function(response) {
            console.log('SCORE: ', response, '\n');

            //
            // GET DEVICES
            //
            siftscience.fingerprint.getDevices('1')
            .then(function(response) {
              console.log('GET DEVICES: ', response, '\n');

              //
              // GET SESSION
              //
              siftscience.fingerprint.getSession('1')
              .then(function(response) {
                console.log('SESSION: ', response, '\n');

                //
                // GET DEVICE
                //
                if (response.device) {
                  siftscience.fingerprint.getDevice(response.device.id)
                  .then(function(response) {
                    console.log('GET DEVICE: ', response, '\n');

                    //
                    // LABEL DEVICE
                    //
                    siftscience.fingerprint.labelDevice(response.id, siftscience.CONSTANTS.DEVICE_LABEL.BAD)
                    .then(function(response) {
                      console.log('LABEL DEVICE: ', response, '\n');
                    })
                    .catch(function(err) {
                      console.log('LABEL DEVICE ERROR: ', err, '\n');
                      throw err;
                    });

                  })
                  .catch(function(err) {
                    console.log('GET DEVICE  ERROR: ', err, '\n');
                    throw err;
                  });
                }

              })
              .catch(function(err) {
                console.log('SESSION ERROR: ', err, '\n');
                throw err;
              });

            })
            .catch(function(err) {
              console.log('GET DEVICES ERROR: ', err, '\n');
              throw err;
            });

          })
          .catch(function(err) {
            console.log('SCORE ERROR: ', err, '\n');
            throw err;
          });

        })
        .catch(function(err) {
          console.log('LABEL ERROR: ', err, '\n');
          throw err;
        });

      })
      .catch(function(err) {
        console.log('CUSTOM EVENT 1 ERROR: ', err, '\n');
        throw err;
      });

    })
    .catch(function(err) {
      console.log('LOGIN ERROR: ', err, '\n');
      throw err;
    });

  })
  .catch(function(err) {
    console.log('UPDATE ACCOUNT ERROR: ', err, '\n');
    throw err;
  });

})
.catch(function(err) {
  console.log('CREATE ACCOUNT ERROR: ', err, '\n');
  throw err;
});
