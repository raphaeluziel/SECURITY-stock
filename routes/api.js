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
    
    //console.log(req.query);
    
      app.set('trust proxy',true);
      
      var stock = [];
      var like = 0;
      var likeCount;
        
      if(Array.isArray(req.query.stock)){
        stock[0] = req.query.stock[0].toUpperCase();
        stock[1] = req.query.stock[1].toUpperCase();
      }
      else{
        stock[0] = req.query.stock.toUpperCase();
      }
    
      //console.log(stock[0], stock[1]);

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

      var link = ['https://api.iextrading.com/1.0/stock/' + stock[0] + '/price', 
                  'https://api.iextrading.com/1.0/stock/' + stock[1] + '/price']
    
      var stockData = [{stock: stock[0], price: 0, likes: 0}, {stock: stock[1], price: 0, likes: 0}]; console.log(stockData);
        
        var options = {uri: link[0], headers: { 'User-Agent': 'Request-Promise' }, json: true };
        
        rp(options).then(function (price) { 
          stockData[0].price = price;
          
          console.log("STOCK!: ", stockData[1].stock);
          if(!stockData[1].stock){
            return res.json({stockData: {stock: stockData[0].stock, price: stockData[0].price, likes: stockData[0].likes}});
          }
          
          options = {uri: link[1], headers: { 'User-Agent': 'Request-Promise' }, json: true };
        
          rp(options).then(function (price) { 
            
            stockData[1].price = price;
            return res.json({stockData: stockData});
            
            
          }).catch(function (err) { res.send('stock does not exist'); });
        }).catch(function (err) { res.send('stock does not exist'); });
    
        
    
    });
    
};
