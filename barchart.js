/*
              marginLabelX                      marginChartX
             +------------+----------------------------------------------------+
marginLabelY |            |                                                    |
             +------------+----------------------------------------------------+
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
marginChartY |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             +------------+----------------------------------------------------+
*/
class Barchart extends Widget {

    constructor (id) {
        super(id, {
            SVG_MARGINS: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            },
            ANIM_DURATION: 1000,
            AXIS_OFFSET: 5,
            DEFAULT_HEIGHT: 400,
            FONT_SIZE: 10,
            PADDING: 10
        });
    }

    initialize (data, options) {
        var me = this;
        options = (options || {});

        me.data = (data ? me.clean(data) : []);
        me.negColor = (options.negColor || '#dc3912');
        me.posColor = (options.posColor || '#109618');
        me.byName = (options.byName === undefined ? true : options.byName);
        me.ascending = (options.ascending === undefined ? true : options.ascending);
        me.defaultDataMax = (options.defaultDataMax || 0.75);
        me.keyTooltipLabel = (options.keyTooltipLabel || 'Variable');
        me.valueTooltipLabel = (options.valueTooltipLabel || 'Coefficient');
        me.tooltipFormat = (options.tooltipFormat || d3.format('.7'));

        me.sortData();
        me.labels = me.data.map(me.key);
        me.dataMax = me.getDataMax();
        me.barColors = me.getBarColors();

        // clear out DOM elements inside parent
        me.destroy();

        // holds all HTML and SVG elements
        me.container = new SVGContainer(
            me.id,
            'd3-helpers-widget-div',
            'd3-helpers-widget-svg',
            me.options.SVG_MARGINS,
            options.width,
            (options.height || me.options.DEFAULT_HEIGHT),
            {
                onWindowResize: (options.width ? null : function () { me.resize.call(me); })
            }
        );

        // initial setup for margins
        me.setMargins();

        // scales for bar attributes (x, y, width, height, fill)
        me.scaleX = d3.scaleLinear();
        me.scaleY = d3.scaleBand();
        me.scaleWidth = d3.scaleLinear();
        me.scaleHeight = d3.scaleBand()
            .paddingInner(0.1)
            .paddingOuter(0.05);
        me.scaleFill = d3.scaleQuantize();

        // initalize scales
        me.setScaleDomains();
        me.setScaleRanges();

        // x-axis labels (add this to the SVG first so the bars will be on top)
        me.axisX = new Axis(
            me.container.svg,
            'labels',
            me.scaleX,
            me.options.FONT_SIZE,
            'top',
            {
                tickFormat: d3.format('.1'),
                tickSize: function () { return -me.marginChartY - me.options.AXIS_OFFSET; }
            }
        );

        // bars and chart
        me.bars = new ElementCollection(
            me.container.svg,
            'bars',
            'rect',
            {
                // -1 for pos bars -> no overlap on '0' center tick
                x: function (d) { return me.scaleX(0) - (d.value < 0 ? me.scaleWidth(Math.abs(d.value)) : -1); },
                // add half of (step - bandwidth) to account for paddingInner/Outer
                y: function (d) { return me.scaleY(d.key) + (me.scaleHeight.step() - me.scaleHeight.bandwidth()) / 2; },
                width: function (d) { return me.scaleWidth(Math.abs(d.value)); },
                height: function () { return me.scaleHeight.bandwidth(); },
                fill: function (d) { return me.scaleFill(d.value); }
            },
            me.data,
            me.key
        );

        // y-axis labels
        me.barLabels = new Labels(
            me.container.svg,
            'labels',
            me.labels,
            function () { return me.marginChartY; },
            me.scaleHeight.step,
            false,
            me.options.FONT_SIZE,
            function () { return me.marginLabelX - me.options.AXIS_OFFSET; },
            'left'
        );

        // vertical line next to textual lables at left
        me.axisYLine = me.container.svg
            .append('path')
            .attr('class', 'labels-tick-line');

        // tooltip for bars
        me.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction(function (d) { return (d.value < 0 ? 'e' : 'w'); })
            .offset(function (d) { return (d.value < 0 ? [0, 10] : [0, -10]); })
            .html(function (d) {
                return '<table>' +
                    '<tr><td>' + me.keyTooltipLabel + '</td><td>' + d.key + '</td></tr>' +
                    '<tr><td>' + me.valueTooltipLabel + '</td><td>' + me.tooltipFormat(d.value) + '</td></tr>' +
                    '</table>';
            });

        // invoke tooltip
        me.container.svg
            .call(me.tooltip);

        // bind event listeners to bars
        me.bindEventListeners();

        // last setup before initial bar transition
        me.setMargins();
        me.setAnchors();
        me.setScaleRangesPositional();
        me.positionElements();

        // initialize bars
        if (options.noTransition) {
            me.bars.updateVis('x', 'y', 'width', 'height', 'fill');
        } else {
            me.bars.selection
                .attr('x', me.scaleX(0))
                .attr('y', me.bars.attrs.y)
                .attr('width', 0)
                .attr('height', me.bars.attrs.height)
                .attr('fill', 'white'); // NOTE 'none' also looks pretty good
            me.bars.selection
                .transition()
                .duration(me.options.ANIM_DURATION)
                .delay(function (d, i) { return i * 25; })
                .attr('x', me.bars.attrs.x)
                .attr('width', me.bars.attrs.width)
                .attr('fill', me.bars.attrs.fill);
        }
    }

    setMargins () {
        var me = this;

        // NOTE marginLabelX and marginLabelY should be >= 10 to start,
        // otherwise bar labels get positioned badly for some reason...
        me.marginLabelX = Math.ceil(0.1 * me.container.svgWidth);
        me.marginLabelY = me.options.FONT_SIZE;
        me.marginChartX = me.container.svgWidth - me.marginLabelX - me.options.AXIS_OFFSET - me.options.PADDING;
        me.marginChartY = me.container.svgHeight - me.marginLabelY - me.options.AXIS_OFFSET;
    }

    setAnchors () {
        var me = this;

        me.bars.anchor = [me.marginLabelX + me.options.AXIS_OFFSET, me.marginLabelY + me.options.AXIS_OFFSET];
        me.barLabels.anchor = [me.marginLabelX, me.marginLabelY + me.options.AXIS_OFFSET];
        me.axisX.anchor = [me.marginLabelX + me.options.AXIS_OFFSET, me.marginLabelY];
    }

    setScaleDomainsHorizontal () {
        var me = this;

        me.scaleX.domain([-me.dataMax, me.dataMax]);
        me.scaleWidth.domain([0, me.dataMax]);
    }

    setScaleDomainsVertical () {
        var me = this;

        me.scaleY.domain(me.labels);
        me.scaleHeight.domain(me.labels);
    }

    setScaleDomainFill () {
        var me = this;

        me.scaleFill.domain([-me.dataMax, me.dataMax]);
    }

    setScaleDomains () {
        var me = this;

        me.setScaleDomainsHorizontal();
        me.setScaleDomainsVertical();
        me.setScaleDomainFill();
    }

    setScaleRangesPositional () {
        var me = this;

        me.scaleX.range([0, me.marginChartX]);
        me.scaleY.range([0, me.marginChartY]);
        me.scaleWidth.range([0, me.marginChartX / 2]);
        me.scaleHeight.range([0, me.marginChartY]);
    }

    setScaleRangeFill () {
        var me = this;

        me.scaleFill.range(me.barColors);
    }

    setScaleRanges () {
        var me = this;

        me.setScaleRangesPositional();
        me.setScaleRangeFill();
    }

    positionElements () {
        var me = this;

        me.bars.position();
        me.barLabels.position();
        me.axisX.position();
        me.axisX.updateTicks();
        me.axisYLine
            .attr('d', 'M ' + me.barLabels.anchor[0] + ' ' + me.barLabels.anchor[1] + ' L ' + me.barLabels.anchor[0] + ' ' + me.container.svgHeight);
    }

    updateVisAllElements () {
        var me = this;

        me.bars.updateVis('x', 'y', 'width', 'height', 'fill');
        me.barLabels.updateLabels(); // recalculate ellipsing
        me.barLabels.updateVis();
    }

    bindEventListeners () {
        var me = this;

        me.bars.selection
            .on('mouseover', function (d) {
                d3.select(this)
                    .style('opacity', 0.5);
                me.barLabels.group
                    .select('#' + me.htmlEscape(d.key))
                    .classed('bold', true);
                me.tooltip.show(d);
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .style('opacity', 1);
                me.barLabels.group
                    .select('#' + me.htmlEscape(d.key))
                    .classed('bold', false);
                me.tooltip.hide();
            })
            .on('click', function (d) {
                d3.select(this)
                    .style('opacity', 1);
                me.barLabels.group
                    .select('#' + me.htmlEscape(d.key))
                    .classed('bold', false);
                me.sortBarsOnClickEasterEgg.call(me);
            });
    }

    resize (width, height) {
        var me = this;
        me.container.resize(width, height);

        me.setMargins();
        me.setAnchors();
        me.setScaleRangesPositional();
        me.positionElements();
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

        return d3.max(me.data, function (d) { return Math.abs(d.value); });
    }

    getBarColors () {
        var me = this;

        return me.interpolateColors(me.negColor, 'lightgrey', me.posColor, 256);
    }

    clean (data) {
        return data.map(function (d) {
            return {
                key: String(d.key),
                value: d.value
            };
        });
    }

    sortBarsOnClickEasterEgg () {
        var me = this;

        // hide the tooltip (visible on the bar that was clicked)
        me.tooltip.hide();

        // update ordering of data and labels
        me.byName = !me.byName;
        me.ascending = (me.byName ? !me.ascending : me.ascending);
        me.sortData();
        me.labels = me.data.map(me.key);

        // scale updates
        me.setScaleDomainsVertical();

        // visual updates
        me.bars.selection
            .transition()
            .duration(me.options.ANIM_DURATION)
            // TODO find a way to sync labels with delayed bars
            //.delay(function (d) { return 500 * Math.abs(d.value) / me.dataMax; })
            .attr('y', me.bars.attrs.y);
        me.barLabels.updateLabels(me.labels);
        me.barLabels.updateVis(me.options.ANIM_DURATION);
    }

    updateSort (byName, ascending) {
        var me = this;
        me.byName = (byName === null ? me.byName : byName);
        me.ascending = (ascending === null ? me.ascending : ascending);

        // hide tooltip in case it's visible
        me.tooltip.hide();

        // update ordering of data and labels
        me.sortData();
        me.labels = me.data.map(me.key);

        // scale updates
        me.setScaleDomainsVertical();

        // visual updates
        me.bars.selection
            .transition()
            .duration(me.options.ANIM_DURATION)
            // TODO find a way to sync labels with delayed bars
            //.delay(function (d) { return 500 * Math.abs(d.value) / me.dataMax; })
            .attr('y', me.bars.attrs.y);
        me.barLabels.updateLabels(me.labels);
        me.barLabels.updateVis(me.options.ANIM_DURATION);
    }

    updateColors (negColor, posColor) {
        var me = this;
        me.negColor = (negColor || me.negColor);
        me.posColor = (posColor || me.posColor);

        // update colors array and scale
        me.barColors = me.getBarColors();
        me.setScaleRangeFill();

        // visual update
        me.bars.selection
            .transition()
            .duration(me.options.ANIM_DURATION)
            .attr('fill', me.bars.attrs.fill);
    }

    updateData (data) {
        var me = this;
        me.data = me.clean(data);

        // hide tooltip in case it's visible
        me.tooltip.hide();

        // sort data as it previously was sorted
        me.sortData();

        // update ordering of labels and max abs value
        me.labels = me.data.map(me.key);
        me.dataMax = me.getDataMax();

        // scale updates
        me.setScaleDomains();

        // add temporary classes to separate old bars from bars to be kept
        me.bars.group
            .selectAll('rect')
            .data(me.data, me.key)
            .exit()
            .attr('class', 'remove');
        me.bars.group
            .selectAll('rect')
            .filter(function () { return (this.className.baseVal !== 'remove'); })
            .attr('class', 'keep');

        // add new bars, invisible, with same class as bars to be kept
        me.bars.group
            .selectAll('rect')
            .data(me.data, me.key)
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
            .duration(me.options.ANIM_DURATION)
            .attr('x', me.scaleX(0))
            .attr('y', me.marginChartY)
            .attr('width', 0)
            .attr('height', 0)
            .attr('fill', 'white')
            .remove();
        me.bars.group
            .selectAll('rect.keep')
            .transition()
            .duration(me.options.ANIM_DURATION)
            .attr('x', me.bars.attrs.x)
            .attr('y', me.bars.attrs.y)
            .attr('width', me.bars.attrs.width)
            .attr('height', me.bars.attrs.height)
            .attr('fill', me.bars.attrs.fill);

        // update bar selection
        me.bars.selection = me.bars.group
            .selectAll('rect.keep')
            .classed('keep', false);

        // update labels and reattach event listeners
        me.barLabels.updateLabels(me.labels);
        me.barLabels.updateVis(me.options.ANIM_DURATION);
        me.bindEventListeners();

        // update x-axis
        me.axisX.updateVis(me.options.ANIM_DURATION);
    }
}
