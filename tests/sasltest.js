
/*jshint globalstrict: true, node: true, trailing:true, unused:true, es5:true */

"use strict";

var LDAP = require('../LDAP');
var assert = require('assert');

var tests = [];

// Needs to be a server that supports SASL authentication with default 
// credentials (e.g. GSSAPI)
var gssapi_uri = process.env.TEST_SASL_GSSAPI_URI;

if(gssapi_uri) {

  tests.push({
    name: 'SASL bind with default credentials',
    description: 'Attempt a SASL bind',
    fn: function() {
	    var ldap = new LDAP({ uri: gssapi_uri });

      ldap.open(function(err) {
        assert(!err, 'Opening connection to ' + gssapi_uri);
        ldap.saslbind(function(err) {
          if(err) {
            console.error(err);
            assert(false, 'Default SASL bind to ' + gssapi_uri);
          }
          ldap.close();
          next();
        });
      })
    }
  });

}

// Does not need to support GSSAPI
var uri = process.env.TEST_SASL_URI || 'ldap://localhost:1234';

tests.push({
  name: 'SASL proxy user',
  fn: function() {
    var ldap = new LDAP({ uri: uri });

    ldap.open(function(err) {
      assert(!err, 'Opening connection to ' + uri);
      ldap.saslbind({ 
        mechanism: 'PLAIN', 
        user: 'test_user', 
        password: 'secret',
        proxy_user: 'u:test_admin',
        security_properties: 'none'
      }, function(err) {
          if(err) {
            console.error(err);
            assert(!err, 'SASL proxy user');
          }
          ldap.close();
          next();
      });
    });
  }
});

tests.push({
  name: 'SASL error handling - invalid proxy user',
  fn: function() {
    var ldap = new LDAP({ uri: uri });

    ldap.open(function(err) {
      assert(!err, 'Opening connection to ' + uri);
      ldap.saslbind({ 
        mechanism: 'PLAIN', 
        user: 'test_user', 
        password: 'secret',
        proxy_user: 'no_user',
        security_properties: 'none'
      }, function(err) {
          if(!err) {
            ldap.close();
          }
          assert(err, 'SASL invalid proxy');
          next();
      });
    });
  }
});

tests.push({
  name: 'SASL PLAIN bind',
  fn: function() {
    var ldap = new LDAP({ uri: uri });

    ldap.open(function(err) {
      assert(!err, 'Opening connection to ' + uri);
      ldap.saslbind({ 
        mechanism: 'PLAIN', 
        user: 'test_user', 
        password: 'secret',
        security_properties: 'none'
      }, function(err) {
          if(err) {
            console.error(err);
            assert(false, 'SASL plain bind');
          }
          ldap.close();
          next();
      });
    });
  }
});

tests.push({
  name: 'SASL error handling - bad password',
  fn: function() {
    var ldap = new LDAP({ uri: uri });

    ldap.open(function(err) {
      assert(!err, 'Opening connection to ' + uri);
      ldap.saslbind({ 
        mechanism: 'PLAIN', 
        user: 'test_user', 
        password: 'bad password',
        security_properties: 'none'
      }, function(err) {
          if(!err)
            ldap.close();
          assert(err, 'SASL plain bind with invalid password');
          next();
      });
    });
  }
});

tests.push({
  name: 'SASL error handling - mechanism',
  description: 'Attempt bind with an invalid SASL mechanism',
  fn: function() {
    var ldap = new LDAP({ uri: uri });

    ldap.open(function(err) {
      assert(!err, 'Opening connection to ' + uri);
      ldap.saslbind({ mechanism: 'INVALID' }, function(err) {
        ldap.close();
        assert(err, 'Invalid SASL mechanism');
        next();
      });
    })
  }
});

tests.push({
  name: 'SASL bind parameter error handling',
  description: 'Pass invalid parameters to saslbind',
  fn: function() {
    var ldap = new LDAP({ uri: uri });
    ldap.open(function(err) {
      assert(!err, 'Opening connection to ' + uri);
      try {
        ldap.saslbind({realm: 0}, function(err) {
          ldap.close();
          assert(false, 'Invalid saslbind parameter type');
        });
      } 
      catch(err) {
        ldap.close();
        next();
      }
    })
  }
});

var currenttest = {
    name: 'INIT',
    fn: next
}

function next() {
    console.log("%s%s%s", currenttest.name, 
      new Array(41).join(' ').substr(0, 41 - currenttest.name.length), '[OK]');

    currenttest = tests.pop();
    if (currenttest) {
        process.nextTick(currenttest.fn);
    }
}

console.log('');
next();
