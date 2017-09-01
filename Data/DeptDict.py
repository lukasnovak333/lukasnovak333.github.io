import help

class DeptDict:

	def __init__(self, title, hits):
		self.title = title
		self.hits  = hits

	def __eq__(self, other):
		return (help.objTitleCmp(self, other) == 0)

	def __lt__(self, other):
		return (help.objTitleCmp(self, other) == -1)

	def __gt__(self, other):
		return (help.objTitleCmp(self, other) == 1)



