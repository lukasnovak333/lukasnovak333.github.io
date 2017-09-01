import json
import help
from DeptDict import DeptDict
import csv
import random
import bisect
import string
from functools import cmp_to_key


def dataFromJson(fileString):
	with open(fileString) as inFile:
		return json.load(inFile)

def dataToJson(dataObj, fileString):
	with open(fileString, 'w') as outFile:
		json.dump(dataObj, outFile, indent=4)

def scrubbed(s):
	# newString = s.encode('utf-8').decode('unicode_escape').encode('ascii', 'ignore')
	newString = s
	table = str.maketrans(dict.fromkeys(string.punctuation))
	return s.translate(table)

def emptyDeptDict(title):
	d = {}
	d['title'] = title
	d['courses'] = []
	return d

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

def dictUpdate(text, dict, pageNo):
	array = text.split(" ")
	for token in array:
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

def defineMatchesForCourses():
	with open('classDict.json') as inFile:
		classDict = json.load(inFile)

	with open('links.json') as inFile:
		links = json.load(inFile)

	courses = classDict['courseDict']
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

#********************************************************************************
#********************************************************************************
#********************************************************************************
#********************************************************************************
#********************************************************************************

def rebuildClassDict():
	bigJson = {}
	bigJson['entries'] = []
	bigJson['keyToType'] = {}
	

	# build keyToTypeDict, build Array of Entries
	with open('fall1718.csv') as data_file:
		reader = csv.reader(data_file, delimiter=",")
		iterReader = iter(reader)
		firstRow  = next(iterReader)
		secondRow = next(iterReader)
		for i in range(len(firstRow)):
			if firstRow[i] is not None:
				if secondRow[i] is not None:
					bigJson['keyToType'][secondRow[i]] = firstRow[i]

		ID = 0
		for row in iterReader:
			thisEntry = {}
			thisEntry["id"] = ID
			ID += 1

			for i in range(len(secondRow)):
				thisEntry[secondRow[i]] = row[i]

			bigJson['entries'].append(thisEntry)

	#wordDict
	bigJson['searchSpace'] = wordDictFromMatches()

	with open('classDict.json', 'w') as out_file:
		json.dump(bigJson, out_file, indent=4)


rebuildClassDict()
