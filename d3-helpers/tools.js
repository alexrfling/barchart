class Bucketizer {
  constructor(dividers, colors) {
    this.domain = dividers.map(function(d) { return d; }); // copy
    this.domain.push(Number.POSITIVE_INFINITY);
    this.range = colors;
  }

  bucketize(value) {
    for (var j = 0; j < this.domain.length - 1; j++) {
      if (value < this.domain[j] && value < this.domain[j + 1]) {
        return this.range[j];
      }
    }
    return this.range[this.range.length - 1];
  }
}
