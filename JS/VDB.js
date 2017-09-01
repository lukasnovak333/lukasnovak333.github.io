/* Class of primary object used in VS.js,
 *  a Visual Data Base, or a VDB. 
 *
 *		
 *
 */
var vdb = (function() {

	  var vdbID = 0;
	  function fromFile(file) {
        // Start Loading Screen...
	      HTML.showLoadingScreen(vdbID);
        // Pull the extension...
        var extension = file.name.split(".").pop();
        // Start making our VDB as a Promise...
		    var newVDB = new Promise((resolve, reject) => {
            // Using a switch to evaluate various extensions...
			      switch(extension) {
                // If csv, read it and make it...
            case "csv":
                var reader = new FileReader();
                reader.onloadend = function(evt) {
                    var csvURL = evt.target.result;
                    // Will not work in IE 7-9
                    d3.csv(csvURL, function(data) {
                        console.log(data);
						            var dataObj = format.csv(data);
						            resolve(new VDB(dataObj, vdbID++));
					          });
                };
                reader.readAsDataURL(file);
					      break;
                // Otherwise, no go
				    default:
					      alert("Improper FileType Used to Make VDB!");
			      }
		    });
        // Stop loading...
		    newVDB.then(()=>{HTML.removeLoadingScreen(vdbID - 1);});
        // Return our promise... (use .then())
		    return newVDB;
	  }

	  function VDB(data, id) {
		    var vdb = this;
		    this.id = id;

	      
		    /* Obligatory fields of JSON object - entries, searchSpace, keyInfo */
		    this.entries       = data.entries;
		    this.searchSpace   = data.searchSpace;
		    this.keyInfo       = data.keyInfo;

		    this.validKeys = {};
		    for(var prop in this.entries[0]) {
			      if(this.entries[0].hasOwnProperty(prop))
				        this.validKeys[prop] = true;
		    }
		    
		    this.lastKey = "";
		    this.lastKeyArray = [];		

		    this.cmpDict = buildCmpDict(this);
		    this.cmp = this.cmpDict["NAME"];
		    this.cmpProp = "NAME";

		    this.displays = [];
	  };

    VDB.prototype.newDisplay = function(DOM_String, top, left, width, height) {
        this.displays.push(new View.Display(this, this.displays.length, DOM_String));
        return this.displays[this.displays.length - 1];
    }

	  VDB.prototype.query = function(key, comparator) {
        return Search.VDBSearch(this, key, comparator);
	  };

	  /* COMPARATOR HELPERS */
    var simCmp = function(a, b) {return a - b;};
	  var stringCmp = function(s1, s2) {
		    return s1.toUpperCase().localeCompare(s2.toUpperCase());
	  };
	  var floatCmp  = function(fl1, fl2) {
		    return fl2 - fl1;
	  };
	  function buildCmpDict(vdb) {
		    var keyInfo = vdb.keyInfo;
        console.log(keyInfo);
		    var cmpDict = {};
		    for(var key in keyInfo) {
			      if(keyInfo.hasOwnProperty(key)) {
				        switch(keyInfo[key]['type'].toUpperCase()) {
					      case "STRING":
						        cmpDict[key] = keyComparator(vdb, key, "STRING");
                    // function(id1, id2) {
 							      //     // var key = vdb.cmpProp;\
                    //     console.log(key);
							      //     var s1 = vdb.entries[id1][key];
							      //     var s2 = vdb.entries[id2][key];
							      //     if(s1 == s2)
								    //         return floatCmp(id1, id2);
							      //     else
								    //         return stringCmp(s1, s2);
						        // };
						        break;
					      case "FLOAT":
					      case "INTEGER":
					      case "DOUBLE":
						        cmpDict[key] = keyComparator(vdb, key, "NUMBER");
                    // function(id1, id2) {
							      //     // var key = vdb.cmpProp;
							      //     var f1 = vdb.entries[id1][key];
							      //     var f2 = vdb.entries[id2][key];
							      //     if(f1 == f2)
								    //         return floatCmp(id1, id2);
							      //     return floatCmp(f1, f2);
						        // };
						        break;
					      default:
						        break;
				        }
			      }
		    }
		    cmpDict["Nothing"] = simCmp;
		    return cmpDict;
	  }

    function keyComparator(vdb, key, mode) {
        var secondCmp;
        if(mode == "STRING") secondCmp = stringCmp;
        else if(mode == "NUMBER") secondCmp = floatCmp;

        return function(id1, id2) {
						var v1 = vdb.entries[id1][key];
						var v2 = vdb.entries[id2][key];
						if(v1 == v2)
						    return floatCmp(id1, id2);
						else
						    return secondCmp(v1, v2);
        };
    }

	  return {
		    fromFile : fromFile
	  };

}());
