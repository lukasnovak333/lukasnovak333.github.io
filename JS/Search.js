/*
	Filename: Search.js
	Common Name: Search Module 
	Description: A Module containing search functions
	Author: Lukas Novak
	Date: Aug 10, 2017
	Dependencies: 
	help.js
	arrayUpdate.js
*/

var Search = (function() {



    /* keys is an array of at least one string,
     *  vdb is the vdb to repopulate
     */
    function VDBSearch(vdb, key, comparator) {
        console.log(comparator);
        console.log("key is " + key);

        // To save some time
		    if(key == vdb.lastKey) return true;
        vdb.lastKey = key;

        // Get an array and save some MORE time...
		    var keyArray = keyArrayFromString(key.toUpperCase());
		    if(keyArray.equals(vdb.lastKeyArray)) return true;
        vdb.lastKeyArray = keyArray;

        // For the last time, save some time...
        if(keyArray == []) return true;

		    // console.log(keyArray);
		    var onIds = quickSearch(vdb, keyArray, comparator);
		    // console.log(vdb.onIds);
		    return onIds;
    }


 	  return {
 		    VDBSearch : VDBSearch
 	  };

    function quickSearch(vdb, keys, comparator) {
		    var hitList = populate(vdb, keys[0], comparator);
		    for(var len = keys.length, i = 1; i < len; i++)
			      hitList = narrowSearch(vdb, hitList, keys[i], comparator);
		    return hitList;
    }
    
    function narrowSearch(vdb, list, token, comparator) {
		    // console.log("in narrow search");
        if(!isSorted(list, comparator)) alert("NARROW SEARCH FOUND UNSORTED LIST");
		    return list.sortedMinimalIntersection(populate(vdb, token, comparator), comparator);
    }

    // Uses a jank choosing mechanism, should be improved
    function nearBestValue(hitMatrix) {
		    var nextValue, curValue, nextRow;
		    if(nextValidRow(hitMatrix) != -1) {
			      curValue = curVal(hitMatrix);
			      nextValue = nextVal(hitMatrix);
			      if((nextValue == undefined) || (curValue > nextValue)) {
                hitMatrix.colFromRow[hitMatrix.row]++;
                return curValue;
            }
            else {
                nextRow = nextValidRow(hitMatrix);
                hitMatrix.colFromRow[nextRow]++;
                hitMatrix.row = nextRow;
                return nextValue;
            }
		    }
        else {
            return undefined;
        }
    }

    // NONE OF THE FOLLOWING FUNCTIONS CHANGE HITMATRIX
    /************************************************************/
    function curVal(hitMatrix) {
        return hitMatrix.mat[hitMatrix.row][hitMatrix.colFromRow[hitMatrix.row]];
    }

    function nextVal(hitMatrix) {
        var nextRow = nextValidRow(hitMatrix);
        if(nextRow == -1) return undefined;
        // console.log("next row is " + nextRow);
        return hitMatrix.mat[nextRow][hitMatrix.colFromRow[nextRow]];
    }

    function nextValidRow(hitMatrix){
        var colFromRow = hitMatrix.colFromRow;
        var matrix = hitMatrix.mat;

		    var curRow =  (hitMatrix.row + 1) % matrix.length;
		    var origRow = hitMatrix.row % matrix.length;
		    do {
			      if(matrix[curRow][colFromRow[curRow]] != undefined)
				        return curRow;
			      curRow = (curRow + 1) % (matrix.length);
		    }
		    while(curRow != origRow)

		    if(matrix[origRow][colFromRow[origRow]] != undefined)
			      return origRow;

		    return -1;
    }
    /***********************************************************/ 
    function entriesInRange(vdb, range) {
		    var numHits = 0;
		    for(var i = range.start; i < range.end; i++)
			      numHits += Object.keys(vdb.searchSpace[i]['hits']).length;
        console.log("THIS SEARCH HAS " + numHits + " HITS");
		    return numHits;
    }

    function populate(vdb, token, comparator, max=0) {
        console.log("populate called with cmp = ");
        console.log(comparator);

        // Range logic, and empty if no hits
		    var range = Range(vdb.searchSpace, token);
		    if(range.size == 0) return [];
		    var start = range.start, end = range.end;

        // For testing
        entriesInRange(vdb, range);


		    var hitMatrix = {"row":0, "colFromRow":[], "mat":[]};

        // A hack - should modify 'hits' to be an array
		    for(var i = start; i < end; i++) {
			      hitMatrix.colFromRow.push(0);
			      hitMatrix.mat[i - start] = Object.keys(vdb.searchSpace[i]['hits']);
		    }

        // Grab values and populate!
        var toRet = [], nextValue = nearBestValue(hitMatrix), count = 0;
        while(nextValue != undefined) {
            // console.log(count++);
            if(!toRet.sortedContains(nextValue, comparator))
                toRet.inSort(nextValue, comparator);
            nextValue = nearBestValue(hitMatrix);
        }

        // Go home proud
        console.log("RETURNING");
        console.log(toRet);
        if(!isSorted(toRet, comparator))
            alert("ISSUE IS IN SEARCH");
		    return toRet;
    }

    function Range(array=[], token="") {
		    var obj = {};
		    if(token == "") {
			      obj.start = -1;
			      obj.end = -1;
			      obj.size = 0;
		    }
		    else {
			      // console.log("SEARCHING FOR RANGE...");
			      // console.log(array);
			      obj.start = array.sortedLeftMostByProperty('key', token, strStartLeftCmp);
			      obj.end = array.sortedRightMostByProperty('key', token, strStartLeftCmp) + 1;
			      obj.size = (obj.start == -1)? 0: obj.end - obj.start;
		    }
		    return obj;
    }
}());
