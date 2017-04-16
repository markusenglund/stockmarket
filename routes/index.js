const express = require("express")
const request = require("request")
const socketIO = require("socket.io")
const io = socketIO()


/*io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("user disconnected")
  })
  console.log("A user connected")
  socket.broadcast.emit("new data", "{data, stocks}")
})*/

const router = express.Router()
const URI = "https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json"
const Stock = require("../models/Stock.js")

const getRandomColor = () => {
  const letters = "3456789ABCDEF" //Nothing too dark
  let color = "#"
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * letters.length)]
  }
  return color
}


function getQuandlData(stocks, cb) {

  const currentDateString = new Date().toLocaleDateString().replace(/-/g, "")
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  const lastMonthString = date.toLocaleDateString().replace(/-/g, "")

  request({
    uri: URI,
    qs: {
      api_key: process.env.QUANDL_API_KEY,
      ticker: stocks.join(),
      "date.gte": lastMonthString,
      "date.lt": currentDateString,
      "qopts.columns": "ticker,date,open"
    }
  }, (err, response, body) => {
    cb(JSON.parse(body))
  })
}

function getStocksAndData(cb) {
  Stock.find({}, (err, docs) => {
    const stocks = docs.map(doc => doc.stock)
    getQuandlData(stocks, (data) => {
      cb(data, stocks)
    })
  })
}

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index.html")
})

router.get("/api/stocks", (req, res) => {
  getStocksAndData((data, stocks) => {
    res.send({data, stocks})
  })
})

io.on("connection", (socket) => {
  console.log("A user connected")
  socket.on("disconnect", () => {
    console.log("user disconnected")
  })
  socket.on("submit", (stockCode) => {
    getQuandlData([stockCode], (data) => {
      if (data.datatable.data.length === 0) {
        socket.emit("invalid", stockCode)
      } else {
        const stock = new Stock({ stock: stockCode })
        stock.save((err) => {
          if (err) throw err
          getStocksAndData((data, stocks) => {
            io.emit("success", { data, stocks })
          })
        })
      }
    })
  })
  socket.on("delete", (stockCode) => {
    Stock.findOneAndRemove({stock: stockCode}, (err, doc) => {
      console.log("Removed", doc)
      getStocksAndData((data, stocks) => {
        io.emit("success", { data, stocks })
      })
    })

  })
})

module.exports = { router, io }
