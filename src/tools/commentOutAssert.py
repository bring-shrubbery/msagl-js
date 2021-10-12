import sys
def findBalancedParent(off, data): 
    o = data.find("(", off)
    if o <0 : return -1
    level = 1
    while level > 0 :
        o = o+1
        if (data[o] == '(') :
             level = level +1
        elif data[o] == ')' : 
             level = level - 1
        
    return o  



    
def findAssert(offset, data) :
    off=data.find("Assert.assert", offset)
    if off < 0: return (off, -1)
    return (off,findBalancedParent(off, data))


n = len(sys.argv)
if (n<2) :
    print('too few args')
    sys.exit()
filename = sys.argv[1]
print('file name = ' + filename)
file = open(filename, "r")
data= file.read()
print(data)
file.close()
ret = ""
offset = 0
(start, end) = findAssert(offset, data )
if start < 0 :  
    sys.exit() # no need to override the file
file = open(filename, "w")
while (start >=0) :
    file.write(data[offset:start] + "/*" + data[start:end+1] +  "*/")
    offset = end+1
    (start, end) = findAssert(offset, data )
file.write(data[offset:len(data)]    )
file.close()   

 



       