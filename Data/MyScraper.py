# Author: Lukas Novak
# For Princeton McGraw Center for Teaching and Learning
from bs4 import BeautifulSoup
from urllib2 import urlopen
from itertools import izip_longest
import lxml
import json
import time
import re 

print "Start Time: "+(time.strftime("%H:%M:%S"))

def grouper(iterable, n, fillvalue=None):
    args = [iter(iterable)] * n
    return izip_longest(*args, fillvalue=fillvalue)

def wordListFromParagraph(paragraph):
    paragraph = re.sub("\W+", " ",paragraph)
    return ''.join([i if ord(i) < 128 else ' ' for i in paragraph])

def textFromLink(url):
    html = urlopen(url).read()
    soup = BeautifulSoup(html, "lxml")
    paragraphs = soup.find_all('p')
    text = ''
    for j in range(len(paragraphs) - 1):
        text += wordListFromParagraph(paragraphs[j].text.encode('utf-8').decode('unicode_escape').encode('ascii', 'ignore'))
    return text

def plantedInfoFromString(deptStr, i):
    valid = True
    deptStr = [deptStr[j:j+3] for j in range(0, len(deptStr), 3)]
    numPairs = len(deptStr) / 2
    deptList = []
    levelList = []
    while(valid):
        for j in range(numPairs):
            course = deptStr[j*2]
            number = deptStr[j*2 + 1]
            if not course.isalpha():
                valid = False
            if not number.isdigit():
                valid = False
            if valid:
                deptList.append(course.upper())
                levelList.append(number)
        valid = False

    deptLevelString = [(deptList[j] + " " + levelList[j]) for j in range(len(deptList))]
    if deptLevelString == []:
        return False
    else: 
        data['linkTexts'][i]['deptList'] = deptList
        data['linkTexts'][i]['levelList'] = levelList
        data['linkTexts'][i]['primaryDept'] = deptList[0]
        data['linkTexts'][i]['deptLevelStr'] = ", ".join(deptLevelString)
        data['linkTexts'][i]['id'] = i
        return True

def getAndPlantTitle(i):
    ent = linkTexts[i]
    titleStart = ent['link'].find("wiki/") + 5
    titleEnd1 = ent['link'].find("-spring")
    titleEnd2 = ent['link'].find("-fall")
    if titleEnd1 == -1:
        titleEnd = titleEnd2
    elif titleEnd2 == -1:
        titleEnd = titleEnd1
    elif titleEnd1 < titleEnd2:
        titleEnd = titleEnd1
    else:
        titleEnd = titleEnd2
    deptStr = ent['link'][titleStart:titleEnd]
    deptStr = re.sub("-", "", deptStr)
    if not plantedInfoFromString(deptStr, i):
        if not plantedInfoFromString(ent['backUpLink'], i):
            print "ERROR ON TITLE AT " + str(i)

# def courseLinks(url):
#     html = urlopen(url).read()
#     soup = BeautifulSoup(html, "lxml")
#     return soup.find_all('h2')

# base_url = "http://principedia.princeton.edu/wiki/page/"
# list_of_links = []
# for i in range(1, 14):
#     this_url = base_url + str(i)
#     list_of_links.extend(courseLinks(this_url))


# for i in range(len(list_of_links)):
#     list_of_links[i] = list_of_links[i].encode('utf-8')
#     start_ind = list_of_links[i].find("http")
#     end_ind = list_of_links[i].find("\">", start_ind)
#     list_of_links[i] = list_of_links[i][start_ind:end_ind]
#     print list_of_links[i]

# data['linkTexts'] = []

# for i in range(len(links)):
#     print str(i) + " of " + str(len(links))
#     newObj = {}
#     newObj['link'] = links[i]
#     newObj['text'] = textFromLink(links[i])
#     data['linkTexts'].append(newObj)

with open('links.json') as data_file:
    data = json.load(data_file)
    links = data['links']
    linkTexts = data['linkTexts']

for i in range(len(linkTexts)):
    getAndPlantTitle(i)

with open("links.json", "w") as out:
    json.dump(data, out, indent=4)

# for i in range(5):
#     print "link " + str(i) + " of " + str(len(links))
#     html = urlopen(links[i]).read()
#     soup = BeautifulSoup(html, "lxml")
#     paragraphs = soup.findAll('p')
#     newObj = {}
#     newObj['url'] = links[i]
#     text = ""
#     for j in range(len(paragraph) - 1):
#         text += paragraph[j].text
#     newObj['text'] = text
#     data['linkTexts'].append(newObj)
    

# bigJson = {}
# bigJson['links'] = []

# for i in range(len(list_of_links)):
#     bigJson['links'].append(str(list_of_links[i]))
#     print list_of_links[i]


# # Write to file
# f = open('courses.out', 'w')
# for i in range(0,len(records)):
# 	f.write(records[i][0]+" | "+records[i][1]+"\n")
# f.close()

print "End Time: "+(time.strftime("%H:%M:%S"))



