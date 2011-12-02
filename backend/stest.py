import server, json


s = server.Server()

def test_compile():
    print s.compile({'uuid' : 4, 'seqnum' : 1, 'total' : 2, 'payload' : 'aaaa', 'filename' : 'testcompile'})
    x = raw_input()
    print s.compile({'uuid' : 4, 'seqnum' : 2, 'total' : 2, 'payload' : '\nbbbb', 'filename' : 'testcompile'})

def test_keydown():
    s.keydown(["server.py"])

test_compile()
#test_keydown()


