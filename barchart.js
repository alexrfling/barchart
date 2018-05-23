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
(function (global, factory) {

    (typeof exports === 'object' && typeof module !== 'undefined')
        ? factory(exports)
        : ((typeof define === 'function' && define.amd)
            ? define(['exports'], factory)
            : factory(global.d3 = (global.d3 || {})));

}(this, function (exports) {

    'use strict';

    class Barchart extends d3.Widget {

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
            me.data = me.clean(data);
            options = (options || {});
            d3.setDefaultPropertiesFalsy(me, options, {
                negColor: '#dc3912',
                midColor: 'lightgrey',
                posColor: '#109618',
                numColors: 256,
                defaultDataMax: 0.75,
                keyTooltipLabel: 'Variable',
                valueTooltipLabel: 'Coefficient',
                tooltipFormat: d3.format('.7')
            });
            d3.setDefaultPropertiesUndefined(me, options, {
                byName: true,
                ascending: true,
                enableTransitions: true
            });

            me.colors = (options.colors || me.interpolateColors(me.negColor, me.midColor, me.posColor, me.numColors));

            // sort data before mapping labels
            me.sortData();
            me.labels = me.data.map(me.key);
            me.dataMax = me.getDataMax();

            me.container = me.newDefaultSVGContainer(options);

            // scales for bar attributes (x, y, width, height, fill)
            me.scaleX = d3.scaleLinear();
            me.scaleWidth = d3.scaleLinear();
            me.scaleYHeight = d3.scaleBand()
                .paddingInner(0.1)
                .paddingOuter(0.05);
            me.scaleFill = d3.scaleQuantize();

            // initalize scales
            me.setScaleDomains();
            me.setScaleRanges();

            // x-axis (add to the SVG before the bars so the bars will be on top)
            me.axisX = new d3.Axis(
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

            // y-axis line
            me.axisYLine = me.container.svg
                .append('path')
                .attr('class', 'labels-tick-line');

            // y-axis labels
            me.barLabels = new d3.Labels(
                me.container.svg,
                'labels',
                function () { return me.marginChartY; },
                me.scaleYHeight.step,
                false,
                me.options.FONT_SIZE,
                function () { return me.marginLabelX - me.options.AXIS_OFFSET; },
                'left',
                {
                    callbacks: {
                        mouseover: function (d) {
                            d3.select(this)
                                .classed('bold', true);
                            me.bars.group
                                .select('#' + me.barLabels.getLabelId(d))
                                .style('opacity', 0.5);
                        },
                        mouseout: function (d) {
                            d3.select(this)
                                .classed('bold', false);
                            me.bars.group
                                .select('#' + me.barLabels.getLabelId(d))
                                .style('opacity', 1);
                        }
                    }
                }
            );

            me.bars = new d3.ElementCollection(
                me.container.svg,
                'bars',
                'rect',
                {
                    // -1 for pos bars -> no overlap on '0' center tick
                    x: function (d) { return me.scaleX(0) - (d.value < 0 ? me.scaleWidth(Math.abs(d.value)) : -1); },
                    y: function (d) { return me.scaleYHeight(d.key); },
                    width: function (d) { return me.scaleWidth(Math.abs(d.value)); },
                    height: function () { return me.scaleYHeight.bandwidth(); },
                    fill: function (d) { return me.scaleFill(d.value); }
                },
                {
                    callbacks: {
                        mouseover: function (d) {
                            d3.select(this)
                                .style('opacity', 0.5);
                            me.barLabels.group
                                .select('#' + d3.htmlEscape(d.key))
                                .classed('bold', true);
                            me.tooltip.show(d);
                        },
                        mouseout: function (d) {
                            d3.select(this)
                                .style('opacity', 1);
                            me.barLabels.group
                                .select('#' + d3.htmlEscape(d.key))
                                .classed('bold', false);
                            me.tooltip.hide();
                        },
                        click: function (d) {
                            d3.select(this)
                                .style('opacity', 1);
                            me.barLabels.group
                                .select('#' + d3.htmlEscape(d.key))
                                .classed('bold', false);
                            me.sortBarsOnClickEasterEgg.call(me);
                        }
                    }
                }
            );

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

            // last setup before initial bar transition
            me.setMargins();
            me.setAnchors();
            me.setScaleRangesPositional();
            me.positionElements();

            // initialize bars and labels
            me.bars.updateDataWithDomIds(me.data, me.key);
            me.barLabels.updateLabels(me.labels);

            if (me.enableTransitions) {
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
                me.barLabels.updateVis(me.options.ANIM_DURATION);
            } else {
                me.bars.updateVis('x', 'y', 'width', 'height', 'fill');
                me.barLabels.updateVis();
            }

            me.bars.bindEventListeners();
            me.barLabels.bindEventListeners();
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

            me.scaleYHeight.domain(me.labels);
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
            me.scaleWidth.range([0, me.marginChartX / 2]);
            me.scaleYHeight.range([0, me.marginChartY]);
        }

        setScaleRangeFill () {
            var me = this;

            me.scaleFill.range(me.colors);
        }

        setScaleRanges () {
            var me = this;

            me.setScaleRangesPositional();
            me.setScaleRangeFill();
        }

        positionElements () {
            var me = this;

            me.axisX.position();
            me.axisX.updateTicks();
            me.axisYLine
                .attr('d', 'M ' + me.barLabels.anchor[0] + ' ' + me.barLabels.anchor[1] + ' L ' + me.barLabels.anchor[0] + ' ' + me.container.svgHeight);
            me.barLabels.position();
            me.bars.position();
        }

        updateVisElements () {
            var me = this;

            me.barLabels.updateLabels(); // recalculate ellipsing
            me.barLabels.updateVis();
            me.barLabels.bindEventListeners(); // ellipsing may affect text elements
            me.bars.updateVis('x', 'y', 'width', 'height', 'fill');
        }

        resize (width, height) {
            var me = this;
            me.container.resize(width, height);

            me.setMargins();
            me.setAnchors();
            me.setScaleRangesPositional();
            me.positionElements();
            me.updateVisElements();
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

        clean (data) {
            return (data ? data.map(function (d) {
                return {
                    key: String(d.key),
                    value: d.value
                };
            }) : []);
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
            me.barLabels.updateLabels(me.labels);

            if (me.enableTransitions) {
                me.barLabels.updateVis(me.options.ANIM_DURATION);
                me.bars.selection
                    .transition()
                    .duration(me.options.ANIM_DURATION)
                    // TODO find a way to sync labels with delayed bars
                    //.delay(function (d) { return 500 * Math.abs(d.value) / me.dataMax; })
                    .attr('y', me.bars.attrs.y);
            } else {
                me.barLabels.updateVis();
                me.bars.updateVis('y');
            }
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
            me.barLabels.updateLabels(me.labels);

            if (me.enableTransitions) {
                me.barLabels.updateVis(me.options.ANIM_DURATION);
                me.bars.selection
                    .transition()
                    .duration(me.options.ANIM_DURATION)
                    // TODO find a way to sync labels with delayed bars
                    //.delay(function (d) { return 500 * Math.abs(d.value) / me.dataMax; })
                    .attr('y', me.bars.attrs.y);
            } else {
                me.barLabels.updateVis();
                me.bars.updateVis('y');
            }
        }

        updateColors (negColor, posColor) {
            var me = this;
            me.negColor = (negColor || me.negColor);
            me.posColor = (posColor || me.posColor);

            // update colors array and scale
            me.colors = me.interpolateColors(me.negColor, me.midColor, me.posColor, me.numColors);
            me.setScaleRangeFill();

            // visual update
            if (me.enableTransitions) {
                me.bars.selection
                    .transition()
                    .duration(me.options.ANIM_DURATION)
                    .attr('fill', me.bars.attrs.fill);
            } else {
                me.bars.updateVis('fill');
            }
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

            // visual updates
            me.barLabels.updateLabels(me.labels);

            if (me.enableTransitions) {
                me.axisX.updateVis(me.options.ANIM_DURATION);
                me.barLabels.updateVis(me.options.ANIM_DURATION);

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
                    .classed('keep', false)
                    .attr('id', function (d) { return d3.htmlEscape(me.key(d)); });
            } else {
                me.axisX.updateVis();
                me.barLabels.updateVis();
                me.bars.updateDataWithDomIds(me.data, me.key);
                me.bars.updateVis('x', 'y', 'width', 'height', 'fill');
            }

            me.bars.bindEventListeners();
            me.barLabels.bindEventListeners();
        }
    }

    exports.Barchart = Barchart;

    Object.defineProperty(exports, '__esModule', { value: true });
}));
