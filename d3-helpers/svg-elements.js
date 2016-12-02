//==============================================================================
//                                GraphicalElement
//==============================================================================

class GraphicalElement {
  constructor(svg, id) {
    this.id = id;
    this.group = svg.append("g").attr("id", this.id);
    this.anchor = null;
  }

  position() {
    this.group.attr("transform", "translate(" + this.anchor[0] + "," + this.anchor[1] + ")");
  }

  getBox() {
    return document.getElementById(this.id).getBoundingClientRect();
  }
}

//==============================================================================
//                                    Cells
//==============================================================================

class Cells extends GraphicalElement {
  constructor(svg, id, data, key, x, y, width, height, fill) {
    super(svg, id);
    this.attrs = {
      x: x,
      y: y,
      width: width,
      height: height,
      fill: fill
    };
    this.updateData(data, key);
  }

  updateData(data, key) {
    this.group.selectAll("rect").remove();
    this.selection = this.group.selectAll("rect")
                      .data(data, key)
                      .enter()
                      .append("rect");
  }

  updateVis(attrs) {
    for (var j = 0; j < attrs.length; j++) {
      this.selection.attr(attrs[j], this.attrs[attrs[j]]);
    }
  }

  addListener(event, callback) {
    this.selection.on(event, callback);
  }
}

//==============================================================================
//                                    Labels
//==============================================================================

class Labels extends GraphicalElement {
  constructor(svg, id, className, names, margin, offset, angled, fontSize, orientation) {
    super(svg, id);
    this.names = names;
    this.margin = margin;
    this.offset = offset;
    this.angled = angled;
    this.fontSize = fontSize;
    this.factor = this.angled ? 0.75 : 1; // squish factor
    this.scale = d3.scalePoint();
    this.updateNames(this.names);
    this.group.attr("class", className).style("font-size", this.fontSize);
    switch(orientation) {
      case "top":     this.axis = d3.axisTop(this.scale);     break;
      case "left":    this.axis = d3.axisLeft(this.scale);    break;
      case "right":   this.axis = d3.axisRight(this.scale);   break;
      case "bottom":  this.axis = d3.axisBottom(this.scale);  break;
    }
    this.updateVisNT(); // for initial angling
  }

  updateNames(names) {
    this.names = names;
    this.scale.domain(sample(this.names, Math.floor(this.factor * this.margin() / this.fontSize)))
              .range([this.offset() / 2, this.margin() - this.offset() / 2]);
  }

  updateVis(animDuration) {
    this.updateNames(this.names);
    if (this.angled) {
      this.group.transition().duration(animDuration).call(this.axis)
             .selectAll("text")								 // to angle the other way:
             .style("text-anchor", "start")    // end
             .attr("dx", ".8em")               // -.8em
             .attr("dy", ".15em")              // .15em
             .attr("transform", "rotate(45)"); // rotate(-45)
    } else {
      this.group.transition().duration(animDuration).call(this.axis);
    }
  }

  updateVisNT() {
    this.updateNames(this.names);
    if (this.angled) {
      this.group.call(this.axis)
             .selectAll("text")								 // to angle the other way:
             .style("text-anchor", "start")    // end
             .attr("dx", ".8em")               // -.8em
             .attr("dy", ".15em")              // .15em
             .attr("transform", "rotate(45)"); // rotate(-45)
    } else {
      this.group.call(this.axis);
    }
  }
}

//==============================================================================
//                                    Title
//==============================================================================

class Title extends GraphicalElement {
  constructor(svg, id, text, fontSize) {
    super(svg, id);
    this.text = text;
    this.selection = this.group.append("text").attr("class", "title")
                      .style("font-size", fontSize).text(this.text);
  }

  setText(text) {
    this.text = text;
    this.selection.text(this.text);
  }
}
