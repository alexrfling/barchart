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
**Barchart**(_id_)

Constructs a new Barchart widget with parent element set to the HTML element in
the DOM with id _id_. Note that this does not modify the DOM.

### Call
```js
var chart = new Barchart(id);
chart.initialize(data, options);
```

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
See example.html for more example usage.

## Parameters

### Required
<b>id</b> - the 'id' attribute of the HTML element to which the bar chart will
be appended

<b>data</b> - an array of objects, each with a `key` and `value` field

### Optional
<b>width</b> - the width, in pixels, of the widget. If not given, the width
of the widget will be the same as the width of the HTML element with id `id`

<b>height</b> - the height, in pixels, of the widget (default: `400`)

<b>negColor</b> - string representing the color for data with negative values
(default: `'#dc3912'`)

<b>posColor</b> - string representing the color for data with positive values
(default: `'#109618'`)

<b>byName</b> - if truthy, determines bar ordering by comparing the `key` fields
of each object; otherwise, the `value` fields are compared (default: `true`)

<b>ascending</b> - if truthy, sorts the bars ascending; otherwise, they are
sorted descending (default: `true`)

<b>defaultDataMax</b> - if `data` is empty, this value will be used to set the
range of the x-axis (default: `0.75`)

<b>keyTooltipLabel</b> - the label that describes the `key` field in the tooltip
(default: `'Variable'`)

<b>valueTooltipLabel</b> - the label that describes the `value` field in the
tooltip (default: `'Coefficient'`)

<b>tooltipFormat</b> - the function used to format the `value` field in the
tooltip (default: `d3.format('.7')`)
