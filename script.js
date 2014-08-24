function formatTextareaInput(textareaValue) {
  var output = { nodes: [] }

  textareaValue = textareaValue.split('\n');

  textareaValue.forEach(function(line) {
    if (line === '') { return; };
    var lineObj = {};
    lineObj[line.split(' ')[0]] = line.split(' ')[1]
    output.nodes.push(lineObj);
  })

  return output;
}

function getGraphShareURL() {
  return location.href.replace(/\?.*\=.*$/, '') + '?data=' + escape($('.editor textarea').val());
}

function errorMsg(msg) {
  alert(msg);
}

function formatNodes(input) {
  var index = 0, targetString, indexMap = {}, formattedNodes = {
    nodes: [],
    links: []
  };

  // first create new structure for d3.layout.force
  input.nodes.forEach(function(node) {
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
  formattedNodes.links = formattedNodes.links.map(function(link) {

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

var width = $('.nodes').outerWidth(),
    height = $('.nodes').outerHeight()

var svg = d3.select(".nodes").append("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .gravity(.05)
    .distance(150)
    .charge(-1000)
    .chargeDistance(200)
    .size([width, height]);

function renderNodes(input) {
  svg.selectAll('*').remove();

  input = formatNodes(input);

  force
      .nodes(input.nodes)
      .links(input.links)
      .start();

  var link = svg.selectAll(".link")
      .data(input.links)
    .enter().append("line")
      .attr("class", "link");

  var node = svg.selectAll(".node")
      .data(input.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("circle")
      .attr("x", -15)
      .attr("y", -15)
      .attr("r", 30);

  node.append("text")
      .attr("dx", 0)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

  node.selectAll('text').attr('dx', function() {
    return -this.getComputedTextLength()/2;
  })

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
}

//-------------------------------
// Menu
//-------------------------------
var menuOpen = true;
$('.js-menu-toggle').click(function() {
  if (menuOpen) {
    $('.editor').hide();
  } else {
    $('.editor').show();
  }
  menuOpen = !menuOpen;
})

//-------------------------------
// Share
//-------------------------------
$('.js-share-box').hide();
var shareBoxOpen = false;
$('.js-share').click(function() {
  if (shareBoxOpen) {
    $('.js-share-box').hide();
  } else {
    $('.js-share-box').show();
    $('.js-share-box input').val(getGraphShareURL());
    $('.js-share-box input').focus();
  };
  shareBoxOpen = !shareBoxOpen;
});

$('.js-share-box input').focus(function() {
  this.select();
})

//-------------------------------
// Editor
//-------------------------------
$('.editor button').click(function() {
  var input = $('.editor textarea').val();

  if (input === undefined) {
    errorMsg('Error. No input!');
    return;
  };

  renderNodes(formatTextareaInput(input));
})

//-------------------------------
// Page load
//-------------------------------
$(function() {
  $('.editor button').click();

  // check url params
  var params = location.href.match(/\?data=(.*)/);
  if (!!params) {
    $('.editor textarea').val(decodeURIComponent(params[1]));
    $('.editor button').click();
  };
})