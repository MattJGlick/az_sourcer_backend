/**
 * Created by glickm on 11/10/15.
 */
var uuid = require('node-uuid');
var MwsFacade = require('../facades/mws-facade');
var CryptoJS = require('crypto-js');

var pg = require('pg');

var conString = process.env.POSTGRES_STRING;

exports.create = function (req, res) {
  // check to see if they have the right params first
  if(req.body.merchantId &&
      req.body.marketplaceId &&
      req.body.accessKeyId &&
      req.body.secretAccessKey) {
    // check their account
    checkMWSAccount(req, res)
  } else {
    sendError(res, 404, "Missing Params");
  }
};

function checkMWSAccount(req, res) {
  var merchantId = req.body.merchantId;
  var marketplaceId = req.body.marketplaceId;
  var accessKeyId = req.body.accessKeyId;
  var secretAccessKey = req.body.secretAccessKey;

  var facade = new MwsFacade(merchantId, marketplaceId, accessKeyId, secretAccessKey);
console.log(facade);
  facade.checkAccount(function (isValid) {
    if(isValid) {
      // generate a new code
      insertIntoTable(req, res);
    } else {
      sendError(res, 404, "The supplied Amazon API Credentials were not valid.");
    }
  });
}

function insertIntoTable (req, res) {
  var APIKey = uuid.v4();

  var credentials = {
    merchantId: req.body.merchantId,
    marketplaceId: req.body.marketplaceId,
    accessKeyId: req.body.accessKeyId,
    secretAccessKey: req.body.secretAccessKey
  };

  var encryptedData = CryptoJS.AES.encrypt(JSON.stringify(credentials), process.env.PRIVATE_KEY).toString();

  pg.connect(conString, function(err, client, done) {
    if(err) {
      sendError(res, 400, "error fetching client from pool");
    }

    client.query('INSERT INTO api_keys (api_key, encrypted_data) VALUES ($1, $2)', [APIKey, encryptedData], function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        sendError(res, 400, "Error running query")
      }

      if(result.rowCount == 1) {
        res.send({
          success: true,
          APIKey: APIKey
        });
      } else {
        sendError(res, 400, "Error Inserting the API Key into the DB")
      }
    });
  });
}

function sendError(res, statusCode, message) {
  res.status(statusCode);
  res.send({
    success: false,
    message: message
  });
}