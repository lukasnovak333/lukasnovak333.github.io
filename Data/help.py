
def deptLevelString(classObject):
	string = ""
	for i in range(len(classObject['deptList'])):
		thisDept = str(classObject['deptList'][i])
		thisLevel = str(classObject['levelList'][i])
		string += thisDept + " " + thisLevel + ", "
	return string[:-2]

def dictTitleCmp(dict1, dict2):
	if dict1['title'].upper() < dict2['title'].upper():
		return -1
	elif dict1['title'].upper() > dict2['title'].upper():
		return 1
	elif True:
		return 0

def objTitleCmp(obj1, obj2):
	if obj1.title.upper() < obj2.title.upper():
		return -1
	elif obj1.title.upper() > obj2.title.upper():
		return 1
	elif True:
		return 0

