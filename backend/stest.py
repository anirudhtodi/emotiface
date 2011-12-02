import server, json


s = server.Server()

def test_compile():
    encoded = s.encode_file("server.py")
    print "DECOMPILED:\n\n"
    decoded = s.compile(json.loads(encoded))

def test_keydown():
    s.keydown(["server.py"])

test_compile()
test_keydown()


