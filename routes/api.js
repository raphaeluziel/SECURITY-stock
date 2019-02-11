/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var StockHandler = require('../controllers/stockHandler.js');
const request = require('request');
var rp = require('request-promise');
var mongoose = require('mongoose');

//const CONNECTION_STRING = process.env.DB; 
//MongoClient.connect(CONNECTION_STRING, function(err, db) {});

mongoose.connect(process.env.DB, { useNewUrlParser: true });

var Schema = mongoose.Schema;

var stockSchema = new Schema({
  stock: {type: String, required: true},
  likes: Number,
  ip: [{type: String, required: true}]
});

var stockModel = mongoose.model('stockModel', stockSchema);

module.exports = function (app) {
  
  var ipAddress;

  app.use(function(req, res, next){
    app.set('trust proxy', true);
    ipAddress = req.ip;
    next();
  });
  
  
  app.route('/api/stock-prices')
    .get(function (req, res){
    
    console.log(req.query);
    
      app.set('trust proxy',true);
    
      var like = 0;
      var likeCount;
      var stock = req.query.stock.toUpperCase();
      if (req.query.like == 'true') { like = 1; } else { like = 0; }
      
      stockModel.findOne({stock: stock}, function(err, data){
        if(err) { return console.log('error accessing database'); }
        if(data) {
          if (req.query.like == 'true') { like = 1; } else { like = 0; }
          if (data.ip.indexOf(ipAddress) === -1){
            data.ip.push(ipAddress);
            data.likes += like;     
          }
          data.save(function(err, data){
            likeCount = data.likes;
          });
        }
        if(!data) {
          var newStock = new stockModel({
            stock: stock,
            likes: like,
            ip: ipAddress
          })
          newStock.save(function(err, data){
            likeCount = data.likes;
          });  
        }

      });

      var link = 'https://api.iextrading.com/1.0/stock/' + req.query.stock + '/price';
    
      var options = {
        uri: link,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
      };

      rp(options)
        .then(function (price) {
            res.json({stockData: {stock: req.query.stock.toUpperCase(), price: price, likes: likeCount}});
          })
        .catch(function (err) {
        // API call failed...
      });
    
    });
    
};
