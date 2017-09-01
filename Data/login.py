# logIn.py
# Desc: An attempt to log into Princeton's server
# Auth: Lukas Novak
# Date: 15 Aug 2017

from bs4 import BeautifulSoup, Comment
from urllib.request import urlopen
# from itertools import izip_longest
import lxml
import json
import time
import re
import webbrowser
import os
import requests
import mechanicalsoup as ms
import string
import traceback
import sys

from contextlib import closing
from selenium.webdriver import Firefox # pip install selenium
from selenium.webdriver.support.ui import WebDriverWait



# BASIC HELPERS 
##############################################################################
def scrubWhite(s):
	return re.sub("\s+", " ", s)

def scrubPunc(s):
	table = str.maketrans(dict.fromkeys(string.punctuation, " "))
	return s.translate(table)

##############################################################################


# BASIC LOGIN
##############################################################################
def login(browser, loginURL, ID, pwd, redirect):
	page = browser.open(loginURL)
	Form = browser.select_form('form')
	form = Form.form
	form.find("input", {"name": "netid"})["value"] = ID
	form.find("input", {"name": "pwd"})["value"] = pwd
	form.find("input", {"name": "__from"})["value"] = redirect
	browser.submit_selected()
##############################################################################


# parent builder function
##############################################################################
def buildEntryFromDictId(dict, ID, browser, selBrowser):
	mainURL = buildCourseURLFromIdAndTerm(ID, dict[ID]['primaryTerm'])
	evalURL = buildEvalURLFromIdAndTerm(ID, dict[ID]['primaryTerm'])
	entry = buildEntryFromURLS(browser, selBrowser, mainURL, evalURL)
	entry['id'] = ID
	return entry
##############################################################################

##############################################################################
# Returns a dict of ids with slots for valid terms
##############################################################################
def buildCourseIdDict(browser):
	newDict = {}
	links = getCourseLinks(browser)
	for link in links:
		thisId = getCourseId(link['href'])
		thisTerm = getTermId(link['href'])
		newDict[thisId] = {}
		newDict[thisId]['primaryTerm'] = thisTerm
		newDict[thisId]['allTerms'] = [thisTerm]
	return newDict
		

def getTermId(string):
	start = string.find("term=") + 5
	return string[start:len(string)]

def getCourseId(string):
	start = string.find("courseid=", 0) + 9
	end   = string.find("&", start)
	return string[start:end]

def getCourseLinks(browser):
	courseDetailsRegEx = "course_details\.*"
	baseURL = "https://registrar.princeton.edu/course-offerings/"
	primLinks = browser.links(url_regex=courseDetailsRegEx)
	toRetLinks = []
	for link in primLinks:
		if link.has_attr('href'):
			toRetLinks.append(link)
	return toRetLinks
			
##############################################################################

# Helper functions to build URLS and Entries, not doing heavy lifting
##############################################################################
def buildCourseURLFromIdAndTerm(ID, term):
	return (MAIN_BASE_URL + "course_details.xml?courseid={}&term={}".format(ID, term))

def buildEvalURLFromIdAndTerm(ID, term):
	return (EVAL_BASE_URL + "?terminfo={}&courseinfo={}".format(term, ID))

def buildEntryFromURLS(browser, selBrowser, courseURL, evalURL):
	entry = {}
	updateWithMainURL(browser, entry, courseURL)
	# Relies on evals not being password protected
	updateWithEvalURL(selBrowser, entry, evalURL)
	return entry
##############################################################################

# functions to build entry from Eval
# Note that these websites are not password protected
##############################################################################
def noResults(soup):
	return (len(soup.find_all("table")) < 3)

def updateWithEvalURL(selBrowser, entry, url):
	html = urlopen(url).read()
	soup = BeautifulSoup(html, 'lxml')
	entry['terms'] = []

	if(noResults(soup)):
		entry['terms'].append({})
		return

	termList = soup.find("table").find_all("td")
	for term in termList:
		termLink = EVAL_BASE_URL + str(term.find("a").get('href'))
		newTerm = termFromURL(selBrowser, entry, termLink) 
		termStr = str(term.find("a").contents)
		yearsTemplate = "\d\d\d\d\W\d\d\d\d"
		seasonTemplate = "(Fall|Spring)"
		newTerm['years'] = re.search(yearsTemplate, termStr).group(0)
		newTerm['season'] = re.search(seasonTemplate, termStr).group(0)
		entry['terms'].append(newTerm)

	return

def termFromURL(selBrowser, entry, url):
	thisTerm = {}
	thisTerm['url'] = url
	thisTerm['ratingsObject'] = pullRatingsObjectUsingSelenium(selBrowser, url)

	soup = BeautifulSoup(urlopen(url).read(), 'lxml')
	termUpdateWithTitleBox(thisTerm, soup)
	termUpdateWithComments(thisTerm, soup)
	return thisTerm

def termUpdateWithTitleBox(term, soup):
	titleBox = soup.find_all("table")[2]
	title = titleBox.find("td").find("b").text
	professors = titleBox.find_all("a")

	term['title'] = scrubWhite(title)
	term['professorNames'] = []
	term['professorLinks'] = []
	try:
		for prof in professors:
			term['professorNames'].append(prof.find("i").text)
			term['professorLinks'].append("https://reg-captiva.princeton.edu/chart/" + str(prof['href']))
	except Exception:
		print("Failed to parse professors from eval")

def termUpdateWithComments(term, soup):
	comcat = soup.find_all('td', style='font-family:Arial, Helvetica, sans-serif;font-size: 12px;')
	comcat_ns = [str(c.contents[0]) for c in comcat]
	term['comments'] = comcat_ns



def hasSvg(browser):
	svg = browser.find_element_by_tag_name('svg')
	if svg is not None:
		return True
def getLabelsAndValues(texts):
	start = 6
	thisInd = start
	bool = True
	while(bool):
		try:
			text = texts[thisInd].find_element_by_tag_name('tspan').get_attribute('innerHTML')
		except IndexError:
	 		return [[],[]]
		try:
			text = float(text)
			bool = False
		except ValueError:
			thisInd += 1
		

	labels = texts[start:thisInd]
	values = texts[thisInd:thisInd + len(labels)]
	for i in range(len(labels)):
		labels[i] = labels[i].find_element_by_tag_name('tspan').get_attribute('innerHTML')
		values[i] = values[i].find_element_by_tag_name('tspan').get_attribute('innerHTML')
	return [labels, values]

# use firefox to get page with javascript generated content
def pullRatingsObjectUsingSelenium(browser, url):
		ratingsObj = {}
		browser.get(url)
		# wait for the page to load
		WebDriverWait(browser, timeout=10).until(hasSvg)

		svg = browser.find_element_by_tag_name('svg')
		texts = svg.find_elements_by_tag_name('text')
		# particular to reg-captiva
		[labels, values] = getLabelsAndValues(texts)

		for i in range(len(labels)):
			ratingsObj[str(labels[i])] = float(values[i])
		
		return ratingsObj
##############################################################################

# functions to build entry from Main Registrar Site
# // registrar.princeton.edu
##############################################################################
def updateWithMainURL(browser, entry, url):
	entry['mainURL'] = url
	soup = browser.open(url).soup
	nameFromSoup(entry, soup)
	profFromSoup(entry, soup)
	descFromSoup(entry, soup)
	deptLevelFromSoup(entry, soup)
	distAreaFromSoup(entry, soup)
	enrollOptionsFromSoup(entry, soup)
	adminDataFromSoup(entry, soup)
	pageTextFromSoup(entry, soup)

def nameFromSoup(entry, soup):
	nameField = soup.find_all('h2')[1]
	entry['name'] = scrubWhite(nameField.text)

def profFromSoup(entry, soup):
	profField = soup.find_all('p')[0]
	profLink = profField.find("a")
	entry['professors'] = []
	entry['professorLinks'] = []
	if profLink is not None:
		profLinks = profField.find_all("a")
		for link in profLinks:
			entry['professors'].append(link.text)
			entry['professorLinks'].append("https://registrar.princeton.edu" + link.get('href'))
	else:
		entry['professors'].append(" " + profField.find("strong").text)
		entry['professorLinks'].append("")
	
	entry['professors'] = [scrubWhite(prof) for prof in entry['professors']]

def descFromSoup(entry, soup):
	descField = soup.find(id="descr")
	entry['description'] = scrubWhite(descField.text)

def deptLevelFromSoup(entry, soup):
	deptLevelField = soup.find_all("strong")[1]
	entry['deptLevel'] = scrubWhite(scrubPunc(deptLevelField.text))

def distAreaFromSoup(entry, soup):
	bigTable = soup.find(id="timetable")
	regExTemplate = "\(\w\w\)"
	search = re.search(regExTemplate, bigTable.text)
	if search is None:
		searchMatch = ""
	else:
		searchMatch = search.group(0)
	entry['distArea'] = scrubPunc(searchMatch)

def enrollOptionsFromSoup(entry, soup):
	enrollOptionsField = soup.find("em")
	entry["enrollOptions"] = scrubWhite(enrollOptionsField.text)

def adminDataFromSoup(entry, soup):
	adminTable = soup.find("table")
	rows = adminTable.findAll("tr")
	entry['classes'] = []
	rowList = iter(rows)
	next(rowList)
	for row in rowList:
		thisClass = {}
		cols = row.find_all("td")
		thisClass['number'] = scrubWhite(cols[0].find("strong").text)
		thisClass['type'] = scrubWhite(cols[1].find("strong").text)
		thisClass['time'] = scrubWhite(cols[2].text)
		thisClass['days'] = scrubWhite(cols[3].find("strong").text)
		thisClass['room'] = scrubWhite(cols[4].find("strong").text)
		thisClass['open'] = scrubWhite(cols[6].find("strong").text)
		entry['classes'].append(thisClass)

def pageTextFromSoup(entry, soup):
	contentList = soup.find(id="timetable")
	for element in contentList(text=lambda text: isinstance(text, Comment)):
		element.extract()

	pageText = ""
	for ent in contentList:
		s = str(ent)
		if len(s) > 2:
			if s[0] not in string.punctuation:
				if s[1] not in string.punctuation:
					s = scrubWhite(s)
					if len(s) > 10:
						pageText += s
	entry['pageText'] = scrubWhite(scrubPunc(pageText))

##############################################################################

# HELPER TURNING DICT INTO ENTRY ARRAY
def entryArrayFromJson(dict):
	arr = []
	row1 = ['name']
	for ID in dict:
		return

def dumpToJSON(dict, filename, batchNumber):
	print("Dumping batch {} to Json...".format(batchNumber))
	with open(filename, "w") as out:
	    json.dump(dict, out, indent=4)
	print("				...DUMPED!")


# MAIN THREAD
##############################################################################

print ("Start Time: "+(time.strftime("%H:%M:%S")))

# GLOBAL VARS
trueFrom = "https://registrar.princeton.edu/course-offerings/search_results.xml?submit=Search&term=1182&coursetitle=&instructor=&distr_area=&level=&cat_number=&sort=SYN_PS_PU_ROXEN_SOC_VW.SUBJECT%2C+SYN_PS_PU_ROXEN_SOC_VW.CATALOG_NBR%2CSYN_PS_PU_ROXEN_SOC_VW.CLASS_SECTION%2CSYN_PS_PU_ROXEN_SOC_VW.CLASS_MTG_NBR"
testFrom = "https://registrar.princeton.edu/course-offerings/search_results.xml?submit=Search&term=1182&coursetitle=x&instructor=&distr_area=&level=&cat_number=&sort=SYN_PS_PU_ROXEN_SOC_VW.SUBJECT%2C+SYN_PS_PU_ROXEN_SOC_VW.CATALOG_NBR%2CSYN_PS_PU_ROXEN_SOC_VW.CLASS_SECTION%2CSYN_PS_PU_ROXEN_SOC_VW.CLASS_MTG_NBR"
loginURL = "https://registrar.princeton.edu/authEval.xml"
EVAL_BASE_URL = "https://reg-captiva.princeton.edu/chart/index.php"
MAIN_BASE_URL = "https://registrar.princeton.edu/course-offerings/"
data = {"__from":trueFrom, "netid":"lfn", "pwd":"8465Think&Thank"};

# Pull Current DB
with open("princeton.json", "r") as inFile:
    dict = json.load(inFile)

# Two browsers, one for the slower stuff
browser = ms.StatefulBrowser(soup_config={'features': 'lxml'})
selBrowser = Firefox()

# Log into the INTRANET
login(browser, loginURL, data['netid'], data['pwd'], data['__from'])


# Get Class Data
dictIds = [ID for ID in dict]
failureList = []

for i in range(0, len(dictIds)):
	ID = dictIds[i]
	try:
		valid = dict[ID]["entry"]
		dict[ID]['index'] = i
		print("Dict {} is valid".format(i))
	except KeyError:
		print("Dict {} was not valid".format(i))
		dict[ID]["entry"] = buildEntryFromDictId(dict, ID, browser, selBrowser)
		dict[ID]["id"] = ID
		dict[ID]["index"] = i

dumpToJSON(dict, "princeton.json", "SPECIAL_BATCH")

# sessionStart = time.time()
# for i in range(12, 14):
# 	batchStart = time.time()

# 	# New selBrowser every batch
# 	selBrowser.quit()
# 	selBrowser = Firefox()

# 	try:
# 		# Run a batch
# 		for j in range(0, 25):
# 			entryStart = time.time()
# 			ID = dictIds[i*25 + j]
# 			dict[ID]['entry'] = buildEntryFromDictId(dict, ID, browser, selBrowser)
# 			print("Entry {} in {} seconds".format(i*25 + j, time.time() - entryStart))
# 	except Exception:
# 		try:
# 			for k in range(j, 25):
# 				ID = dictIds[i*25 + k]
# 				dict[ID]['entry'] = "FAILED"
# 			print("Botched Batch")
# 		except IndexError:
# 			print("FINISHED BABY")
# 			break

# 	print("Finished batch {} (25 entries) in {} seconds".format(i, time.time() - batchStart))# # dump dict to json
# 	dumpToJSON(dict, "princeton.json", i)
# 	batchStart = time.time()

# dumpToJSON(dict, "princeton.json", i)

# Close all browsers, lick wounds
selBrowser.quit()
print("List of Failed Entry Ids:")
print(["	{}".format(ID) for ID in failureList])
print ("End Time: "+(time.strftime("%H:%M:%S")))