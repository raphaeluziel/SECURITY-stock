'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var StockHandler = require('../controllers/stockHandler.js');
const request = require('request');
var rp = require('request-promise');
var mongoose = require('mongoose');

mongoose.connect(process.env.DB, { useNewUrlParser: true });

var Schema = mongoose.Schema;

var stockSchema = new Schema({
  stock: {type: String, required: true},
  likes: Number,
  price: Number,
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


      app.set('trust proxy',true);
           
      var like = 0;
      var likeCount;
      var stockData = [];
      var stockQuery = [];
        
      if(Array.isArray(req.query.stock)){
        stockQuery[0] = req.query.stock[0].toUpperCase();
        stockQuery[1] = req.query.stock[1].toUpperCase();
      }
      else{
        stockQuery[0] = req.query.stock.toUpperCase();
      }
    
    
    function updateDatabase(x, price){
      stockModel.findOne({stock: x}, function(err, data){
            if(err) { return console.log('error accessing database'); }
            if (req.query.like == 'true') { like = 1; } else { like = 0; }
            if(data) {
              
              if (data.ip.indexOf(ipAddress) === -1){
                  data.ip.push(ipAddress);
                  data.likes += like;
                  data.price = price;
              }
              data.save(function(err, data){
                console.log("UPDATED");
              });
            }
            if(!data) {
              var newStock = new stockModel({
                stock: x,
                likes: like,
                ip: ipAddress,
                price: price
              })
              newStock.save(function(err, data){
                console.log("SAVED NEW");
              });  
            }
          }); 
    }
    
    
    var getPrices = [];
    
    stockQuery.forEach(function(x, i){
      getPrices[i] = new Promise((resolve, reject) => {

        var link = 'https://api.iextrading.com/1.0/stock/' + stockQuery[i] + '/price';
        var options = {uri: link, headers: { 'User-Agent': 'Request-Promise' }, json: true }; 
        var likes;

        rp(options).then(function (price) { 
          
          
          stockModel.findOne({stock: x},  function(err, data){
            
            
            
            if(!data){
              updateDatabase(stockQuery[i], price);
              if (req.query.like == 'true') { likes = 1; } else { likes = 0; }
              stockData.push({stock: x, price: price, likes: likes});
              resolve({stock: x, price: price, likes: likes});
            }
            
            else{
              updateDatabase(stockQuery[i], price);
              likes = data.likes;  
              stockData.push({stock: x, price: price, likes: likes});
              resolve({stock: x, price: price, likes: likes});
            }
            
            
            
            
          });
          
          
          
        })
        
        
        
      });
    });
    
    
    
    
    
    
    Promise.all([getPrices[0], getPrices[1]]).then(values => { 
      

      
      if(stockData[1]) {
        
        var rel_likes = [stockData[0].likes - stockData[1].likes, stockData[1].likes - stockData[0].likes];
        
        stockData.forEach(function(x, i){
          x.rel_likes = rel_likes[i];
          delete x.likes;
        })
        
        res.json({stockData: stockData});
      
      }
      else {res.json({stockData: stockData[0]});}
      
      
    });
  
  
  });    
};
