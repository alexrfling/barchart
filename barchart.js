function barchart(id, height, data) {
  const SVG_MARGINS = { top: 10, bottom: 10, left: 10, right: 10 };
  const AXIS_OFFSET = 5;
  const DATA_MAX = Math.max(...data.map(function(d) { return Math.abs(d.value); }));
  const BAR_COLORS = interpolateColors("#dc3912", "lightgrey", "#109618", 256);
  var BY_NAME = true;
  var DESCENDING = true;

  // clear out old DOM elements
  flushContents(id);

  var container = new SVGContainer(id, "barchart", "barchartSVG", resize, SVG_MARGINS, height);
  addDropShadowFilter(container.SVG, "shadow");

  container.resize();

  var labels = data.map(key);
  var w = container.svgWidth;
  var h = container.svgHeight;
  var svg = container.svg;

  // margins
  var xLabelsMargin = AXIS_OFFSET * 2;
  var yLabelsMargin = AXIS_OFFSET * 2;
  var xBarsMargin = w - xLabelsMargin - AXIS_OFFSET;
  var yBarsMargin = h - yLabelsMargin - AXIS_OFFSET;

  // scales for bar width/height and x/y axes
  var barHeightScale = d3.scaleBand().domain(labels)
                                     .range([0, yBarsMargin])
                                     .paddingInner(0.1)
                                     .paddingOuter(0.05);
  var barWidthScale = d3.scaleLinear().domain([0, DATA_MAX])
                                      .range([0, xBarsMargin / 2]);
  var xScale = d3.scaleLinear().domain([-DATA_MAX, DATA_MAX])
                	             .range([0, xBarsMargin]);
  var yScale = d3.scaleBand().domain(labels)
                	           .range([0, yBarsMargin]);
  var colorScale = d3.scaleQuantize().domain([-DATA_MAX, DATA_MAX])
                                     .range(BAR_COLORS);

  // axes for rows/columns (note that these ARE NOT yet added to the svg)
  var xAxis = d3.axisTop(xScale);

  // add the axes to the svg (add these before the bars so the bars will be on top)
  var xLabels = svg.append("g")
              		.attr("class", "axis").attr("id", "xticks")
                  .attr("transform", "translate(" + xLabelsMargin + "," + yLabelsMargin + ")")
                  .call(xAxis.tickSize(-yBarsMargin - AXIS_OFFSET, 0, 0));

  var bars = new Cells(svg, "bars", data, key,
    // -1 for pos bars -> no overlap on "0" center tick
    function(d) { return xScale(0) - (d.value < 0 ? barWidthScale(Math.abs(d.value)) : -1); },
    function(d) { return yScale(d.key); },
    function(d) { return barWidthScale(Math.abs(d.value)); },
    function(d) { return barHeightScale.bandwidth(); },
    function(d) { return colorScale(d.value); });
  var barLabels = new Labels(svg, "labels", "axis", labels, function() { return yBarsMargin; },
                            barHeightScale.step, false, 10, "left");

  // tooltip for bars
  var tip = d3.tip().attr("class", "d3-tip")
                    .direction(function(d) { return d.value < 0 ? 'e' : 'w'; })
                    .offset(function(d) { return d.value < 0 ? [0, 10] : [0, -10]; })
                    .html(function(d) {
                      return "<table>" +
                              "<tr><td>Variable</td><td>" + d.key + "</td></tr>" +
                              "<tr><td>Coefficient</td><td>" + round(d.value, 7) + "</td></tr>" +
                             "</table>";
                    });

  // invoke tooltip
  svg.call(tip);

  // add ids to labels so they can be bolded on hover
  barLabels.group.selectAll("text").attr("id", function() { return htmlEscape(this.innerHTML); });

  // bind event listeners
  bars.addListener("mouseover", function(d) {
    barLabels.group.select("#" + htmlEscape(d.key)).classed("bold", true);
    tip.show(d);
  });
  bars.addListener("mouseout", function(d) {
    barLabels.group.select("#" + htmlEscape(d.key)).classed("bold", false);
    tip.hide();
  });
  bars.addListener("click", sortBars);

  // last setup before initial bar transition
  marginsSetup(w, h);
  anchorsSetup(w, h);
  scalesSetup(w, h);
  positionAllElements();

  // vertical line next to textual lables at left
  svg.append("g")
    .attr("id", "labels")
    .attr("class", "axis")
    .append("path")
    .attr("d", "M " + barLabels.anchor[0] + " " + barLabels.anchor[1] + " L " + barLabels.anchor[0] + " " + h);

  // custom initialization + transition
  bars.selection.attr("x", xScale(0))
                .attr("y", function(d) { return yScale(d.key); })
                .attr("height", bars.attrs.height)
                .attr("width", 0)
                .attr("fill", "white");
  bars.selection.transition()
                .duration(1000)
                .delay(function(d, i) { return i * 25; })
                .attr("x", bars.attrs.x)
                .attr("width", bars.attrs.width)
                .attr("fill", bars.attrs.fill);

  function marginsSetup(w, h) {
    xLabelsMargin = Math.ceil(barLabels.getBox().width);
    yLabelsMargin = 10;
    xBarsMargin = w - xLabelsMargin - AXIS_OFFSET;
    yBarsMargin = h - yLabelsMargin - AXIS_OFFSET;
  }

  function anchorsSetup(w, h) {
    bars.anchor = [xLabelsMargin + AXIS_OFFSET, yLabelsMargin + AXIS_OFFSET];
    barLabels.anchor = [xLabelsMargin, yLabelsMargin + AXIS_OFFSET];
  }

  function scalesSetup(w, h) {
    barWidthScale.range([0, xBarsMargin / 2]);
    barHeightScale.range([0, yBarsMargin]);
    xScale.range([0, xBarsMargin]);
    yScale.range([0, yBarsMargin]);
  }

  function positionAllElements() {
    bars.position();
    barLabels.position();
    xLabels.attr("transform", "translate(" + (xLabelsMargin + AXIS_OFFSET) + "," + yLabelsMargin + ")")
          .call(xAxis.tickSize(-yBarsMargin - AXIS_OFFSET, 0, 0));
  }

  function updateVisAllElements() {
    bars.updateVis(["x", "y", "width", "height", "fill"]);
    xLabels.call(xAxis.tickSize(-yBarsMargin - AXIS_OFFSET, 0, 0));
    barLabels.updateVisNT();
  }

  function resize() {
    var updatedWidth = container.resize();
    marginsSetup(updatedWidth, h);
    anchorsSetup(updatedWidth, h);
    scalesSetup(updatedWidth, h);
    positionAllElements();
    updateVisAllElements();
  }

  function sortBars() {
    // hide the tooltip (visible on the bar that was clicked)
    tip.hide();

    // switch ordering
    BY_NAME = !BY_NAME;
    if (BY_NAME) DESCENDING = !DESCENDING;
    data = data.sort(function(a, b) {
      if (BY_NAME) {
        return DESCENDING ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
      } else {
        return DESCENDING ? a.value - b.value : b.value - a.value;
      }
    });

    // update ordering of labels
    labels = data.map(key);

    // scale/visual updates
    barHeightScale.domain(labels);
    yScale.domain(labels);
    bars.selection.transition()
                  .duration(1000)
                  .delay(function(d) { return 500 * Math.abs(d.value) / DATA_MAX; })
                  .attr("y", bars.attrs.y);
    barLabels.updateNames(labels);
    barLabels.updateVis(1000);
  }
}
