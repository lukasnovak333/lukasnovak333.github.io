import json
import help
from DeptDict import DeptDict
import csv
import random
import bisect
import string
from functools import cmp_to_key
import re

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

def simCmp(a, b):
	if a < b:
		return -1
	elif b < a:
		return 1
	else:
		return 0

def invSimCmp(a, b):
	if a > b:
		return -1
	elif b < a:
		return 1
	else:
		return 0

def keyCmp(ent1, ent2):
	str1 = scrubbed(ent1['key'])
	str2 = scrubbed(ent2['key'])
	return simCmp(str1.upper(), str2.upper())

def hitCmp(ent1, ent2):
	return invSimCmp(ent1['numHits'], ent2['numHits'])

def sortedListFromDict(dict, comparator=simCmp):
	newList = []
	for key in dict.keys():
		newList.append(dict[key])
	return sorted(newList, key=cmp_to_key(comparator))

def wordDictFromMatches():
	texts = dataFromJson('links.json')
	texts = texts['linkTexts']
	courses = dataFromJson('classDict.json')
	courses = courses['courseDict']
	wordDict = {}
	for i in range(len(texts)):
		if texts[i]['idOfMatch'] > 0:
			dictUpdate(texts[i]['text'], wordDict, texts[i]['idOfMatch'])
	for j in range(len(courses)):
		for key in courses[j].keys():
			if(isinstance(courses[j][key], str)):
				dictUpdate(scrubbed(courses[j]['title']), wordDict, courses[j]['id'])
		dictUpdate(scrubbed(courses[j]['title']), wordDict, courses[j]['id'])

	newObj = {}
	newObj['_keys'] = sortedListFromDict(wordDict, keyCmp)
	ind = 0
	while ind < len(newObj['_keys']):
		newObj['_keys'][ind]['hits'] = sortedListFromDict(newObj['_keys'][ind]['hits'], hitCmp)
		newObj['_keys'][ind]['id'] = ind
		key = newObj['_keys'][ind]['key']
		if all(j in string.punctuation for j in key):
			del newObj['_keys'][ind]
		else:
			ind += 1
	return newObj

def defineMatchesForEntries():
	with open('classDict.json') as inFile:
		classDict = json.load(inFile)

	with open('links.json') as inFile:
		links = json.load(inFile)

	entries = classDict['entries']
	texts = links['linkTexts']

	matches = 0
	for i in range(len(texts)):
		matched = False
		for j in range(len(courses)):
			if courses[j]['deptList'] == texts[i]['deptList']:
				if courses[j]['levelList'] == texts[i]['levelList']:
					matched = True
					matches += 1
					links['linkTexts'][i]['idOfMatch'] = j
		if not matched:
			links['linkTexts'][i]['idOfMatch'] = -1

	print (str(matches) + " matches from " + str(len(texts)) + " entries")

	with open('links.json', 'w') as outFile:
		json.dump(links, outFile, indent=4)


def emptyEntry(tok):
	obj = {}
	obj['key'] = tok
	obj['hits'] = {}
	return obj

def emptyHitsEntry(pageNo):
	obj = {}
	obj['pageNo'] = pageNo
	obj['numHits'] = 0
	return obj

def arrayFromDict(dict):
	newArr = []
	for key in dict.keys():
		newArr.append(dict[key])
	return newArr

def dictUpdate(text, dict, pageNo):
	array = text.split(" ")
	for token in array:
		if token == "":
			continue
		if dict.get(token) == None:
			dict[token] = emptyEntry(token)
		entry = dict.get(token).get('hits')
		if entry.get(pageNo) == None:
			entry[pageNo] = emptyHitsEntry(pageNo)
		entry[pageNo]['numHits'] += 1

	if not dict.get("")  == None:
		del dict[""]
	if not dict.get(" ") == None:
		del dict[" "]

def searchSpaceFromEntries(entries, keyInfo):
	# Build the dict
	searchSpace = {}
	for entry in entries:
		for property in entry:
			if(property != "id"):
				if(keyInfo[property]['searchable']):
					val = scrubbed(str(entry[property]))
					dictUpdate(val, searchSpace, entry["id"])

	# create sorted hits arrays
	for word in searchSpace.keys():
		searchSpace[word]['hits'] = sorted(arrayFromDict(searchSpace[word]['hits']), key = cmp_to_key(hitCmp))			
	# turn dict into sorted array of objects	
	orgSpace = sorted(arrayFromDict(searchSpace), key=cmp_to_key(keyCmp))

	# Assign sorted ids to words
	for i in range(len(orgSpace)):
		orgSpace[i]['id'] = i

	return orgSpace

#********************************************************************************
#********************************************************************************
#********************************************************************************
#********************************************************************************
#********************************************************************************

def buildDataDict(csvFile, jsonName):
	bigJson = {}
	bigJson['entries'] = []
	bigJson['keyInfo'] = {}
	

	# build keyToTypeDict, build Array of Entries
	with open(csvFile) as data_file:
		reader = csv.reader(data_file, delimiter=",")
		iterReader = iter(reader)

		keyRow      = next(iterReader)
		searchableRow  = next(iterReader)
		sortableRow    = next(iterReader)
		colorableRow = next(iterReader)
		categoryRow = next(iterReader)
		datatypeRow = next(iterReader)
		print(categoryRow)
		

		searchable = {}
		for i in range(len(searchableRow)):
			bigJson['keyInfo'][keyRow[i]] = {}
			thisKey = bigJson['keyInfo'][keyRow[i]]

			if searchableRow[i].upper() == "Searchable".upper():
				thisKey['searchable'] = True
			else:
				thisKey['searchable'] = False

			if sortableRow[i].upper() == "Sortable".upper():
				thisKey['sortable'] = True
			else:
				thisKey['sortable'] = False

			if colorableRow[i].upper() == "Colorable".upper():
				thisKey['colorable'] = True
			else:
				thisKey['colorable'] = False

			if categoryRow[i].upper() == "category".upper():
				thisKey['category'] = True
			else:
				thisKey['category'] = False

			thisKey['type'] = datatypeRow[i]


		ID = 0
		for row in iterReader:
			thisEntry = {}
			thisEntry["id"] = ID
			ID += 1

			for i in range(len(row)):
				if(datatypeRow[i] == ("float" or "int" or "double")):
					thisEntry[keyRow[i]] = float(row[i])
				else:
					thisEntry[keyRow[i]] = row[i]

			bigJson['entries'].append(thisEntry)

	#wordDict
	bigJson['searchSpace'] = searchSpaceFromEntries(bigJson['entries'], bigJson['keyInfo'])
	dataToJson(bigJson, jsonName)


buildDataDict("toys.csv", "toys.json")
