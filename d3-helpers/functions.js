function sample(array, max) {
  if (array.length <= max) {
    return array;
  } else {
    var sampler = d3.scaleLinear().domain([0, max - 1]).range([0, array.length - 1]),
        sampledIndices = d3.range(max).map(function(i) { return Math.floor(sampler(i)); });
    return sampledIndices.map(function(i) { return array[i]; });
  }
}

function interpolateColors(low, mid, high, length) {
  var lowToMidF = d3.interpolateLab(low, mid),
      lowToMid = d3.range(Math.floor(length / 2))
                   .map(function(j) { return lowToMidF(j / Math.floor(length / 2)); }),
      midToHighF = d3.interpolateLab(mid, high),
      midToHigh = d3.range(Math.ceil(length / 2))
                    .map(function(j) { return midToHighF(j / Math.ceil(length / 2)); });
  return lowToMid.concat(midToHigh);
}
