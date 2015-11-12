/**
 * Created by glickm on 11/10/15.
 */
var mws = require('mws-js');
var config = require('config');
var categoryConversion = require('../constants/category-conversion');
var _ = require('lodash');

module.exports = function MwsFacade(merchantId, marketplaceId, accessKeyId, secretAccessKey) {
  var client = new mws.products.Client({
    locale: 'US',
    merchantId: merchantId,
    marketplaceId: marketplaceId,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  });

  // returns the status of the service
  this.getServiceStatus = function (callback) {
    // Get the service status of Sellers API endpoint and print it
    client.getServiceStatus(function (results) {
      return callback(results);
    });
  };

  this.checkAccount = function (callback) {
    client.getCompetitivePricingForASIN("B00COK3FD8", function (results) {
      if(results.responseType === "GetCompetitivePricingForASIN") {
        callback(true);
      } else {
        callback(false);
      }
    })
  };

  // returns the category and sales rank of a product based on the ASIN
  this.getSalesRank = function (asin, callback) {
    client.getMatchingProductForId('ASIN', asin, function(res){
      if (res.error) {
        console.error(res.error);
      } else if (res.result['@'].status === "Success") {
        if(res.result.Products.Product.SalesRankings.SalesRank) {
          if(Array.isArray(res.result.Products.Product.SalesRankings.SalesRank)) {
            var category = res.result.Products.Product.SalesRankings.SalesRank[0];
            // this will only check the first category of all of them. i dont like this. need to figure out a way to check them all.

            //res.result.Products.Product.SalesRankings.SalesRank.forEach(function (category) {
            if (_.values(categoryConversion.conversions).indexOf(category.ProductCategoryId) > 0 &&
              res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions'] &&
              res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Weight']) {
              return callback({
                category: _.keys(categoryConversion.conversions)[_.values(categoryConversion.conversions).indexOf(category.ProductCategoryId)],
                rank: category.Rank,
                dimensions: [
                  res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Height']['#'],
                  res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Length']['#'],
                  res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Width']['#']
                ],
                weight: res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Weight']['#']
              });
            } else {
              callback(false);
              //});
            }
          } else {
            var category = res.result.Products.Product.SalesRankings.SalesRank;

            if (_.values(categoryConversion.conversions).indexOf(category.ProductCategoryId) > 0) {
              return callback({
                category: _.keys(categoryConversion.conversions)[_.values(categoryConversion.conversions).indexOf(category.ProductCategoryId)],
                rank: category.Rank,
                dimensions: [
                  res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Height']['#'],
                  res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Length']['#'],
                  res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Width']['#']
                ],
                weight: res.result.Products.Product.AttributeSets['ns2:ItemAttributes']['ns2:PackageDimensions']['ns2:Weight']['#']
              });
            } else {
              callback(false);
            }
          }
        } else {
          callback(false);
        }
      }
    });
  };
};



