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
class Barchart {

    constructor (id, height, data, negColor, posColor) {
        var me = this;

        me.SVG_MARGINS = { top: 10, bottom: 10, left: 10, right: 10 };
        me.AXIS_OFFSET = 5;
        me.DATA_MAX = Math.max(...data.map(function (d) { return Math.abs(d.value); }));
        me.BAR_COLORS = interpolateColors(negColor || '#dc3912', 'lightgrey', posColor || '#109618', 256);
        me.BY_NAME = true;
        me.DESCENDING = true;

        // clear out old DOM elements
        flushContents(id);

        me.data = data.slice();
        me.container = new SVGContainer(id, 'barchart', 'barchartSVG', function () { me.resize(me); }, me.SVG_MARGINS, height);
        addDropShadowFilter(me.container.SVG, 'shadow');

        me.container.resize();

        me.labels = me.data.map(key);
        me.width = me.container.svgWidth;
        me.height = me.container.svgHeight;

        // margins
        me.marginXLabel = me.AXIS_OFFSET * 2;
        me.marginYLabel = me.AXIS_OFFSET * 2;
        me.marginXChart = me.width - me.marginXLabel - me.AXIS_OFFSET;
        me.marginYChart = me.height - me.marginYLabel - me.AXIS_OFFSET;

        // scales for bar x, y, width, height, and fill
        me.scaleX = d3.scaleLinear()
            .domain([-me.DATA_MAX, me.DATA_MAX])
            .range([0, me.marginXChart]);
        me.scaleY = d3.scaleBand()
            .domain(me.labels)
            .range([0, me.marginYChart]);
        me.scaleWidth = d3.scaleLinear()
            .domain([0, me.DATA_MAX])
            .range([0, me.marginXChart / 2]);
        me.scaleHeight = d3.scaleBand()
            .domain(me.labels)
            .range([0, me.marginYChart])
            .paddingInner(0.1)
            .paddingOuter(0.05);
        me.scaleFill = d3.scaleQuantize()
            .domain([-me.DATA_MAX, me.DATA_MAX])
            .range(me.BAR_COLORS);

        // axes for rows/columns (note that these ARE NOT yet added to the svg)
        me.xAxis = d3.axisTop(me.scaleX);

        // add the axes to the svg (add these before the bars so the bars will be on top)
        me.xLabels = me.container.svg
            .append('g')
            .attr('id', 'xticks')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + me.marginXLabel + ',' + me.marginYLabel + ')')
            .call(me.xAxis.tickSize(-me.marginYChart - me.AXIS_OFFSET, 0, 0));

        // bars
        me.bars = new Cells(me.container.svg, 'bars', me.data, key,
            // -1 for pos bars -> no overlap on '0' center tick
            function (d) { return me.scaleX(0) - (d.value < 0 ? me.scaleWidth(Math.abs(d.value)) : -1); },
            // add half of (step - bandwidth) to account for paddingInner/Outer
            function (d) { return me.scaleY(d.key) + (me.scaleHeight.step() - me.scaleHeight.bandwidth()) / 2; },
            function (d) { return me.scaleWidth(Math.abs(d.value)); },
            function (d) { return me.scaleHeight.bandwidth(); },
            function (d) { return me.scaleFill(d.value); });

        // labels at left
        me.barLabels = new Labels(me.container.svg, 'labels', 'axis', me.labels, function () { return me.marginYChart; }, me.scaleHeight.step, false, 10, 'left');

        // tooltip for bars
        me.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function (d) { return d.value < 0 ? 'e' : 'w'; })
            .offset(function (d) { return d.value < 0 ? [0, 10] : [0, -10]; })
            .html(function (d) {
                return '<table>' +
                        '<tr><td>Variable</td><td>' + d.key + '</td></tr>' +
                        '<tr><td>Coefficient</td><td>' + round(d.value, 7) + '</td></tr>' +
                       '</table>';
            });

        // invoke tooltip
        me.container.svg.call(me.tooltip);

        // add ids to labels so they can be bolded on hover
        me.barLabels.group
            .selectAll('text')
            .attr('id', function () { return htmlEscape(this.innerHTML); });

        // bind event listeners
        me.bars.addListener('mouseover', function (d) {
            me.barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', true);
            me.tooltip.show(d);
        });
        me.bars.addListener('mouseout', function (d) {
            me.barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', false);
            me.tooltip.hide();
        });
        me.bars.addListener('click', function() { me.sortBars(me); });

        // last setup before initial bar transition
        me.marginsSetup(me.width, me.height);
        me.anchorsSetup(me.width, me.height);
        me.scalesSetup(me.width, me.height);
        me.positionAllElements();

        // vertical line next to textual lables at left
        me.container.svg
            .append('g')
            .attr('id', 'labels')
            .attr('class', 'axis')
            .append('path')
            .attr('d', 'M ' + me.barLabels.anchor[0] + ' ' + me.barLabels.anchor[1] + ' L ' + me.barLabels.anchor[0] + ' ' + me.height);

        // custom initialization + transition
        me.bars.selection
            .attr('x', me.scaleX(0))
            .attr('y', me.bars.attrs.y)
            .attr('height', me.bars.attrs.height)
            .attr('width', 0)
            .attr('fill', 'white');
        me.bars.selection
            .transition()
            .duration(1000)
            .delay(function (d, i) { return i * 25; })
            .attr('x', me.bars.attrs.x)
            .attr('width', me.bars.attrs.width)
            .attr('fill', me.bars.attrs.fill);
    }

    marginsSetup (width, height) {
        var me = this;

        me.marginXLabel = Math.ceil(me.barLabels.getBox().width);
        me.marginYLabel = 10; // approx height of text
        me.marginXChart = width - me.marginXLabel - me.AXIS_OFFSET;
        me.marginYChart = height - me.marginYLabel - me.AXIS_OFFSET;
    }

    anchorsSetup (width, height) {
        var me = this;

        me.bars.anchor = [me.marginXLabel + me.AXIS_OFFSET, me.marginYLabel + me.AXIS_OFFSET];
        me.barLabels.anchor = [me.marginXLabel, me.marginYLabel + me.AXIS_OFFSET];
    }

    scalesSetup (width, height) {
        var me = this;

        me.scaleX.range([0, me.marginXChart]);
        me.scaleY.range([0, me.marginYChart]);
        me.scaleWidth.range([0, me.marginXChart / 2]);
        me.scaleHeight.range([0, me.marginYChart]);
    }

    positionAllElements () {
        var me = this;

        me.bars.position();
        me.barLabels.position();
        me.xLabels
            .attr('transform', 'translate(' + (me.marginXLabel + me.AXIS_OFFSET) + ',' + me.marginYLabel + ')')
            .call(me.xAxis.tickSize(-me.marginYChart - me.AXIS_OFFSET, 0, 0));
    }

    updateVisAllElements () {
        var me = this;

        me.bars.updateVis(['x', 'y', 'width', 'height', 'fill']);
        me.xLabels.call(me.xAxis.tickSize(-me.marginYChart - me.AXIS_OFFSET, 0, 0));
        me.barLabels.updateVisNT();
    }

    resize (me) {
        var updatedWidth = me.container.resize();

        me.marginsSetup(updatedWidth, me.height);
        me.anchorsSetup(updatedWidth, me.height);
        me.scalesSetup(updatedWidth, me.height);
        me.positionAllElements();
        me.updateVisAllElements();
    }

    sortBars (me) {

        // hide the tooltip (visible on the bar that was clicked)
        me.tooltip.hide();

        // switch ordering
        me.BY_NAME = !me.BY_NAME;
        if (me.BY_NAME) me.DESCENDING = !me.DESCENDING;
        me.data = me.data.sort(function (a, b) {
            if (me.BY_NAME) {
                return me.DESCENDING ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key);
            } else {
                return me.DESCENDING ? a.value - b.value : b.value - a.value;
            }
        });

        // update ordering of labels
        me.labels = me.data.map(key);

        // scale/visual updates
        me.scaleY.domain(me.labels);
        me.scaleHeight.domain(me.labels);
        me.bars.selection
            .transition()
            .duration(1000)
            // TODO find a way to sync bars with labels
            //.delay(function (d) { return 500 * Math.abs(d.value) / DATA_MAX; })
            .attr('y', me.bars.attrs.y);
        me.barLabels.updateNames(me.labels);
        me.barLabels.updateVis(1000);
    }
}
