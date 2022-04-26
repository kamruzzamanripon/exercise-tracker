const mongoose = require('mongoose');

const trackerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log : {
    type: Array,
    "default": []
  }
});

module.exports = mongoose.model("tracker", trackerSchema);