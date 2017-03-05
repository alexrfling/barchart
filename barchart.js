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

    constructor (id, height) {
        var me = this;
        me.parentId = id;
        me.height = height;

        me.SVG_MARGINS = { top: 10, bottom: 10, left: 10, right: 10 };
        me.AXIS_OFFSET = 5;
    }

    initializeVis (data, options) {
        var me = this;
        options = options || {};

        me.data = (data ? data.slice() : []);
        me.negColor = options.negColor || '#dc3912';
        me.posColor = options.posColor || '#109618';
        me.byName = (options.byName === undefined ? true : options.byName);
        me.ascending = (options.byName === undefined ? true : options.ascending);
        me.defaultDataMax = options.defaultDataMax || 0.75;
        me.defaultMarginXLabel = options.defaultMarginXLabel || 50;

        me.sortData();
        me.dataMax = me.getDataMax();
        me.barColors = me.getBarColors();

        // clear out old DOM elements
        flushContents(me.parentId);

        me.container = new SVGContainer(me.parentId, 'barchart', 'barchartSVG', function () { me.resize.call(me); }, me.SVG_MARGINS, me.height);
        addDropShadowFilter(me.container.SVG, 'shadow');

        me.container.resize();

        me.labels = me.data.map(key);
        me.width = me.container.svgWidth;
        me.height = me.container.svgHeight;

        // margins
        // NOTE marginXLabel and marginYLabel should be >= 10 to start,
        // otherwise bar labels get positioned badly for some reason...
        me.marginXLabel = Math.max(me.defaultMarginXLabel, 10);
        me.marginYLabel = 10; // approx height of text
        me.marginXChart = me.width - me.marginXLabel - me.AXIS_OFFSET;
        me.marginYChart = me.height - me.marginYLabel - me.AXIS_OFFSET;

        // scales for bar x, y, width, height, and fill
        me.scaleX = d3.scaleLinear()
            .domain([-me.dataMax, me.dataMax])
            .range([0, me.marginXChart]);
        me.scaleY = d3.scaleBand()
            .domain(me.labels)
            .range([0, me.marginYChart]);
        me.scaleWidth = d3.scaleLinear()
            .domain([0, me.dataMax])
            .range([0, me.marginXChart / 2]);
        me.scaleHeight = d3.scaleBand()
            .domain(me.labels)
            .range([0, me.marginYChart])
            .paddingInner(0.1)
            .paddingOuter(0.05);
        me.scaleFill = d3.scaleQuantize()
            .domain([-me.dataMax, me.dataMax])
            .range(me.barColors);

        // axes for rows/columns (note that these ARE NOT yet added to the svg)
        me.xAxis = d3.axisTop(me.scaleX);

        // add the axes to the svg (add these before the bars so the bars will be on top)
        me.xLabels = me.container.svg
            .append('g')
            .attr('class', 'axis x-axis')
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
        // HACK add current time to id to give it a high chance of being unique
        me.barLabels = new Labels(me.container.svg, 'labels' + (new Date()).getTime(), 'axis', me.labels, function () { return me.marginYChart; }, me.scaleHeight.step, false, 10, 'left');

        // tooltip for bars
        me.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function (d) { return (d.value < 0 ? 'e' : 'w'); })
            .offset(function (d) { return (d.value < 0 ? [0, 10] : [0, -10]); })
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
            .attr('id', function (d) { return htmlEscape(d); });

        // bind event listeners
        me.bars.addListener('mouseover', function (d) {
            me.barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', true);
            me.tooltip.show(d);
        });
        me.bars.addListener('mouseout', function (d) {
            me.barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', false);
            me.tooltip.hide();
        });
        me.bars.addListener('click', function () { me.sortBarsOnClickEasterEgg.call(me); });

        // vertical line next to textual lables at left
        me.yAxisLine = me.container.svg
            .append('path')
            .attr('class', 'y-domain');

        // last setup before initial bar transition
        me.marginsSetup(me.width, me.height);
        me.anchorsSetup(me.width, me.height);
        me.scalesSetup(me.width, me.height);
        me.positionAllElements();

        // custom initialization + transition
        me.bars.selection
            .attr('x', me.scaleX(0))
            .attr('y', me.bars.attrs.y)
            .attr('height', me.bars.attrs.height)
            .attr('width', 0)
            .attr('fill', 'white'); // NOTE 'none' also looks pretty good
        me.bars.selection
            .transition()
            .duration(1000)
            .delay(function (d, i) { return i * 25; })
            .attr('x', me.bars.attrs.x)
            .attr('width', me.bars.attrs.width)
            .attr('fill', me.bars.attrs.fill);

        // NOTE for testing
        /*me.container.svg
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', 'green')
            .on('click', function () { me.resize(me.height + 100); });
            .on('click', function () { me.updateData.call(me, me.genData()); });*/
    }

    marginsSetup (width, height) {
        var me = this;

        me.marginXLabel = (Math.ceil(me.barLabels.getBox().width) || me.marginXLabel);
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
        me.yAxisLine.attr('d', 'M ' + me.barLabels.anchor[0] + ' ' + me.barLabels.anchor[1] + ' L ' + me.barLabels.anchor[0] + ' ' + me.height);
    }

    updateVisAllElements () {
        var me = this;

        me.bars.updateVis(['x', 'y', 'width', 'height', 'fill']);
        me.xLabels.call(me.xAxis.tickSize(-me.marginYChart - me.AXIS_OFFSET, 0, 0));
        me.barLabels.updateVisNT();
    }

    resize (height) {
        var me = this;
        var size = me.container.resize(height);
        me.width = size.svgWidth;
        me.height = size.svgHeight;

        me.marginsSetup(me.width, me.height);
        me.anchorsSetup(me.width, me.height);
        me.scalesSetup(me.width, me.height);
        me.positionAllElements();
        me.updateVisAllElements();
    }

    sortData () {
        var me = this;

        me.data.sort(function (a, b) {
            if (me.byName) {
                return (me.ascending ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key));
            } else {
                return (me.ascending ? a.value - b.value : b.value - a.value);
            }
        });
    }

    getDataMax () {
        var me = this;

        // if there's no data, return the previous data max (if it exists), or
        // the default
        if (!me.data.length) {
            return (me.dataMax || me.defaultDataMax);
        }

        return Math.max(...me.data.map(function (d) { return Math.abs(d.value); }));
    }

    getBarColors () {
        var me = this;

        return interpolateColors(me.negColor, 'lightgrey', me.posColor, 256);
    }

    sortBarsOnClickEasterEgg () {
        var me = this;

        // hide the tooltip (visible on the bar that was clicked)
        me.tooltip.hide();

        // update ordering of data and labels
        me.byName = !me.byName;
        me.ascending = (me.byName ? !me.ascending : me.ascending);
        me.sortData();
        me.labels = me.data.map(key);

        // scale/visual updates
        me.scaleY.domain(me.labels);
        me.scaleHeight.domain(me.labels);
        me.bars.selection
            .transition()
            .duration(1000)
            // TODO find a way to sync bars with labels
            //.delay(function (d) { return 500 * Math.abs(d.value) / me.dataMax; })
            .attr('y', me.bars.attrs.y);
        me.barLabels.updateNames(me.labels);
        me.barLabels.updateVis(1000);
    }

    updateSort (byName, ascending) {
        var me = this;
        me.byName = (byName === undefined ? true : byName);
        me.ascending = (byName === undefined ? true : ascending);

        // hide the tooltip (visible on the bar that was clicked)
        me.tooltip.hide();

        // update ordering of data and labels
        me.sortData();
        me.labels = me.data.map(key);

        // scale/visual updates
        me.scaleY.domain(me.labels);
        me.scaleHeight.domain(me.labels);
        me.bars.selection
            .transition()
            .duration(1000)
            // TODO find a way to sync bars with labels
            //.delay(function (d) { return 500 * Math.abs(d.value) / me.dataMax; })
            .attr('y', me.bars.attrs.y);
        me.barLabels.updateNames(me.labels);
        me.barLabels.updateVis(1000);
    }

    updateColors (negColor, posColor) {
        var me = this;
        me.negColor = negColor;
        me.posColor = posColor;

        // update colors array and scale
        me.barColors = me.getBarColors();
        me.scaleFill.range(me.barColors);

        // visual update
        me.bars.selection
            .transition()
            .duration(1000)
            .attr('fill', me.bars.attrs.fill);
    }

    // NOTE for testing
    /*genData () {
        var me = this;
        var data = me.data;

        var numNew = Math.floor(10 * Math.random());
        var numRem = Math.floor(10 * Math.random());

        for (var j = 0; j < numRem; j++) {
            var index = Math.floor(data.length * Math.random());
            data = data.slice(0, index).concat(data.slice(index + 1, data.length));
        }

        for (var j = 0; j < numNew; j++) {
            var firstLetter = 'qwertyuiopasdfghjklzxcvbnm'[Math.floor(26 * Math.random())];

            data.push({
                key: firstLetter + Math.floor(10000 * Math.random()),
                value: 2.5 * Math.random() * me.dataMax - me.dataMax
            });
        }

        return data;
    }*/

    updateData (data) {
        var me = this;
        me.data = data;

        // nide tooltip in case it's visible
        me.tooltip.hide();

        // sort data as it previously was sorted
        me.sortData();

        // update ordering of labels and max abs value
        me.labels = me.data.map(key);
        me.dataMax = me.getDataMax();

        // scale updates
        me.scaleX.domain([-me.dataMax, me.dataMax]);
        me.scaleY.domain(me.labels);
        me.scaleWidth.domain([0, me.dataMax]);
        me.scaleHeight.domain(me.labels);
        me.scaleFill.domain([-me.dataMax, me.dataMax]);

        // add temporary classes to separate old bars from bars to be kept
        me.bars.group
            .selectAll('rect')
            .data(me.data, key)
            .exit()
            .attr('class', 'remove');
        me.bars.group
            .selectAll('rect')
            .filter(function () { return (this.className.baseVal !== 'remove'); })
            .attr('class', 'keep');

        // add new bars, invisible, with same class as bars to be kept
        me.bars.group
            .selectAll('rect')
            .data(me.data, key)
            .enter()
            .append('rect')
            .attr('class', 'keep')
            .attr('x', me.scaleX(0))
            .attr('y', me.bars.attrs.y)
            .attr('height', 0)
            .attr('width', 0)
            .attr('fill', 'white');

        // transition all bars (old bars removed)
        me.bars.group
            .selectAll('rect.remove')
            .transition()
            .duration(1000)
            .attr('x', me.scaleX(0))
            .attr('y', me.marginYChart)
            .attr('width', 0)
            .attr('height', 0)
            .attr('fill', 'white')
            .remove();
        me.bars.group
            .selectAll('rect.keep')
            .transition()
            .duration(1000)
            .attr('x', me.bars.attrs.x)
            .attr('y', me.bars.attrs.y)
            .attr('width', me.bars.attrs.width)
            .attr('height', me.bars.attrs.height)
            .attr('fill', me.bars.attrs.fill);

        // update bar selection and reattach listeners
        me.bars.selection = me.bars.group
            .selectAll('rect.keep')
            .classed('keep', false)
            .on('mouseover', function (d) {
                me.barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', true);
                me.tooltip.show(d);
            })
            .on('mouseout', function (d) {
                me.barLabels.group.select('#' + htmlEscape(d.key)).classed('bold', false);
                me.tooltip.hide();
            })
            .on('click', function () { me.sortBarsOnClickEasterEgg.call(me); });

        // update labels and reattach ids
        me.barLabels.updateNames(me.labels);
        me.barLabels.updateVis(1000);
        me.barLabels.group
            .selectAll('text')
            .attr('id', function (d) { return htmlEscape(d); });

        // update x axis
        me.xLabels
            .transition()
            .duration(1000)
            .call(me.xAxis.tickSize(-me.marginYChart - me.AXIS_OFFSET, 0, 0));
    }
}
