import sys
import glob

def findBalancedParent(off, data): 
    o = data.find("(", off)
    
    if o <0 : return -1
    insidestring=False
    level = 1
    while level > 0 :
        o = o+1
        char= data[o]
        if insidestring: 
            if char=='\'': 
                insidestring=False
            continue
        if (char == '(') :
             level = level +1
        elif char == ')' : 
             level = level - 1
        elif char == '\'':
             insidestring = True
    return o  


def commentedOut(data, off) :
    while off > 0 :
       ch = data[off]
       if ch == '\n': return False
       if ch == '/' and data[off - 1 ]== '/': return True
       off = off - 1
    return False   
    
def findAssert(offset, data) :
    off=data.find("Assert.assert", offset)
    if off < 0: return (off, -1)
    while off >= 0 and commentedOut(data, off) :
        off =  data.find("Assert.assert", off+1)
    return (-1,-1) if off < 0 else (off,findBalancedParent(off, data))


def sub(filename):    
    print('file name = ' + filename)
    file = open(filename, "r")
    data= file.read()
    file.close()
    offset = 0
    (start, end) = findAssert(offset, data )
    if start < 0 :  
        return # no need to override the file
    file = open(filename, "w")
    while (start >=0) :
        file.write(data[offset:start] + "/*" + data[start:end+1] +  "*/")
        offset = end+1
        (start, end) = findAssert(offset, data )
    file.write(data[offset:len(data)]    )
    file.close()   

 
n = len(sys.argv)
if (n<2) :
    print('too few args: provide directory name')
    sys.exit()

files = glob.glob(sys.argv[1] + '/**/*.ts', recursive=True)
for file in files :
    sub (file)


       