/**
 * Created by glickm on 11/10/15.
 */
var pg = require('pg');
var CryptoJS = require('crypto-js');
var feeCalculator = require('amazon_fba_fee_calculator');
var MwsFacade = require('../facades/mws-facade');

var conString = process.env.POSTGRES_STRING;

exports.calculate = function (req, res) {
  console.log(req);
  // check to see if they supplied the API Key, ASIN and Sell price
  if(req.body.APIKey &&
      req.body.ASIN &&
      req.body.sellPrice) {
    pg.connect(conString, function(err, client, done) {
      if(err) {
        sendError(res, 400, "error fetching client from pool");
      }

      client.query('SELECT encrypted_data FROM api_keys WHERE api_key = $1', [req.body.APIKey], function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if(err) {
          sendError(res, 400, "Error running query")
        }

        if(result.rowCount == 1) {
          decryptAndCheck(req, res, result.rows[0].encrypted_data);
        } else {
          sendError(res, 404, "API Key is not valid");
        }
      });
    });
  } else {
    sendError(res, 404, "Missing Params")
  }
};

function decryptAndCheck(req, res, ciphertext) {
  var bytes  = CryptoJS.AES.decrypt(ciphertext, process.env.PRIVATE_KEY);
  var amazonCredentials = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  var facade = new MwsFacade(amazonCredentials.merchantId, amazonCredentials.marketplaceId, amazonCredentials.accessKeyId, amazonCredentials.secretAccessKey);

  facade.getSalesRank(req.body.ASIN, function (results) {
    if(results) {
      feeCalculator.calculateFee(req.body.sellPrice, results.category, results.weight, results.dimensions, function (fees) {
        res.status(200);
        res.send({
          success: true,
          fees: fees
        });
      });
    } else {
      sendError(res, 400, "Couldn't find details");
    }
  })
}

function sendError(res, statusCode, message) {
  res.status(statusCode);
  res.send({
    success: false,
    message: message
  });
}