/* 
	 Filename: HTML.js
	 Common Name: HTML Module 
	 Description: A Module containing functions to add html, using d3
	 Author: Lukas Novak
	 Date: Aug 10, 2017
	 Dependencies: 
	 help.js
	 d3.js
*/ 

var HTML = (function() {

    function showLoadingScreen(id, filepath="./VisualDataBase/Data/Pictures/principedia.png") {
		    var svg = d3.select("body").append("svg")
					  .attr("xmlns", "http://www.w3.org/2000/svg")
					  .attr("id", "loadingSvg" + id)
					  .attr("class", "bigSvg loadingSvg");
		    var hold = svg.append("foreignObject")
			      .attr("id", "loadingSpace")
			      .attr("x", "40%")
			      .attr("y", "40%")
			      .attr("height", "100%")
			      .attr("width", "20%")
			      .attr("class", "loading");
		    var div = hold.append("xhtml:div")
			      .attr("height", "95%")
			      .attr("width", "95%")
			      .style("top", "0%");
		    var pic = div.append("xhtml:img")
			      .attr("src", filepath)
			      .attr("width", "100%")
			      .attr("height", "100%");
	  }
	  function removeLoadingScreen(id) {
		    d3.select("#loadingSvg" + id).remove();
	  }

    function makeDisplay(display) {
        display.svg = hiddenSVG(display.parent, display.idStr);
		    var baseGroup = putBaseGroup(display.svg, display.idStr);
		    putSideNavButton(display, baseGroup);
		    putSettingsButton(display, baseGroup);
		    putSearchBar(display, baseGroup);
		    putSettings(display);
		    putSideNav(display);

        var entries = display.vdb.entries;
        var nodes   = display.nodes;
        for(var len = entries.length, i = 0; i < len; i++)
            nodes.push(nodeFromEntry(entries[i], i, display));

        return display.svg;
	  }

	  return {
        showLoadingScreen   : showLoadingScreen,
        removeLoadingScreen : removeLoadingScreen,
        makeDisplay         : makeDisplay
	  }

    function nodeFromEntry(entry, id, display) {

		    var node = new Node(id);
        var svg = display.svg;

		    for(key in entry) {
			      if(entry.hasOwnProperty(key))
				        node[key] = entry[key];
		    }

		    node.group = svg.append("g")
		        .attr("id", display.idStr + "_group_" + node.id);

		    node.circle = node.group.append("circle")
		        .attr("id", display.idStr + "_node_" + node.id)
		        .attr("cx", Math.random() * 100 + "%")
		        .attr("cy", 110 + "%")
		        .attr("r",  1 + "%")
		        .attr("z-index", "1")
		        .style("fill", node.baseColor)
		        .style("stroke-width", "2px")
		        .style("stroke", "black");


		    node.circle.on('mouseover', function(d) {
			      d3.select("#" + display.idStr + "_nameSpace").text(node.name);
			      var newR = 1.25 * perToFloat(d3.select(this).attr("r"));
			      d3.select(this).attr("r", newR + "%");
			      display.showDescription(node);
		    });

		    node.circle.on('mouseleave', function(d){
			      d3.select("#" + display.idStr + "_nameSpace").text("");
			      var newR = .8 * perToFloat(d3.select(this).attr("r"));
			      d3.select(this).attr("r", newR + "%");
			      display.showDescription();
		    });

		    node.circle.on('click', function(d){
			      switch(true) {
				    case (node.link == undefined):
				    case (node.link == null):
				    case (node.link == ""):
					      break;
				    default:
					      window.open(node.link);
					      break;
			      }
		    });

		    makePanel(display, node);
		    return node;
	  }

    function hiddenSVG(parent, idStr) {
        console.log(parent);
		    var svg = parent.insert("svg", ".loadingSvg")
			      .attr("xmlns", "http://www.w3.org/2000/svg")
			      .attr("id", idStr + "_svg")
			      .attr("class", "bigSvg " + idStr)
			      .style("visibility", "hidden");
        console.log(svg);
		    return svg;
	  }
	  function putBaseGroup(svg, idStr) {
		    var baseGroup = svg.append("g")
		        .attr("id", idStr + "_baseGroup")
		        .attr("class", "baseGroup " + idStr);
        
		    return baseGroup;
	  }
	  function putSideNavButton(display, group) {
		    var idStr = display.idStr;
		    var sideNavButtonSpace =  group.append("foreignObject")
			      .attr("id", idStr + "_sideNavButtonSpace")
			      .attr("class", "sideNavSpace " + idStr)
			      .attr("x", "0%")
			      .attr("y", "0%")
			      .attr("height",  "50px")
		   	    .attr("width", "50px");

		    sideNavButtonSpace.append("xhtml:span")
			      .attr("id", idStr + "_sideNavButton")
			      .attr("class", "myButton " + idStr)
		        .html("&#9776;");

		    $("#" + idStr + "_sideNavButton").on("click", function() {
			      toggleNav(display);
		    });

		    return sideNavButtonSpace;
	  }
	  function putSettingsButton(display, group) {
		    var idStr = display.idStr;
		    var settingsButtonSpace = group.append("foreignObject")
			      .attr("id", idStr + "_settingsButtonSpace")
			      .attr("class", "settingsButtonSpace " + idStr)
			      .attr("x", "95%")
			      .attr("y", "0%")
			      .attr("height", "50px")
			      .attr("width", "50px");
		    settingsButtonSpace.append("xhtml:span")
			      .attr("id", idStr + "_settingsButton")
			      .attr("class", "myButton " + idStr)
			      .html("&#9881;");

		    $("#" + idStr + "_settingsButton").on("click", function(){
			      toggleSettings(display.idStr);
		    });

		    return settingsButtonSpace;
	  }
	  function putSearchBar(display, group) {
		    var idStr = display.idStr;
		    var searchBarSpace = group.append("foreignObject")
			      .attr("id", idStr + "_searchBar")
			      .attr("class", "searchBarSpace " + idStr)
			      .attr("x", "25%")
			      .attr("y", "10%")
			      .attr("height", "200px")
			      .attr("width", "50%"); 
			  
		    var form = searchBarSpace.append("xhtml:form")
			      .attr("id", idStr + "_searchform")
			      .attr("class", "searchForm " + idStr);

		    var searchBox = form.append("xhtml:input")
			      .attr("id", idStr + "_searchBox")
			      .attr("class", idStr + " searchBox")
			      .attr("type", "text")
			      .attr("autocomplete", "off")
			      .attr("placeholder", "")
			      .attr("z-index", "1");

		    $("#" + idStr + "_searchBox").bind("keyup", function() {
            console.log(this.value);
			      display.query(this.value);
		    });

		    return searchBarSpace;
	  }
	  function putSideNav(display) {
		    var sidenav = d3.select("body").insert("xhtml:div", ":first-child")
			      .attr("id", display.idStr + "_sideNav")
			      .attr("class", "sidenav " + display.idStr);

		    var resultsSpace = sidenav.append("xhtml:div")
			      .attr("id", display.idStr + "_resultsSpace")
			      .attr("class", "resultsSpace " + display.idStr);

		    var resultsTextSpace = resultsSpace.append("xhtml:div")
			      .attr("id", display.idStr + "_resultsTextSpace")
			      .attr("class", "titleSpace " + display.idStr);

		    var resultsText = resultsTextSpace.append("xhtml:font")
			      .attr("id", display.idStr + "_searchResultsText")
			      .attr("color", "white")
			      .attr("size", "+2")
			      .html("Search Results:");

		    resultsTextSpace.append("xhtml:br");

		    var resultsBox = resultsSpace.append("xhtml:div")
			      .attr("id", display.idStr + "_resultsBox")
			      .attr("class", "textBox resultsBox " + display.idStr);

		    sidenav.append("xhtml:br");
		    sidenav.append("xhtml:br");

		    var nameSpace = sidenav.append("xhtml:div")
			      .attr("id", display.idStr + "_nameSpace")
			      .attr("class", "nameSpace " + display.idStr);
	  }
	  function putSettings(display) {
		    var settings = d3.select("body").insert("xhtml:div", "svg")
			      .attr("id", display.idStr + "_mySettings")
			      .attr("class", "settingsSpace " + display.idStr);


		    var sort =  settings.append("xhtml:font")
			      .html("Sort:      ");

		    var sortSelect = settings.append("xhtml:select")
			      .attr("id", display.idStr + "_sortSelect")
            .attr("class", "settingsSelect " + display.idStr)
			      .attr("autocomplete", "OFF");

		    settings.append("xhtml:br");

		    var color = settings.append("xhtml:font")
			      .html("Color:     ");

		    var colorSelect = settings.append("xhtml:select")
			      .attr("id", display.idStr + "_colorSelect")
            .attr("class", "settingsSelect " + display.idStr)
			      .attr("autocomplete", "OFF");

		    settings.append("xhtml:br");

		    var category = settings.append("xhtml:font")
			      .html("Categorize:");

		    var categorySelect = settings.append("xhtml:select")
			      .attr("id", display.idStr + "_categorySelect")
            .attr("class", "settingsSelect " + display.idStr)
			      .attr("autocomplete", "OFF");


		    console.log(display.colorKeys);
		    newOption(display, colorSelect, "color", "Nothing", true);
		    for(var key of display.colorKeys) 
			      newOption(display, colorSelect, "color", key);

		    newOption(display, sortSelect, "sort", "Nothing", true);
		    for(var key of display.sortKeys) 
			      newOption(display, sortSelect, "sort", key);

		    newOption(display, categorySelect, "category", "Nothing", true);
		    for(var key of display.catKeys)
			      newOption(display, categorySelect, "category", key);

		    $("#" + display.idStr + "_sortSelect").on("change", function(){
			      var key = $("#" + display.idStr + "_sortSelect option").filter(":selected").text();
			      //console.log("CHOSE TO SORT BY " + key);
            display.modeDict.sort = key;
            display.comparator = display.vdb.cmpDict[display.modeDict.sort];
			      display.reSort();
			      display.newFrame(display.onIds);
		    });

		    $("#" + display.idStr + "_colorSelect").on("change", function(){
			      var key = $("#" + display.idStr + "_colorSelect option").filter(":selected").text();
			      display.modeDict.color = key;
			      display.reColor();
		    });

		    $("#" + display.idStr + "_categorySelect").on("change", function(){
			      var key = $("#" + display.idStr + "_categorySelect option").filter(":selected").text();
			      display.modeDict.category  = key;
			      display.newFrame(display.onIds);
		    });

	  }
	  function newOption(display, htmlSelect, type, key, selected=false) {
		    var opt = htmlSelect.append("xhtml:option")
			      .attr("id", display.idStr + "_" + type + "By_" + key)
			      .attr("class", display.idStr + " " + type + "Option")
			      .text(key);

			  if(selected)
				    opt.attr("selected", "selected");
	  }
	  function makePanel(display, node) {
        var resultsSpace = d3.select("#" + display.idStr + "_resultsBox");
		    node.panel = resultsSpace.append("xhtml:div")
				    .attr("id", display.idStr + "_panel_" + node.id)
				    .attr("class", "resultPanel " + display.idStr);

		    node.panelText = node.panel.append("xhtml:div")
			      .attr("class", "panelText " + display.idStr)
			      .text(node.NAME);

		    node.panelLink = node.panel.append("xhtml:div")
			      .attr("class", "panelLink " + display.idStr)
			      .style("visibility", "hidden");
		    node.principediaLink = node.panelLink.append("xhtml:a")
			      .attr("href", "http://principedia.princeton.edu/")
			      .style("position", "absolute")
			      .style("height", "100%");
		    node.principediaLink.append("xhtml:img")
			      .attr("src", "./VisualDataBase/Data/Pictures/principedia.png")
			      .attr("class", "panelLinkPic " + display.idStr);

		    node.panel.on('mouseenter', function(d) {
			      node.panelLink.style("visibility", "visible");
			      node.panelLink.style("opacity", ".9");
			      display.showDescription(node);
			      hover("#" + display.idStr + "_node_" + node.id);
		    });

		    node.panel.on('mouseleave', function(d) {
			      node.panelLink.style("visibility", "hidden");
			      node.panelLink.style("opacity", "0.0");
			      display.showDescription();
			      hoverOff("#" + display.idStr + "_node_" + node.id);
		    });
	  }

	  function toggleNav(display) {
		    var displayId = display.idStr;
		    var sideNav = document.getElementById(displayId + "_sideNav");
		    var button = d3.select("#" + displayId + "_sideNavButtonSpace");
		    var bar = d3.select("#" + displayId + "_searchBar");
		    if(sideNav.style.left == "0%") {
			      sideNav.style.left  = "-25%";
			      display.left = 5;
			      display.wid = 90;
			      button.transition()
				        .duration(500)
				        .attr("x", "0%");
			      bar.transition()
				        .duration(500)
				        .attr("x", "25%")
				        .attr("width", "50%");
			      display.resizeResults();
		    }
		    else {
			      sideNav.style.left  = "0%";
			      display.left = 30;
			      display.wid =  65;
			      button.transition()
				        .duration(500)
				        .attr("x", "25%");
			      bar.transition()
				        .duration(500)
				        .attr("x", (25 + 75/4) + "%")
				        .attr("width", (75/2) + "%");
			      display.resizeResults();
		    }
	  }
	  function toggleSettings(displayId) {
		    var settingNav = document.getElementById(displayId + "_mySettings");
		    if(settingNav.style.top == "-18%")
			      settingNav.style.top = "5%";
		    else 
			      settingNav.style.top  = "-18%";
	  }

	  function adjustNode(vdb, id, x, y, r, type) {
		    var elem = courses[id].circle;
		    var oldX = parseFloat(elem.attr("cx").slice(0, -1));
		    var oldY = parseFloat(elem.attr("cy").slice(0, -1));
		    var newX, newY;
		    switch(type) {
			  case "shift":
				    newX = oldX + x;
				    newY = oldY + y;
				    break;
			  case "put":
				    newX = x;
				    newY = y;
				    break;
			  default:
		    }

		    elem.transition()
			      .duration(500)
			      .attr("cx", newX + "%")
			      .attr("cy", newY + "%")
			      .attr("r", r + "%");
	  }
	  function hover(elemString) {
		    var elem = $(elemString);
		    elem.css("opacity", ".75");
		    var oldR = parseFloat(elem.attr("r").slice(0, -1));
		    elem.attr("r", (1.25 * oldR) + "%");
	  }
	  function hoverOff(elemString) {
		    var elem = $(elemString);
		    elem.css("opacity", "1.0");
		    var oldR = parseFloat(elem.attr("r").slice(0, -1));
		    elem.attr("r", .8 * oldR + "%");
	  }	
	  function Node(id) {
		 	  this.id = id;

			  this.group = null;
			  this.panelSvg = null;
			  this.panelRect = null;
			  this.bigTitle = null;
			  this.smallTitle = null;
			  this.circle = null;

			  this.panelSlot = -1;
			  this.type = NaN;

			  this.onR = .5;
			  this.onX = 50;
			  this.onY = 50;
			  this.onColor = "black";

			  this.baseR = .5;
			  this.baseX = 50;
			  this.baseY = 50;
			  this.baseColor = "white";

			  this.on = false;
	  }
}());
