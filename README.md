# barchart
Interactive bar chart with d3.js

![alt text](https://raw.githubusercontent.com/alexrfling/barchart/master/img/example.png)

## Overview
`d3.Barchart` takes the id of an HTML element, an array of data, and optional parameters, and generates an interactive bar chart of the data appended to the HTML element.

## Boilerplate
In the head of your HTML document, include:
```html
<script src='d3-helpers/d3/d3.min.js'></script>
<script src='d3-helpers/d3-tip/index.js'></script>
<script src='d3-helpers/d3-helpers.js'></script>
<script src='barchart.js'></script>
<link rel='stylesheet' type='text/css' href='d3-helpers/d3-tip/examples/example-styles.css'>
<link rel='stylesheet' type='text/css' href='d3-helpers/widget.css'>
```

## Usage

### Constructor
<a name='constructorBarchart' href='#constructorBarchart'>#</a> new d3.__Barchart__(_id_)

Constructs a new Barchart widget with parent element set to the HTML element in the DOM with id _id_. Note that this does not modify the DOM.

### Methods
<a name='initialize' href='#initialize'>#</a> _chart_.__initialize__(_data_[, _options_])

Binds _data_ to _chart_ and renders a bar chart inside the widget's parent element.
* _data_ - an array of objects, each containing a unique `key` field and a numerical `value` field. Each object in _data_ will have a bar in the bar chart, with its label determined by its `key` field and its size determined by its `value` field
* _options_ - an object specifying various attributes of the rendering and widget
  * __width__ - the width, in pixels, of the widget. If falsy, the width of the widget will be the same as the width of the widget's parent element (default: `undefined`)
  * __height__ - the height, in pixels, of the widget (default: `400`)
  * __negColor__ - the color of bars with negative `value` fields (default: `'#dc3912'`)
  * __midColor__ - the color of bars with `value` fields near zero (default: `'lightgrey'`)
  * __posColor__ - the color of bars with positive `value` fields (default: `'#109618'`)
  * __numColors__ - the number of colors in the interpolation of __negColor__, __midColor__, and __posColor__ (default: `256`)
  * __colors__ - an array of colors for the bars (default: an interpolation from __negColor__ to __midColor__ to __posColor__ consisting of __numColors__ strings)
  * __byName__ - if truthy, determines bar ordering by comparing their `key` fields; otherwise, their `value` fields are compared (default: `true`)
  * __ascending__ - if truthy, sorts the bars ascending; otherwise, they are sorted descending (default: `true`)
  * __defaultDataMax__ - if `data` is empty, this value will be used to set the range of the x-axis (default: `0.75`)
  * __keyTooltipLabel__ - the label that describes the `key` field in the tooltip (default: `'Variable'`)
  * __valueTooltipLabel__ - the label that describes the `value` field in the tooltip (default: `'Coefficient'`)
  * __tooltipFormat__ - the function used to format the `value` field in the tooltip (default: `d3.format('.7')`)
  * __enableTransitions__ - if truthy, the widget will render/update with transitions; otherwise, the widget will render/update without transitions (default: `true`)

<a name='resize' href='#resize'>#</a> _chart_.__resize__([_width_[, _height_]])

If _width_ is truthy, sets the width (in pixels) of the widget to be _width_. Otherwise, the width of the widget doesn't change.  
If _height_ is truthy, sets the height (in pixels) of the widget to be _height_. Otherwise, the height of the widget doesn't change.

<a name='updateColors' href='#updateColors'>#</a> _chart_.__updateColors__([_negColor_[, _posColor_]])

If _negColor_ is truthy, updates the color of bars with negative `value` fields to be _negColor_. Otherwise, the color of bars with negative `value` fields doesn't change.  
If _posColor_ is truthy, updates the color of bars with positive `value` fields to be _posColor_. Otherwise, the color of bars with positive `value` fields doesn't change.

<a name='updateData' href='#updateData'>#</a> _chart_.__updateData__(_data_)

Binds _data_ to _chart_ and updates the bar chart accordingly. _data_ should be of the same form as described in <a href='#initialize'>initialize</a>.

<a name='updateSort' href='#updateSort'>#</a> _chart_.__updateSort__([_byName_[, _ascending_]])

If _byName_ is truthy, sorts the bars by their `key` fields. If _byName_ is falsy and not `null`, sorts the bars by their `value` fields. Otherwise if _byName_ is `null`, the sorting of the bars doesn't change.  
If _ascending_ is truthy, the bars are sorted in ascending order. If _ascending_ is falsy and not `null`, the bars are sorted in descending order. Otherwise if _ascending_ is `null`, the ordering of the bars doesn't change.

### Example
HTML element in the DOM:
```html
<div id='parent'></div>
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
var chart = new d3.Barchart('parent');
chart.initialize(data);
```
See <a href='https://github.com/alexrfling/barchart/blob/master/example.html'>example.html</a> for more example usage.
