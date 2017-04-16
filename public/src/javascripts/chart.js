import * as d3 from "d3"
import chunk from "lodash/chunk"

const width = 1000
const height = 700
const margin = { top: 100, right: 50, bottom: 50, left: 70 }

const getRandomColor = () => {
  const letters = "3456789ABCDEF" //Nothing too dark
  let color = "#"
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * letters.length)]
  }
  return color
}

document.addEventListener("DOMContentLoaded", () => {

  const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

  //Append y-axis description
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 2)
    .attr("x", -height /  2)
    .style("text-anchor", "middle")
    .text("Price per share ($)")

  //Set scales
  const timeScale = d3.scaleTime()
    .range([0, width - margin.right - margin.left])
  const yScale = d3.scaleLinear()
    .range([height - margin.bottom - margin.top, 0])

  //Set gridlines
  const gridlines = d3.axisLeft(yScale)
    .ticks(10)
    .tickFormat("")
    .tickSize(-width + margin.left + margin.right)
  g.append("g")
    .attr("class", "gridlines")
    .call(gridlines)

  //Set line
  const line = d3.line()
    .x(d => timeScale(new Date(d[1])))
    .y(d => yScale(d[2]))

  //Set axes
  //FIXME: time descriptions should be moved to the right, also they look awful
  const xAxis = d3.axisBottom(timeScale)
  g.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)
    .call(xAxis)
  const yAxis = d3.axisLeft(yScale)
  g.append("g")
    .call(yAxis)

  //Set vertical line
  const verticalLine = g.append("line")
    .attr("id", "vertical-line")
    .attr("y1", 0)
    .attr("y2", height - margin.top - margin.bottom)

  //set bisector
  const bisector = d3.bisector(d => new Date(d[1])).left

  //Set invisible overlay that takes up the space inside the graph. It is used for the tooltip so that it doesn't show outside the graph-area.
  const overlay = g.append("rect")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseover", () => {
      toolTip.style("display", "inline")
      verticalLine.style("display", "inline")
    })
    .on("mouseout", () => {
      toolTip.style("display", "none")
      verticalLine.style("display", "none")
    })

  //Set tooltip
  const toolTip = d3.select("#chart").append("div")
    .attr("class", "tooltip")

  /*
    API CALL HERE!
  */
  d3.json("/api/stocks", (err, json) => {
    console.log(json)
    applyData(json)
  })

  function applyData(json) {
    const data = json.data.datatable.data
    //Set domains for scales
    timeScale.domain([new Date(data[0][1]), new Date(data[data.length - 1][1])])
    yScale.domain([0, d3.max(data, d => d[2])])

    //Divides the data into many arrays instead of one. One array for every stock.
    const dividedData = chunk(data, data.length / json.stocks.length)
    const lineColors = []

    dividedData.forEach((lineData, i) => {
      lineColors.push(getRandomColor())

      const path = line(lineData)
      g.append("path")
        .attr("class", "line")
        .attr("d", path)
        .attr("stroke", lineColors[i])
      })

    //Dynamically change tooltip and vertical line as the mouse moves
    overlay.on("mousemove", function() {
      const date = timeScale.invert(d3.mouse(this)[0])
      let html = ""
      dividedData.forEach((lineData, i) => {
        const index = bisector(lineData, date)

        //If the position of the cursor is closer to the earlier date than the next date, the earlier date is used for the tooltip
        let closestIndex = index
        if (lineData[index - 1]) {
          if (new Date(lineData[index][1]) - date > date - new Date(lineData[index - 1][1])) {
            closestIndex = index - 1
          }
        }
        const dataPoint = lineData[closestIndex]
        if (i === 0) {
          html += `<h3>${new Date(dataPoint[1]).toDateString()}</h3>`
          verticalLine.attr("x1", timeScale(new Date(dataPoint[1])))
            .attr("x2", timeScale(new Date(dataPoint[1])))
        }
        html += `<br><div class="tooltip-text" style="background-color:${lineColors[i]};">${dataPoint[0]}: ${dataPoint[2]}</div>`
      })
      toolTip.html(html)
      toolTip.style("left", d3.mouse(this)[0] + margin.left - 75 + "px")
        .style("top", d3.mouse(this)[1] + margin.top + 20 + "px")
    })
  }

  function update(data) {

  }
})
