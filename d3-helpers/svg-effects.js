// need to use additional CSS to use this, e.g.:
//    rect:hover {
//      filter: url("#shadow");
//    }
function addDropShadowFilter(svg, id) {
  var filter = svg.append("filter")
                  .attr("id", id)
                  .attr("x", -2)
                  .attr("y", -2)
                  .attr("width", 10)
                  .attr("height", 10);
  filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 4);
  filter.append("feOffset").attr("dx", 0).attr("dy", 0);
  var filterMerge = filter.append("feMerge");
  filterMerge.append("feMergeNode");
  filterMerge.append("feMergeNode").attr("in", "SourceGraphic");
}
