/* 
	 Filename: Display.js
	 Common Name: View Module 
	 Description: A Module containing display functions
	 Author: Lukas Novak
	 Date: Aug 10, 2017
	 Dependencies: 
	 help.js
*/ 

var View = (function() {
	  /* Methods */
    function Display(vdb, id, DOM_String) {
		    this.id = id;
		    this.vdb = vdb;
		    this.idStr = "vdb" + vdb.id + "_display" + this.id;

        	this.parent = d3.select(DOM_String);

		    this.on = false;

		    this.top = 25;
		    this.left = 5;
		    this.wid = 90;
		    this.hei = 60;
		    this.maxR = 3;
		    this.padFactor = 5;
		    this.colorScheme = ["red", "blue", "purple", "green", "black"];

		    this.modeDict = { "sort"     : "Nothing",
                          "color"    : "Nothing",
                          "position" : "Nothing",
                          "category" : "Nothing"};

		    this.sortKeys =[];
		    this.catKeys = [];
		    this.colorKeys = [];

        for(var header in vdb.keyInfo) {
			      var key = vdb.keyInfo[header];
			      if(key['sortable']) 
				        this.sortKeys.push(header);
			      if(key['colorable']) 
				        this.colorKeys.push(header);
			      if(key['category']) 
				        this.catKeys.push(header);
        }

        this.comparator = vdb.cmpDict["NAME"];
        this.nodes = [];
	    this.onIds = [];
	    this.onCats = {};
	    this.dispCats = [];

        this.searchTimeout = undefined;
        this.displayTimeout = undefined;
        this.busyQuerying = false;

        this.svg =  HTML.makeDisplay(this);
	  }

    Display.prototype.query     = function(key) {
        var display = this;
        clearTimeout(display.displayTimeout);
		clearTimeout(display.searchTimeout);

        display.searchTimeout = setTimeout(function() {
            display.busyQuerying = false;
        }, 50);

		    if(display.busyQuerying) {
			      display.displayTimeout = setTimeout( function() {
                display.newFrame(display.vdb.query(key, display.comparator));
            }, 50);
		    }
		    else {
			      display.busyQuerying = true;
            display.newFrame(display.vdb.query(key, display.comparator));
		    }
    }

    Display.prototype.newFrame = function(results) {
        if(results == true) return;
        // Logic for replacing onIds
        this.refresh(results);
		    this.putPanels();
		    this.buildCats();
		    this.putCats();
		    this.putNodes();
    }

    Display.prototype.isVisible = function() {
		    return this.on;
	  }
	  Display.prototype.toggle = function() {
		    var mode = this.svg.style("visibility");
		    if(mode == "visible") {
			      this.svg.style("visibility", "hidden");
			      this.on = false;
		    }
		    else {
			      this.svg.style("visibility", "visible");
			      this.on = true;
		    }
	  }
    Display.prototype.start = function() {
        this.reColor();
        this.pileNodes();
        this.show();
    }
	  Display.prototype.show = function() {
		    if(!this.isVisible())
			      this.toggle();
		}

	  Display.prototype.showDescription = function(node="") {
		    if(node == "") {
			      d3.select("#" + this.idStr + "_nameSpace").html("");
			      return;
		    }
		    else {
			      descString = "";
			      for(prop in node) {
				        if(node.hasOwnProperty(prop)) {
					          if(this.vdb.validKeys[prop]) {
						            if((prop != "") & (prop != "id")) {	
							              descString += ("<b size='+2'>" + prop + ":</b> " + node[prop]);
							              descString += "<br/>";
						            }
					          }
				        }
			      }
			      d3.select("#" + this.idStr + "_nameSpace").html(descString);
		    }
	  }
	  Display.prototype.rehashBaseGroup = function() {
		    var searchBar = d3.select("#" + this.idStr + "_searchBar");
		    var settingsButt = d3.select("#" + this.idStr + "_settingsButtonSpace");
		    var sidenavButt = d3.select("#" + this.idStr + "_sideNavButtonSpace");

		    searchBar.attr("x", (this.left + .25 * this.wid) + "%");
		    searchBar.attr("width", this.wid / 2 + "%");

		    settingsButt.attr("x", (this.left - 5) + "%");
		    sidenavButt.attr("x", (this.left + this.wid) + "%");
	  }
	  Display.prototype.refresh = function(newOnIds) {
		    var idsToPull = this.onIds.sortedDelete(newOnIds, this.comparator);
		    for(var len = idsToPull.length, i = 0; i < len; i++) { 
			      this.outNode(this.nodes[idsToPull[i]]);
			      this.outPanel(this.nodes[idsToPull[i]]);
		    }
		    this.onIds = newOnIds;
		    d3.select("#" + this.idStr + "_resultsText").text(newOnIds + " Search Results:");
	  }

	  Display.prototype.putPanels = function(toPut = undefined ) {
		    var onIds = toPut || this.onIds;
		    var entries = this.nodes;
		    for(var len = onIds.length, i = 0; i < len; i++)
			      this.inPanel(entries[onIds[i]], i);
	  }
    Display.prototype.pullPanels = function(toPull = undefined) {
        var panelsToPull = toPull || this.onIds;
        for(var len = panelsToPull.length, i = 0; i < len; i++)
            this.outPanel(this.nodes[panelsToPull[i]]);
    }

	  Display.prototype.buildCats  = function () {
		    this.onCats = {};
		    for(var len = this.onIds.length, i = 0; i < len; i++)
			    this.inCat(this.onIds[i]);
		    this.dispCats = displayArray(this);
	  }

	  function displayArray(display) {
		    var cats = display.onCats;
		    var MAX_CATS = 3;

		    var catArr = [];
		    for(var entry in cats)
			      catArr.inSort(cats[entry], catSizeCmp);

		    if(catArr.length <= MAX_CATS)
			      return catArr;

		    var newArr = catArr.slice(0, MAX_CATS);
		    newArr.push(emptyCat("Misc"));

		    for(var i = MAX_CATS; i < catArr.length; i++) {
			      for(var j = 0; j < catArr[i].hits.length; j++)
				        newArr[MAX_CATS].hits.inSort(catArr[i].hits[j], display.comparator);
		    }

		    return newArr;
	  }

	  Display.prototype.inCat = function(id) {
		    var cat;
		    var node = this.nodes[id];
		    var catKey = this.modeDict["category"];
		    var onCats = this.onCats;
		    if(catKey == "Nothing")
			      cat = "NO_CAT";
		    else 
			      cat = node[catKey]; 
		    if(onCats[cat] === undefined)
			    onCats[cat] = {
			    	'title': cat,
			    	'hits': [],
			    };
		    onCats[cat].hits.inSort(id, this.comparator);
	  }
	  Display.prototype.putCats  = function () {
		    dispCatsFromScratch(this);
	  }

	  function catSizeCmp(catA, catB) {
		    return catB.hits.length - catA.hits.length;
	  }


    Display.prototype.reCat  = function() {
    }
    Display.prototype.reSort = function() {
        console.log("before sort");
        console.log(this.onIds);
        this.onIds.sort(this.comparator);
        console.log("after sort");
        console.log(this.onIds);
    }

	  // Color functions 
	  Display.prototype.reColor = function() {
        var nodes = this.nodes;
		    var colorMode = this.modeDict.color;
		    for(var len = nodes.length, i = 0; i < len; i++) {
			      var color, entry = nodes[i];
			      if(colorMode == "Nothing") 
				        color = "white";
            else if (colorMode == "RATING")
                color = ratingToColor(entry.RATING);
			      else 
				        color = keyToColor(colorMode, entry[colorMode], this.vdb);
     	      entry.onColor = color;
			      entry.baseColor = color;
			      color = (color == "black")? "white":color;
			      entry.panel.style("background-color", color);

			      if(!entry.on)
				        this.outNode(entry);
			      else
				        this.inNode(entry);
		    }
	  }

    function keyToColor(key, value, vdb) {
        var min = parseFloat(vdb.keyInfo[key]['min']);
        var max = parseFloat(vdb.keyInfo[key]['max']);
        var range = max - min;
        var colorInt = Math.floor(5 * value / range);
        console.log("checking value " + value + "for key " + key);
        console.log("min is " + min + "and max is " + max);
        console.log("colorInt is " + colorInt);
        switch(true) {
        case (colorInt < 0):
            return "white";
        case (colorInt < 1): 
				    return "#ff0000";
			  case (colorInt < 2): 
				    return "#f36c28";
			  case (colorInt < 3): 
				    return "#e09e4a";
			  case (colorInt < 4): 
				    return "#c2c86d";
			  case (colorInt >= 4): 
				    return "#90ee90";
			  default:
				    return "white";
        }
    }

	  function ratingToColor(rating) {
		    var ratingInt = Math.floor(rating*2) / 2;
		    switch(true) {
        case (ratingInt < 0):
            return "white";
			  case (ratingInt < 1): 
				    return "#ff0000";
			  case (ratingInt < 2.5): 
				    return "#f36c28";
			  case (ratingInt < 3.5): 
				    return "#e09e4a";
			  case (ratingInt < 4.5): 
				    return "#c2c86d";
			  case (ratingInt >= 4.5): 
				    return "#90ee90";
			  default:
				    return "white";
		    }
	  }
	  function levelToColor(level) {
		    if(typeof level == "string")
			      level = parseFloat(level);
		    switch(level) {
			  case 1: 
				    return "#90ee90";
			  case 2: 
				    return "#c2c86d";
			  case 3: 
				    return "#e09e4a";
			  case 4: 
				    return "#f36c28";
			  case 5: 
				    return "#ff0000";
			  default:
				    return "white"
		    }
	  }

	  // Panel Functions
	  Display.prototype.inPanel = function(entry, slot) {
		    entry.panel.style("left", "0%");
		    entry.panel.style("top", 15 + slot * 60 + "px");
	  }
	  Display.prototype.outPanel = function(entry) {
		    entry.panel.style("left", "-110%");
	  }

	  // Node helpers
	  function reNode(entry, x, y, r, color) {
		    entry.onX = x;
		    entry.onY = y;
		    entry.onR = r;
		    entry.onColor = color;
	  }
	  Display.prototype.inNode = function(entry) {
		    entry.on = true;
		    entry.circle
			      .transition()
			      .duration(500)
			      .attr("cx", entry.onX + "%")
			      .attr("cy", entry.onY + "%")
			      .attr("r", entry.onR + "%")
			      .style("fill", entry.onColor);
	  }
	  Display.prototype.outNode = function(entry) {
		    entry.on = false;
		    entry.circle
			      .transition()
			      .duration(500)
			      .attr("cx", entry.baseX + "%")
			      .attr("cy", entry.baseY + "%")
			      .attr("r", entry.baseR + "%")
			      .style("fill", entry.baseColor);
	  }

	  // Passive display
	  Display.prototype.pileNodes = function() {
		    var entries = this.nodes;
		    for(var len = entries.length, i = 0; i < len; i++) {
			      var entry = entries[i];
			      entry.baseX = this.left + Math.random() * this.wid;
			      entry.baseY = 95 + Math.random() * 5;
			      entry.baseR = Math.random() * 1;
			      entry.baseColor = "white";
			      if(!entry.on)
				        this.outNode(entry);
		    }
	  }
	  Display.prototype.putNodes  = function () {
		    var entries = this.nodes;
		    var dispCats = this.dispCats;
		    var catSpacer = this.wid / dispCats.length;

		    for(var catInd = 0; catInd < dispCats.length; catInd++) {

			      var cat = dispCats[catInd];
			      var len = cat.hits.length;
			      var offSet = catSpacer * catInd;
			      var catLeft = this.left + offSet;
			      var catTop = this.top;
			      var catWid = catSpacer;
			      var catHei = this.hei;

			      var boxFactor = .90;
			      var wid = boxFactor * catWid;
			      var hei = boxFactor * catHei;
			      var top = catTop + ((1 - boxFactor)/2) * catHei;
			      var left = catLeft + ((1 - boxFactor)/2) * catWid;

			      var rowCounts = [];
			      var rowSpacers = [];
			      var xSpacer;
			      var ySpacer;
			      var Xs = [];
			      var Ys = [];
			      var Rs = [];
			      var maxR = this.maxR;
			      var padFactor = this.padFactor;

			      switch(this.modeDict.position) {
				    case "level":
					      // Global stuff
					      rowCounts = [0, 0, 0, 0, 0];
					      cat.hits.forEach(function(id) {
						        rowCounts[entries[id].level]++;
					      });

					      rowSpacers = [0, 0, 0, 0, 0];
					      for(var i = 0; i < rowCounts.length; i++)
						        rowSpacers[i] = wid / rowCounts[i];

					      xSpacer = Math.min(...rowSpacers);
					      ySpacer = hei / 5;
					      newR = Math.min(xSpacer, ySpacer) / padFactor;
					      newR = Math.min(newR, maxR);

					      // Local Stuff
					      var rowIndices = [0, 0, 0, 0, 0];
					      for(var len = cat.hits.length, i = 0; i < len; i++) {
						        var node = entries[cat.hits[i]];
						        Xs.push(left + newR + (rowIndices[node.level] + 1/2) * xSpacer);
						        Ys.push(top + hei - newR - (node.level + 1/2) * ySpacer);
						        Rs.push(newR);
						        rowIndices[node.level]++;
					      }
					      break;
				    case "rating":
						    //Global stuff
					      rowCounts = [0, 0, 0, 0, 0];
					      cat.hits.forEach(function(id) {
						        rowCounts[Math.floor(entries[id].rating)]++;
					      });

					      rowSpacers = [0, 0, 0, 0, 0];
					      for(var i = 0; i < rowCounts.length; i++)
						        rowSpacers[i] = wid / rowCounts[i];

					      xSpacer = Math.min(...rowSpacers);
					      ySpacer = hei / 5;
					      newR = Math.min(xSpacer, ySpacer) / padFactor;
					      newR = Math.min(newR, maxR);

					      var node, rate, rowIndices = [0, 0, 0, 0, 0];
					      for(var len = cat.hits.length, i = 0; i < len; i++) {
						        node = entries[cat.hits[i]];
						        rate = Math.floor(node.rating);
						        Xs.push(left + newR + (rowIndices[rate] + 1/2) * xSpacer);
						        Ys.push(top + hei - newR - (rate) * ySpacer);
						        Rs.push(newR);
						        rowIndices[rate]++;
					      }
					      break;
				    case "constellation":
					      for(var len = cat.hits.length, i = 0; i < len; i++) {
						        Xs.push(left + Math.random() * wid);
						        Ys.push(top + Math.random() * hei);
						        Rs.push(Math.random());
					      }
					      break;
				    default:
					      var lengthWise = (wid > hei)? true:false;
					      var longLength = (lengthWise)? wid:hei;
					      var rectRatio  = (lengthWise)? wid/hei : hei/wid;
					      var shortSide = Math.ceil(Math.sqrt(len / rectRatio));
					      var longSide  = Math.ceil(shortSide * rectRatio);
					      var colNum = (lengthWise)? longSide:shortSide;
					      var rowNum = (lengthWise)? shortSide:longSide;
					      if(len === 1) {
						        colNum = 1;
						        rowNum = 1;
					      }
					      var colWid = wid / colNum;
					      var rowHei = hei / rowNum;

					      newR = longLength / (longSide * padFactor);
					      newR = Math.min(newR, maxR);

					      // Local stuff
					      for(var i = 0; i < rowNum; i++) {
						        for(var j = 0; j < colNum; j++) {
							          Xs.push(left + (j+1/2)*colWid);
							          Ys.push(top  + (i+1/2)*rowHei);
							          Rs.push(newR);
						        }
					      }

					      console.log("Xs as" + Xs);
					      console.log("Ys as" + Ys);

					      break;
			      }

			      for(var len = cat.hits.length, i = 0; i < len; i++) {
			          // console.log("placing " + i + "th node, id=" + cat.hits[i] + ", at (" + Xs[i] + ", " + Ys[i] + ")");
			          // console.log("in box of left: " + left + " and width: " + catWid);
				        var id = cat.hits[i];
				        reNode(entries[id], Xs[i], Ys[i], Rs[i], entries[id].onColor);
				        this.inNode(entries[id]);
			      }
		    }
	  }

	  /* Noise from cat positioning */
	  function putCats(display) {
		    dispCatsFromScratch(display);
		    return;
	  }
	  function dispCatsFromScratch(display) {
		    d3.selectAll(".catRect." + display.idStr).remove();
		    d3.selectAll(".catText." + display.idStr).remove();

		    var dispCats = display.dispCats;
		    var numCats = dispCats.length;
		    var catSpacer = display.wid / numCats;
        	console.log(dispCats);
		    for(var i = 0; i < numCats; i++) {
			      var cat = dispCats[i];
			      var offSet = catSpacer * i;
			      var catLeft = display.left + offSet;
			      var catTop = display.top;
			      var catWid = catSpacer;
			      var catHei = display.hei;

			      if(cat.title != "NO_CAT") {
				        display.svg.insert("rect", "g")
					          .attr("id", "catRect_" + cat.title)
					          .attr("class", "catRect " + display.idStr)
					          .attr("x", catLeft + "%")
					          .attr("y", catTop + "%")
					          .attr("width", catWid + "%")
					          .attr("height", catHei + "%")
					          .style("opacity", ".15")
					          .style("fill", display.colorScheme[i])
					          .style("position", "absolute")
					          .style("z-index", "-1")
					          .style("stroke-width", "4px")
					          .style("stroke", "black");
				        display.svg.insert("foreignObject", "#sidenavButton")
					          .attr("id", "catText_" + cat.title.replace(" ", ""))
					          .attr("class", "catText " + display.idStr)
					          .attr("x", catLeft + 2 + "%")
					          .attr("y", (catTop + catHei -  7.5)+ "%")
					          .attr("width", catWid + "%")
					          .attr("height", 10 + "%");
                		console.log($("#catText_" + cat.title));
				        $("#catText_"+cat.title.replace(" ", "")).append(
					          "<div class='' style='color:black'>" + 
					              cat.title + 
					              "</div");
			      }	
		    }
	  }
	  function disappearCat(rect, text) {
		    console.log("DISAPPEARING " + d3.select(text).text());
		    r = d3.select(rect);
		    t = d3.select(text);
		    r.remove();
		    t.remove();
	  }
	  function rearrangeCat(rect, text, slot, top, left, hei, wid) {
		    r = d3.select(rect);
		    t = d3.select(text);
		    r.transition()
			      .duration(100)
			      .attr("x", left +"%")
			      .attr("y", top + "%")
			      .attr("width", wid + "%")
			      .attr("height", hei + "%")
			      .style("fill", colorScheme[slot]);
		    t.transition()
			      .duration(100)
			      .attr("x", left + "%")
			      .attr("width", wid + "%")
			      .attr("height", 5 + "%");
	  }
	  function makeRectCat(cat, slot, top, left, hei, wid) {
		    rect = d3.select("#svg").insert("rect", "#sidenavButton")
					  .attr("id", "catRect_" + cat.title)
					  .attr("class", "catRect")
					  .attr("x", left + "%")
					  .attr("y", top + "%")
					  .attr("width", 0 + "%")
					  .attr("height", hei + "%")
					  .style("opacity", ".15")
					  .style("fill", colorScheme[slot])
					  .style("position", "absolute")
					  .style("z-index", "-1")
					  .style("stroke-width", "4px")
					  .style("stroke", "black");
		    text = d3.select("#svg").insert("foreignObject", "#sidenavButton")
					  .attr("id", "catText_" + cat.title)
					  .attr("class", "catText")
					  .attr("x", (left) + "%")
					  .attr("y", (top - 5)+ "%")
					  .attr("width", 0 + "%")
					  .attr("height", 5 + "%");
				$("#catText_"+cat.title).append(
					  "<div class='' style='color:white'>" + 
					      cat.title + 
					      "</div");
		    rect.transition()
			      .duration(250)
			      .attr("width", wid + "%");
		    text.transition()
			      .duration(250)
			      .attr("width", wid + "%");
	  }

	  Display.prototype.resizeResults = function() {
		    var idStr = this.idStr;
		    var rectArray = d3.selectAll(".catRect." + idStr)._groups[0];
		    var textArray = d3.selectAll(".catText." + idStr)._groups[0];
		    var numRects = rectArray.length;
		    var numTexts = textArray.length;
		    var spacer = this.wid / numRects;

		    for(var i = 0; i < numRects; i++) {
			      d3.select(rectArray[i]).transition()
				        .duration(500)
				        .attr("x", (this.left + (i*spacer))+ "%")
				        .attr("width", spacer + "%");
			      d3.select(textArray[i]).transition()
				        .duration(500)
				        .attr("x", (this.left + (i*spacer)) + "%")
				        .attr("width", spacer + "%");
		    }
		    this.pileNodes();
		    this.putNodes();
	  }
    return {
		    Display:Display
	  }

}());
