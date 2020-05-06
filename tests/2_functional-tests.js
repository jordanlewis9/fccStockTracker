/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");
const Stock = require("./../model/stockModel");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("GET /api/stock-prices => stockData object", function () {
    test("1 stock", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "goog" })
        .end(function (err, res) {
          //complete this one too
          console.log(res.body);
          assert.equal(res.body.stockData.stock, "goog", "Name is correct");
          assert.isString(res.body.stockData.price, "Price is a string");
          assert.isNumber(res.body.stockData.likes, "Likes exist");
          done();
        });
    });

    test("1 stock with like", function (done) {
      chai
        .request(server)
        .post("/api/stock-prices")
        .query({ stock: "coke", like: true })
        .end(function (err, res) {
          console.log(res.body);
          assert.equal(res.body.stockData.stock, "coke", "Name is correct");
          assert.isNumber(res.body.stockData.likes, "Likes is a number");
          assert.equal(res.body.stockData.likes, 1, "Likes has 1 like");
          done();
        });
    });

    test("1 stock with like again (ensure likes arent double counted)", function (done) {
      chai
        .request(server)
        .post("/api/stock-prices")
        .query({ stock: "coke", like: true })
        .end(async function (err, res) {
          assert.equal(res.body.status, "fail", "Fail status sent");
          assert.equal(
            res.body.message,
            "Only one like of this stock per IP address is allowed",
            "Fail message sent"
          );
          assert.equal(res.status, "400", "Fail status code correct");
          const deleteCoke = await Stock.deleteOne({ name: "coke" });
          done();
        });
    });

    test("2 stocks", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices?stock=goog&stock=aapl")
        .end(function (err, res) {
          assert.isArray(res.body.stockData, "stockData is an array");
          console.log(res.body.stockData);
          const stockGoog = res.body.stockData[0];
          const stockAapl = res.body.stockData[1];
          assert.equal(stockGoog.stock, "goog", "Stock goog name correct");
          assert.isString(
            stockGoog.price,
            "Stock goog price is String and exists"
          );
          assert.equal(
            stockGoog.rel_likes,
            -1,
            "Stock goog rel_likes is correct"
          );
          assert.equal(stockAapl.stock, "aapl", "Stock aapl name correct");
          assert.isString(
            stockAapl.price,
            "Stock aapl price is String and exists"
          );
          assert.equal(
            stockAapl.rel_likes,
            1,
            "Stock aapl rel_likes is correct"
          );
          done();
        });
    });

    test("2 stocks with like", function (done) {
      chai
        .request(server)
        .post("/api/stock-prices?stock=msft&stock=amzn&like=true")
        .end(async function (err, res) {
          assert.isArray(res.body.stockData, "stockData is an array");
          assert.equal(res.body.stockData[0].stock, "msft", "MSFT shows up");
          assert.isString(
            res.body.stockData[0].price,
            "Stock msft price is String and exists"
          );
          assert.equal(
            res.body.stockData[0].rel_likes,
            0,
            "msft rel_likes exists and is 0"
          );
          assert.equal(res.body.stockData[1].stock, "amzn", "AMZN shows up");
          assert.isString(
            res.body.stockData[1].price,
            "Stock amzn price is String and exists"
          );
          assert.equal(
            res.body.stockData[1].rel_likes,
            0,
            "amzn rel_likes exists and is 0"
          );
          const msftDelete = await Stock.deleteOne({ name: "msft" });
          const amznDelete = await Stock.deleteOne({ name: "amzn" });
          done();
        });
    });
  });
});
