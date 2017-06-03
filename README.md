# barchart
Interactive bar chart with d3.js

![alt text](https://raw.githubusercontent.com/alexrfling/barchart/master/img/example.png)

## Overview
`Barchart` takes the id of an HTML element, an array of data, and optional
parameters, and generates an interactive bar chart of the data appended to the
HTML element.

## Boilerplate
In the head of your HTML document, include:
```html
<script src='d3-helpers/d3/d3.min.js'></script>
<script src='d3-helpers/d3-tip/index.js'></script>
<script src='d3-helpers/graphicalElement.js'></script>
<script src='d3-helpers/axis.js'></script>
<script src='d3-helpers/elementCollection.js'></script>
<script src='d3-helpers/labels.js'></script>
<script src='d3-helpers/svgContainer.js'></script>
<script src='d3-helpers/widget.js'></script>
<script src='barchart.js'></script>
<link rel='stylesheet' type='text/css' href='d3-helpers/d3-tip/examples/example-styles.css'>
<link rel='stylesheet' type='text/css' href='d3-helpers/widget.css'>
```

## Usage

### Constructor
new **Barchart**(_id_)  
Constructs a new Barchart widget with parent element set to the HTML element in the DOM with id _id_. Note that this does not modify the DOM.

### Methods
<a name='initialize' href='#initialize'>#</a> _chart_.**initialize**(_data_[, _options_])

Binds _data_ to _chart_ and renders a bar chart inside the widget's parent element.
* _data_ - an array of objects, each containing a unique `key` field and a numerical `value` field
* _options_ - an object specifying various attributes of the rendering and widget
  * **width** - the width, in pixels, of the widget. If falsy, the width of the widget will be the same as the width of the widget's parent element
  * **height** - the height, in pixels, of the widget (default: `400`)
  * **negColor** - string representing the color for data with negative values (default: `'#dc3912'`)
  * **posColor** - string representing the color for data with positive values (default: `'#109618'`)
  * **byName** - if truthy, determines bar ordering by comparing the `key` fields of each object; otherwise, the `value` fields are compared (default: `true`)
  * **ascending** - if truthy, sorts the bars ascending; otherwise, they are sorted descending (default: `true`)
  * **defaultDataMax** - if `data` is empty, this value will be used to set the range of the x-axis (default: `0.75`)
  * **keyTooltipLabel** - the label that describes the `key` field in the tooltip (default: `'Variable'`)
  * **valueTooltipLabel** - the label that describes the `value` field in the tooltip (default: `'Coefficient'`)
  * **tooltipFormat** - the function used to format the `value` field in the tooltip (default: `d3.format('.7')`)

<a name='resize' href='#resize'>#</a> _chart_.**resize**([_width_[, _height_]])

If _width_ is truthy, sets the width (in pixels) of the widget to be _width_, otherwise the width of the widget doesn't change.  
If _height_ is truthy, sets the height (in pixels) of the widget to be _height_, otherwise the height of the widget doesn't change.

<a name='updateSort' href='#updateSort'>#</a> _chart_.**updateSort**([_byName_[, _ascending_]])

If _byName_ is truthy, sorts the bars in the widget by their associated `key` fields. If _byName_ is falsy and not `null`, sorts the bars in the widget by their associated `value` fields. Otherwise if _byName_ is `null`, the sorting of the bars in the widget doesn't change.  
If _ascending_ is truthy, the bars in the widget are sorted in ascending order. If _ascending_ is falsy and not `null`, the bars in the widget are sorted in descending order. Otherwise if _ascending_ is `null`, the ordering of the bars in the widget doesn't change.

<a name='updateColors' href='#updateColors'>#</a> _chart_.**updateColors**([_negColor_[, _posColor_]])

If _negColor_ is truthy, updates the color of bars with negative associated `value` fields to be _negColor_. Otherwise, the color of bars with negative associated `value` fields doesn't change.  
If _posColor_ is truthy, updates the color of bars with positive associated `value` fields to be _posColor_. Otherwise, the color of bars with positive associated `value` fields doesn't change.

<a name='updateData' href='#updateData'>#</a> _chart_.**updateData**(_data_)

Binds _data_ to _chart_ and updates the bar chart accordingly. _data_ should be of the same form as described in <a href='#initialize'>initialize</a>.

### Example
Element in the HTML document:
```html
<div id='barchart'></div>
```
Data in JavaScript:
```js
var data = [
    {
        key: 'Variable 1',
        value: 348
    },
    ...,
    {
        key: 'Variable n',
        value: -729
    }
];
```
Create an interactive bar chart of `data`:
```js
var chart = new Barchart('barchart');
chart.initialize(data);
```
See <a href='https://github.com/alexrfling/barchart/blob/master/example.html'>example.html</a> for more example usage.
