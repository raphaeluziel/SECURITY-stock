/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

var likeCount = 0;

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {   
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'NFLX'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'NFLX');
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'NFLX', like: 'true'})
        .end(function(err, res){
          
          console.log("POL", res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'NFLX');
          assert.isAbove(res.body.stockData.likes, 0);
          likeCount = res.body.stockData.likes;
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'NFLX', like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'NFLX');
          assert.equal(res.body.stockData.likes, likeCount);
          done();
        });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['NFLX', 'GOOG']})
        .end(function(err, res){
          console.log("RES>BODY", res.body);
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['NFLX', 'GOOG'], like: 'true'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          done();
        });
      });
      
    });

});
