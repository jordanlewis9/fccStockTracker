/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var request = require("request");
const axios = require("axios");
const stockHandler = require("./../controllers/stockHandler");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

// 1 Fix the post stock schema middleware
// Did not work when there was no stock saved to the DB.
// 2 Decide whether I'm saving the price when last looked up to the DB
// No. This would require a separate API call, along with saving it to the DB every time. Slows the UX down
// 3 Figure out the number going into an array and not changing when adding a like

module.exports = (app) => {
  app
    .route("/api/stock-prices")
    .get(stockHandler.getStock)
    .post(stockHandler.addLike);
};
