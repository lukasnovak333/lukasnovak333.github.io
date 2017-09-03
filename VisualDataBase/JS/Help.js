// Helper functions for interactive search
// Top level helpers

// Array functions
function List(string) {
	  var toReturn = string.split(" ").sort();
	  for(var i = 0; i < toReturn.length; i++) {
		    if(toReturn[i] === "") toReturn.splice(i, 1);
	  }
	  return toReturn;
}
function isSorted(array, sortFunc) {
	  var thisCmp = sortFunc || simCmp;
	  for(var i = 0; i < array.length - 1; i++){
		    if(thisCmp(array[i], array[i+1]) > 0) 
			      return false;
	  }
	  return true;
}

function simCmp(a, b) {return a-b;}
function simEquals(a, b) {return a == b;}

function strStartLeftCmp(a, b) {
	  s1 = a.toUpperCase();
	  s2 = b.toUpperCase();
	  switch(true) {
		case (s1 === s2):
			  return 0;
		case (s2.startsWith(s1)):
			  return 0;
		case (s1.startsWith(s2)):
			  return 1;
		default:
			  return s1.localeCompare(s2);
	  }
}
function strRightCmp(a, b) {
	  var toReturn = 0;
	  s1 = a.toUpperCase();
	  s2 = b.toUpperCase();
	  if(s1.startsWith(s2)) {
		    if(s2.length === s1.length) 
			      toReturn = 0;
		    else 
			      toReturn = -1;
	  }
	  else if(s2.startsWith(s1)) {
		    toReturn = 1;
	  }
	  else
		    toReturn = s1.toUpperCase().localeCompare(s2.toUpperCase());
	  return toReturn;
}

// Basic Helpers
function reSort(sortFunc){
	  onIds.sort(sortFunc);
	  for(var str in onCats)
		    onCats[str].hits.sort(sortFunc);
}
function randPercent() {
	  return Math.random() * 100 + "%";
}
function objectLength(object) {
	  var i, count = 0;
	  for(i in object) {
		    if(object.hasOwnProperty(i))
			      count++;
	  }
	  return count;
}
function perToFloat(perString) {
	  return parseFloat(perString.slice(0, -1));
}
function keyArrayFromString(string) {
    if(string == "") return [];
	  str = string.replace("/s*/g", " ");
	  var arr = string.split(" ");
	  for(var i = 0; i < arr.length; i++) {
		    if(arr[i] == "") {
			      arr.splice(i--, 1);
			      console.log(arr);
		    }
	  }
	  return arr;
}
function lastPeriod(string) {
	  var char;
	  for(var len = string.length, i = 0; i < len; i++) {
		    if(string[i] == ".")
			      char = i;
	  }
	  return char;
}
