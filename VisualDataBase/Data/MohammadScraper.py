# Author: Mohammad Shahrad
# For Princeton McGraw Center for Teaching and Learning

from bs4 import BeautifulSoup
from urllib2 import urlopen
import lxml
import csv
import time

print "Start Time: "+(time.strftime("%H:%M:%S"))

def scraper_target(section_url):
    html = urlopen(section_url).read()
    soup = BeautifulSoup(html, "lxml")
    # Extract course info
    course_info = soup.find_all('td', style="font-family:arial; font-size:14px; color:#404040")
    if (not bool(course_info)):
        return [False,False,False]
    course_info = course_info[0]
    course_title = str((course_info.contents[1]).contents[0])
    if len(course_info.contents)<7:
    	return [False,False,False]
    else:
        course_instructor = str(course_info.contents[6].contents[0].contents[0])
    # Extract comments
    comcat = soup.find_all('td', style='font-family:Arial, Helvetica, sans-serif;font-size: 12px;')
    comcat_ns = [str(c.contents[0]) for c in comcat]
    return [course_title,course_instructor,comcat_ns]

base_url = "https://reg-captiva.princeton.edu/chart/index.php?terminfo=1162&courseinfo=00"
records = []

for i in range(0,10000):
	section_url = base_url + "{0:0=4d}".format(i)
	[course_title,course_instructor,comcat_ns] = scraper_target(section_url)
	if not (False in [course_title,course_instructor,comcat_ns]):
		records.append([course_title,course_instructor,comcat_ns])


# Write to file
f = open('courses.out', 'w')
for i in range(0,len(records)):
	f.write(records[i][0]+" | "+records[i][1]+"\n")

f.close()

with open('data.csv', 'wb') as csvfile:
    csvwriter = csv.writer(csvfile, delimiter=',',
                           quotechar='|', quoting=csv.QUOTE_MINIMAL)
    for i in range(0,len(records)):
    	csvwriter.writerow(records[i])

print str(len(records))+" course info records stored."
print "End Time: "+(time.strftime("%H:%M:%S"))



