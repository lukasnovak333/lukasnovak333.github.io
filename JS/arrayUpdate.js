// Array prototypes for interactive search

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
Array.prototype.inSort = function(element, cmpFunc) {
    var sort = cmpFunc || simCmp;
	this.splice(sortedIndex(this, element, sort), 0, element);
}
Array.prototype.sortedContains = function(element, cmpFunc) {
    var sort = cmpFunc || simCmp;
	return (binarySearch(this, element, sort) > -1);
}
Array.prototype.sortedMinimalIntersection = function(list, cmpFunc) {
    var cmp = cmpFunc || simCmp;
    var max = Math.min(list.length, this.length);
    if(list.length == 0) return [];

    if(!isSorted(this, cmp))
        alert("ERROR");
    if(!isSorted(list, cmp))
        alert("ERROR");

    var shortList = (this.length < list.length)? this:list;
    var longList = (this.length < list.length)?  list:this;
    var len = shortList.length;

    var newList = [];
    var longInd = 0;
    var compared;

    // console.log("INTERSECTING...");
    // console.log("This: " + this);
    // console.log("With this: " + list);

    for(var i = 0; i < len; i++) {
        if(longInd >= longList.length)
            return newList;
        else if(newList.length > max)
            return newList;
        else {
            compared = cmp(shortList[i], longList[longInd]);
            //console.log("Result of: " + compared + " when comparing: " + shortList[i] + " with " + longList[longInd]);
            switch(true) {
                case (compared == 0):
                    //console.log("pushing: " + shortList[i]);
                    newList.push(shortList[i--]);
                    longInd++;
                    break;
                case (compared > 0):
                    i--;
                    longInd++;
                default:
            }
        }
    }
    return newList;
}
Array.prototype.sortedDelete = function(toDelete, cmpFunc) {
    var thisCmp = cmpFunc || simCmp;

    if(toDelete.length === 0) return this;

	var newArray = [];
	var deletedIndex = 0;
    var compared;
    var len = this.length;

	for(var i = 0; i < len; i++) {
		if(deletedIndex >= toDelete.length)
			return newArray.concat(this.slice(i));
        else {
            compared = thisCmp(this[i], toDelete[deletedIndex]);
            switch(true) {
                case (compared < 0):
                    newArray.push(this[i]);
                    break;
                case (compared > 0):
                    i--;
                default:
                    deletedIndex++;
            }
        }
	}

	return newArray;
}
Array.prototype.sortedLeftMost = function(key, cmpFunc) {
    var thisCmp = cmpFunc || simCmp;
    return sortedLeftMost(this, key, cmpFunc);
}
Array.prototype.sortedLeftMostByProperty = function(propString, key, cmpFunc) {
    var thisCmp = cmpFunc || simCmp;
    return sortedLeftMostByProperty(this, propString, key, cmpFunc);
}
Array.prototype.sortedRightMost = function(key, cmpFunc) {
    var thisCmp = cmpFunc || simCmp;
    return sortedRightMost(this, key, cmpFunc);
}
Array.prototype.sortedRightMostByProperty = function(propString, key, cmpFunc) {
    var thisCmp = cmpFunc || simCmp;
    return sortedRightMostByProperty(this, propString, key, cmpFunc);
}

// FOR ALL OF THESE FUNCTIONS WE CMP WITH THE
// KEY IN THE LEFT SLOT - THIS IS REQUIRED 
// FOR PROPER STR-START-COMPARISONS, WHICH 
// ARE INTRINSICALLY ASYMMETRICAL - CHANGE
// AT YOUR OWN RISK (OR SOLVE IT A DIFF WAY)

// Returns index of element if present, or
// place to insert if not (uses binary search)
function binarySearch(array, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid];
        compared = cmp(key, element);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            return mid;
        }
    }
    return -1;
}
function sortedIndex(array, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid];
        compared = cmp(key, element);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            return mid;
        }
    }
    return hi+1;
}
function sortedLeftMost(array, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        previous,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid];
        compared = cmp(key, element);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            if(mid == 0)
                return mid;
            if(mid > 0) {
                previous = array[mid - 1];
                if(cmp(key, previous) > 0)
                    return mid;
                else
                    hi = mid - 1;
            }
        }
    }
    return -1;
}
function sortedRightMost(array, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        next,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid];
        compared = cmp(key, element);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            if(mid == (array.length - 1))
                return mid;
            if(mid < (array.length - 1)) {
                next = array[mid + 1];
                if(cmp(key, next) < 0)
                    return mid;
                else
                    lo = mid + 1;
            }
        }
    }
    return -1;
}
function binarySearchByProperty(array, propString, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid][propString];
        compared = cmp(key, element);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            return mid;
        }
    }
    return -1;
}
function sortedIndexByProperty(array, propString, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    
    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid][propString];
        compared = cmp(key, element);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            return mid;
        }
    }
    return hi+1;
}
function sortedLeftMostByProperty(array, propString, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    // console.log(array);
    // console.log(propString);
    // console.log(key);
    
    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        previous,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid][propString];
        compared = cmp(key, element);
        if(compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            if(mid == 0)
                return mid;
            if(mid > 0) {
                previous = array[mid - 1][propString];
                if(cmp(key, previous) > 0)
                    return mid;
                else
                    hi = mid - 1;
            }
        }
    }
    return -1;
}
function sortedRightMostByProperty(array, propString, key, givenCmp) {
    // set cmp if not set
    var cmp = givenCmp || simCmp;

    var lo = 0,
        hi = array.length - 1,
        mid,
        element,
        next,
        compared;
    while (lo <= hi) {
        mid = ((lo + hi) >> 1);
        element = array[mid][propString];
        compared = cmp(key, element);
        //console.log("Lo: " + lo + ", Mid: " + mid + ", Hi: " + hi);
        if (compared > 0) {
            lo = mid + 1;
        } else if (compared < 0) {
            hi = mid - 1;
        } else {
            if(mid == (array.length - 1))
                return mid;
            if(mid < (array.length - 1)) {
                next = array[mid + 1][propString];
                //console.log("INVESTIGATING INSIDE...");
                //console.log(cmp(key, next));
                if(cmp(key, next) < 0)
                    return mid;
                else
                    lo = mid + 1;
            }
        }
    }
    return -1;
}
