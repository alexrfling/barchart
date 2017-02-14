/*
              marginXLabel                      marginXChart
             +------------+----------------------------------------------------+
marginYLabel |            |                                                    |
             +------------+----------------------------------------------------+
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
marginYChart |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             +------------+----------------------------------------------------+
*/
function barchart (id, height, data, negColor, posColor) {
    const SVG_MARGINS = { top: 10, bottom: 10, left: 10, right: 10 };
    const AXIS_OFFSET = 5;
    const DATA_MAX = Math.max(...data.map(function (d) { return Math.abs(d.value); }));
    const BAR_COLORS = interpolateColors(negColor || '#dc3912', 'lightgrey', posColor || '#109618', 256);
    var BY_NAME = true;
    var DESCENDING = true;

    // clear out old DOM elements
    flushContents(id);

    var container = new SVGContainer(id, 'barchart', 'barchartSVG', resize, SVG_MARGINS, height);
    addDropShadowFilter(container.SVG, 'shadow');

    container.resize();

    var labels = data.map(key);
    var w = container.svgWidth;
    var h = container.svgHeight;
    var svg = container.svg;

    // margins
    var marginXLabel = AXIS_OFFSET * 2;
    var marginYLabel = AXIS_OFFSET * 2;
    var marginXChart = w - marginXLabel - AXIS_OFFSET;
    var marginYChart = h - marginYLabel - AXIS_OFFSET;

    // scales for bar x, y, width, height, and fill
    var scaleX      = d3.scaleLinear()
                        .domain([-DATA_MAX, DATA_MAX])
                  	    .range([0, marginXChart]);
    var scaleY      = d3.scaleBand()
                        .domain(labels)
                  	    .range([0, marginYChart]);
    var scaleWidth  = d3.scaleLinear()
                        .domain([0, DATA_MAX])
                        .range([0, marginXChart / 2]);
    var scaleHeight = d3.scaleBand()
                        .domain(labels)
                        .range([0, marginYChart])
                        .paddingInner(0.1)
                        .paddingOuter(0.05);
    var scaleFill   = d3.scaleQuantize()
                        .domain([-DATA_MAX, DATA_MAX])
                        .range(BAR_COLORS);

    // axes for rows/columns (note that these ARE NOT yet added to the svg)
    var xAxis = d3.axisTop(scaleX);

    // add the axes to the svg (add these before the bars so the bars will be on top)
    var xLabels = svg.append('g')
                    .attr('id', 'xticks')
                    .attr('class', 'axis')
                    .attr('transform', 'translate(' + marginXLabel + ',' + marginYLabel + ')')
                    .call(xAxis.tickSize(-marginYChart - AXIS_OFFSET, 0, 0));

    // bars
    var bars = new Cells(svg, 'bars', data, key,
      // -1 for pos bars -> no overlap on '0' center tick
      function (d) { return scaleX(0) - (d.value < 0 ? scaleWidth(Math.abs(d.value)) : -1); },
      // add half of (step - bandwidth) to account for paddingInner/Outer
      function (d) { return scaleY(d.key) + (scaleHeight.step() - scaleHeight.bandwidth()) / 2; },
      function (d) { return scaleWidth(Math.abs(d.value)); },
      function (d) { return scaleHeight.bandwidth(); },
      function (d) { return scaleFill(d.value); });

    // labels at left
    var barLabels = new Labels(svg, 'labels', 'axis', labels, function () { return marginYChart; },
                              scaleHeight.step, false, 10, 'left');

    // tooltip for bars
    var tip = d3.tip().attr('class', 'd3-tip')
                      .direction(function (d) { return d.value < 0 ? 'e' : 'w'; })
                      .offset(function (d) { return d.value < 0 ? [0, 10] : [0, -10]; })
                      .html(function (d) {
                          return '<table>' +
                                  '<tr><td>Variable</td><td>' + d.key + '</td></tr>' +
                                  '<tr><td>Coefficient</td><td>' + round(d.value, 7) + '</td></tr>' +
                                 '</table>';
                      });

    // invoke tooltip
    svg.call(tip);

    // add ids to labels so they can be bolded on hover
    barLabels.group.selectAll('text').attr('id', function () { return htmlEscape(this.innerHTML); });

    // bind event listeners
    bars.addListener('mouseover', function (d) {
        barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', true);
        tip.show(d);
    });
    bars.addListener('mouseout', function (d) {
        barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', false);
        tip.hide();
    });
    bars.addListener('click', sortBars);

    // last setup before initial bar transition
    marginsSetup(w, h);
    anchorsSetup(w, h);
    scalesSetup(w, h);
    positionAllElements();

    // vertical line next to textual lables at left
    svg.append('g')
      .attr('id', 'labels')
      .attr('class', 'axis')
      .append('path')
      .attr('d', 'M ' + barLabels.anchor[0] + ' ' + barLabels.anchor[1] + ' L ' + barLabels.anchor[0] + ' ' + h);

    // custom initialization + transition
    bars.selection.attr('x', scaleX(0))
                  .attr('y', bars.attrs.y)
                  .attr('height', bars.attrs.height)
                  .attr('width', 0)
                  .attr('fill', 'white');
    bars.selection.transition()
                  .duration(1000)
                  .delay(function (d, i) { return i * 25; })
                  .attr('x', bars.attrs.x)
                  .attr('width', bars.attrs.width)
                  .attr('fill', bars.attrs.fill);

    function marginsSetup (w, h) {
        marginXLabel = Math.ceil(barLabels.getBox().width);
        marginYLabel = 10; // approx height of text
        marginXChart = w - marginXLabel - AXIS_OFFSET;
        marginYChart = h - marginYLabel - AXIS_OFFSET;
    }

    function anchorsSetup (w, h) {
        bars.anchor = [marginXLabel + AXIS_OFFSET, marginYLabel + AXIS_OFFSET];
        barLabels.anchor = [marginXLabel, marginYLabel + AXIS_OFFSET];
    }

    function scalesSetup (w, h) {
        scaleX.range([0, marginXChart]);
        scaleY.range([0, marginYChart]);
        scaleWidth.range([0, marginXChart / 2]);
        scaleHeight.range([0, marginYChart]);
    }

    function positionAllElements () {
        bars.position();
        barLabels.position();
        xLabels.attr('transform', 'translate(' + (marginXLabel + AXIS_OFFSET) + ',' + marginYLabel + ')')
              .call(xAxis.tickSize(-marginYChart - AXIS_OFFSET, 0, 0));
    }

    function updateVisAllElements () {
        bars.updateVis(['x', 'y', 'width', 'height', 'fill']);
        xLabels.call(xAxis.tickSize(-marginYChart - AXIS_OFFSET, 0, 0));
        barLabels.updateVisNT();
    }

    function resize () {
        var updatedWidth = container.resize();

        marginsSetup(updatedWidth, h);
        anchorsSetup(updatedWidth, h);
        scalesSetup(updatedWidth, h);
        positionAllElements();
        updateVisAllElements();
    }

    function sortBars () {
        // hide the tooltip (visible on the bar that was clicked)
        tip.hide();

        // switch ordering
        BY_NAME = !BY_NAME;
        if (BY_NAME) DESCENDING = !DESCENDING;
        data = data.sort(function (a, b) {
            if (BY_NAME) {
                return DESCENDING ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
            } else {
                return DESCENDING ? a.value - b.value : b.value - a.value;
            }
        });

        // update ordering of labels
        labels = data.map(key);

        // scale/visual updates
        scaleY.domain(labels);
        scaleHeight.domain(labels);
        bars.selection.transition()
                      .duration(1000)
                      // TODO find a way to sync bars with labels
                      //.delay(function (d) { return 500 * Math.abs(d.value) / DATA_MAX; })
                      .attr('y', bars.attrs.y);
        barLabels.updateNames(labels);
        barLabels.updateVis(1000);
    }
}
