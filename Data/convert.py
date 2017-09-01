import json
import help
from DeptDict import DeptDict
import csv
import random
import bisect
import string
from functools import cmp_to_key
import re
import time

def dataFromJson(fileString):
	with open(fileString) as inFile:
		return json.load(inFile)

def dataToJson(dataObj, fileString):
	with open(fileString, 'w') as outFile:
		json.dump(dataObj, outFile, indent=4)

def scrubbed(s):
	# newString = s.encode('utf-8').decode('unicode_escape').encode('ascii', 'ignore')
	newString = s
	table = str.maketrans(dict.fromkeys(string.punctuation, " "))
	newString = s.translate(table);
	newString = re.sub("\s+", " ", newString)
	newString = newString.upper()
	return newString.translate(table)

def ratingFromTerm(entry):
        NA_RESPONSE = -1
        try:
                ratings = entry['terms'][0]['ratingsObject']
        except (IndexError, KeyError) as e:
                return NA_RESPONSE

        if len(ratings) is 0:
                return NA_RESPONSE

        return ((sum(ratings[key] for key in ratings) / (len(ratings))))




# A teeny program to convert from princeton.json to princeton.csv

print("Start Time: "+(time.strftime("%H:%M:%S")))


orig = dataFromJson("princeton.json")
FORMAT_ARRAY = [["LEGEND",      "name", "professors", "description", "deptLevel", "distArea", "rating", "primaryDept"],
                ["Searchable?", "y"   , "y"         , "y"          , "y"        , "y"       , "y", "y"],
                ["Sortable?"  , "y"   , ""          , ""           , ""         , ""        , "y", ""],
                ["Colorable?" , ""    , ""          , ""           , ""         , ""        , "y", ""],
                ["Category?"  , ""    , ""          , ""           , ""         , ""        , "" , "y" ],
                ["Remember?"  , "y"   , "y"         , ""           , "y"        , "y"       , "y", "y"],
                ["Type"       , "STRING", "STRING"  , "STRING"     , "STRING"   , "STRING"  , "FLOAT" , "STRING"]]

for key in orig:
        thisRecord = ["NULL"]
        entry = orig[key]['entry']
        thisRecord.append(entry['name'].replace(",", " "))
        thisRecord.append(" ".join(entry['professors']))
        thisRecord.append(entry['description'].replace(",", " "))
        thisRecord.append(entry['deptLevel'])
        thisRecord.append(entry['distArea'])
        thisRecord.append(ratingFromTerm(entry))
        thisRecord.append(entry['deptLevel'].strip(" ")[0:3])

        FORMAT_ARRAY.append(thisRecord)
        print(thisRecord)

with open('princeton.csv', 'w') as csvfile:
        csvwriter = csv.writer(csvfile, delimiter = ',', quotechar = '"', quoting=csv.QUOTE_MINIMAL)
        for i in range(len(FORMAT_ARRAY)):
                print(FORMAT_ARRAY[i])
                csvwriter.writerow(FORMAT_ARRAY[i])

print("End Time: "+(time.strftime("%H:%M:%S")))


