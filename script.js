function formatNodesJSON(json) {
  var index = 0, targetString, indexMap = {}, formattedNodes = {
    nodes: [],
    links: []
  };

  // first create new structure for d3.layout.force
  json.nodes.forEach(function(node) {
    targetString = node[Object.keys(node)[0]];

    if (!indexMap.hasOwnProperty(Object.keys(node)[0])) {
      indexMap[Object.keys(node)[0]] = index;

      formattedNodes.nodes.push({
        name: Object.keys(node)[0],
        group: 0 // all in the same group
      })
      index += 1; // only increment if we're actually adding to the nodes array
    };

    formattedNodes.links.push({
      source: indexMap[Object.keys(node)[0]],
      target: targetString,
      value: 1 // dunno what this is for
    })
  });

  // then map all target indexes
  formattedNodes.links = formattedNodes.links.map(function(link, index) {

    // this target is not also a source
    if (indexMap[link.target] === undefined) {

      // add it as a reversed version of itself, target<->source
      formattedNodes.nodes.push({
        name: link.target,
        group: 0
      })
      formattedNodes.links.push({
        source: formattedNodes.nodes.length-1, // this is the last element added
        target: link.source,
        value: 1
      })

      // we also need to update the indexMap
      if (!indexMap.hasOwnProperty(link.target)) {
        indexMap[link.target] = formattedNodes.nodes.length-1;
      }
    };


    link.target = indexMap[link.target];
    return link;
  });

  // then remove all links that has no target
  for (var i = formattedNodes.links.length - 1; i >= 0; i--) {
    if (formattedNodes.links[i] === null) {
      formattedNodes.links.splice(i, 1);
    };
  };

  return formattedNodes
}

var width = 960,
    height = 500

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .gravity(.05)
    .distance(100)
    .charge(-100)
    .size([width, height]);

d3.json("nodes.json", function(error, json) {

  json = formatNodesJSON(json);

  console.log(json);

  force
      .nodes(json.nodes)
      .links(json.links)
      .start();

  var link = svg.selectAll(".link")
      .data(json.links)
    .enter().append("line")
      .attr("class", "link");

  var node = svg.selectAll(".node")
      .data(json.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("image")
      .attr("xlink:href", "https://github.com/favicon.ico")
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16);

  node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
});