const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A name must be provided"],
  },
  likeAddresses: {
    type: [String],
    default: [],
  },
  likes: {
    type: Number,
    default: 0,
  },
});

const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
