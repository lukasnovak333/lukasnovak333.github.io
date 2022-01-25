/*
*
* Title : Format.js
* Author: Lukas Novak
* Date: 25th of August, 2017
*
*/

var format = (function() {

/* Usage - format.csv(csvObj)
   Argument - an array of dicts, where
              keys correspond to columns,
              and key:value at array[i]
              corresponds to the value at
              (that key's column, row i)

              This is the format of D3.csv.

   Returns - An appropriately formatted JSON to be
             passed to the VDB constructor.
   Calls - Currently called by the vdb.fromFile
           function.
*/
function csv(csvObj) {
    // Build necessary objects
    var keyInfo     = buildKeyInfo(csvObj);
    console.log(keyInfo);
    var entryList   = buildEntryList(csvObj, keyInfo);
    console.log(entryList);

    // Send keyInfo keys to uppercase (for sake of vdb)
    keysToUpperCase(keyInfo);
    console.log(keyInfo);

    var searchSpace = buildSearchSpace(entryList, keyInfo);

    // Delete stuff we don't need to remember
    forget(entryList, keyInfo);

    // The names of these fields cannot change
    var formattedJson = {"keyInfo"    : keyInfo,
                     "entries"    : entryList,
                     "searchSpace": searchSpace};

    console.log(formattedJson);
    return formattedJson;
    
}

return { csv:csv }

/* buildKeyInfo
   Takes a csvObj, as specified above, and
   returns a keyInfo object, which looks like
   this:

   keyInfo {
              key1: { "searchable":true/false,
                      "sortable"  :true/false,
                      "colorable" :true/false,
                      "category"  :true/false,
                      "remember"  :true/false,
                      "type"      :"String"/"Float"
                    }
              key2: ...
              .
              .
              .
              keyN: ...
   }
*/
function buildKeyInfo(csvObj) {
    // My personal formatting constants. Subject to change. 
    var SEARCHABLE_ROW = 0;
    var SORTABLE_ROW   = 1;
    var COLORABLE_ROW  = 2;
    var CATEGORY_ROW   = 3;
    var REMEMBER_ROW   = 4;
    var TYPE_ROW       = 5;

    // Prepare empty dict, this will be the object we return
    var keyInfo = {};

    // Get property names, skipping first column
    var properties  = Object.keys(csvObj[0]).slice(1);

    /* Enumerate over property list, building keyInfo -
       if X_ROW is non-empty for a KEY,
       then keyInfo[KEY][X] is true
     */
    for(var prop of properties) {
        keyInfo[prop] = {};
        keyInfo[prop]['searchable'] =
            (csvObj[SEARCHABLE_ROW][prop] != "")? true:false;
        keyInfo[prop]['sortable'] =
            (csvObj[SORTABLE_ROW][prop] != "")? true:false;
        keyInfo[prop]['colorable'] =
            (csvObj[COLORABLE_ROW][prop] != "")? true:false;
        keyInfo[prop]['category'] =
            (csvObj[CATEGORY_ROW][prop] != "")? true:false;
        keyInfo[prop]['remember'] =
            (csvObj[REMEMBER_ROW][prop] != "")? true:false;

        switch(csvObj[TYPE_ROW][prop].toString().toUpperCase()) {
            case "STRING":
                keyInfo[prop]['type'] = "string";
                break;
            case "FLOAT":
            case "DOUBLE":
            case "NUMBER":
            keyInfo[prop]['type'] = "float";
            keyInfo[prop]['min']  = 9999999;
            keyInfo[prop]['max']  = -9999999;
                break;
            default:
                keyInfo[prop]['type'] = "unknown";
                break;
        }

        console.log(keyInfo);
    }
    // Return keyInfo object
    return keyInfo;
}

/* buildEntryList
   Takes a csvObj and returns only those rows that
   correspond to entries, using the keyInfo obj as
   a reference.

   Note - Overwrites "id" property on any entry
          with a STRING id
*/
function buildEntryList(csvObj, keyInfo) {
    var keyList = Object.keys(keyInfo);
    var numFormatRows = Object.keys(keyInfo[keyList[0]]).length;
    var entryList = csvObj.slice(numFormatRows);
    console.log("RAW ENTRY LIST...");
    console.log(entryList);
    for(var key of Object.keys(keyInfo)) {        
        console.log("checking key " + key);
        if(entryList[0].hasOwnProperty(key)) {
            for(var len = entryList.length, i = 0; i < len; i++) {
                if(key == "LEGEND") delete entryList[i][key];
                else {
                    entryList[i]['id'] = i.toString();

                    var value = entryList[i][key];
                    delete entryList[i][key];
                    entryList[i][key.toUpperCase()] = value;

                    
                    if(keyInfo[key]['type'] == 'float') {
                        // console.log("value is " + value + "for key " + key + " at " + i);
                        if(value == "") value = NaN;
                        value = parseFloat(value);
                        if(value < keyInfo[key]['min'])
                            keyInfo[key]['min'] = value;
                        if(value > keyInfo[key]['max']) {
                            console.log("resetting key " + key + " to " + value + " at " + i);
                            keyInfo[key]['max'] = value;
                        }
                    }
                }
            }
        }
    }
    return entryList;
}

/* buildSearchSpace

   with entryList and keyInfo builds a searchSpace
   object, which looks like this:

   searchSpace: [
        token1: {
            'key' : token1
            'hits': [
                  {'id1': numHits1 },
                  {'id2': numHits2 },
                  {'id3': numHits3 },
                  .
                  .
                  .
                  {'idM': numHitsM }
            ]
        },
        token2: ...,
        .
        .
        .
        tokenN: ...
   ]

   tokens are strings without white space.
   tokens are typically, though not always, words.
   tokens are listed lexicographically by key.
   ids are ids of entries.
   searchSpace[TOKEN][hits]['id1'] returns the number of
   times the given TOKEN appears in entry 'id1'. if TOKEN
   does not appear then searchSpace[TOKEN][hits]['id1']
   will return undefined.
*/
function buildSearchSpace(entryList, keyInfo) {
    // To be returned
    var searchSpace = {};

    // Save the number of entries, for a quicker loop
    var numEntries = entryList.length;

    // For every key...
    for(var key of Object.keys(keyInfo)) {
        // If it's searchable...
        if(keyInfo[key]['searchable']) {
            console.log("checking key " + key);
            // Enumerate over entries...
            for(var i = 0; i < numEntries; i++) {
                // And update searchSpace with entry[key] and entry[id]
                updateSearchSpace(searchSpace,
                                  entryList[i][key],
                                  entryList[i]['id']);
            }
        }
    }

    // Convert searchSpace into sorted array format
    var tokens = Object.keys(searchSpace).sort();
    var numTokens = tokens.length;
    for(var i = 0; i < numTokens; i++)
        tokens[i] = searchSpace[tokens[i]];
    searchSpace = tokens;

    console.log(searchSpace);
    // return searchSpace object
    return searchSpace;
}

/* updateSearchSpace
   TAKES A SEARCHSPACE, A VALUE, AND AN ID

   calls fromStringToTokens to parse the VALUE into tokens and
   for each TOKEN,
   increments searchSpace[TOKEN][hits][ID]

   tokens have no white-space, nor punctuation
*/
function updateSearchSpace(ss, value, id) {
    var tokens = fromStringToTokens(value);
    var numTokens = tokens.length;
    for(var i = 0; i < numTokens; i++) {
        // If this token has no entry, give it one
        if(ss[tokens[i]] == undefined)
            ss[tokens[i]] = {"hits":{}, "key":tokens[i]};

        // If this token has no hits from id, give it one
        if(ss[tokens[i]]["hits"][id] == undefined)
            ss[tokens[i]]["hits"][id] = 1;
        // Otherwise, increment the number of hits it does have
        else
            ss[tokens[i]]["hits"][id]++;
    }
}

/*
  fromStringToTokens

  Arguments: a string (or any object treated as a string)
  Returns: a list of non-whitespace, non-punctuation tokens
*/
function fromStringToTokens(value) {
    // Just double checking
    var s = value.toString();
    var punctuation = new RegExp("");
    s = s.replace(punctuation, ' ');
    s = s.replace(/\s{2, 1000}/g, ' ');
    s = s.toUpperCase();
    return s.split(" ").filter(tok => tok != "");
}

    function scrub(string) {
        var s = string;
        s = s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        s = s.replace(/\s{2, 1000}/g, ' ');
        return s;
    }
/*
  forget

  Using keyinfo, runs through entryList and
  deletes all key:value pairs associated
  with a key that is not to be 'remember'ed
*/
function forget(entryList, keyInfo) {
    // Cache number of entries for quicker loop
    var numEntries = entryList.length;

    // For every key
    for(var key of Object.keys(keyInfo)) {
        // If it's not to be remembered...
        if(!keyInfo[key]['remember']) {
            // Enumerate over entry list..
            for(var i = 0; i < numEntries; i++) {
                delete entryList[i][key];
            }
        }
    }
}

/* keysToUpperCase
   enumerates over keys in a dict,
   deletes original key:value pairs,
   and replaces them with otherwise
   identical key.toUpperCase:value
   pairs.

   NOTE: Behavior is undefined if keys
   are case-sensitive.
*/
    function keysToUpperCase(dict) {
        var newKey, oldVal;
        // For every old key...
        for(var oldKey of Object.keys(dict)) {
            // Skip it if it's not proper to the dict, or..
            if(!dict.hasOwnProperty(oldKey)) continue;
            // Create a new, uppercase key
            newKey = oldKey.toUpperCase();
            // Store the old value
            oldVal = dict[oldKey];
            // Delete old entry
            delete dict[oldKey];
            // Assign the newKey to oldKey's value
            dict[newKey] = oldVal;
        }
    }
}());
