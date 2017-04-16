const mongoose = require("mongoose")

const schema = new mongoose.Schema({
  stock: String
})

module.exports = mongoose.model("Stock", schema)
