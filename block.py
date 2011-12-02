import time, subprocess
def block(f):
    while True:
        a = subprocess.check_call(['du', '-sk',f])
        time.sleep(1)
        b = subprocess.check_call(['du', '-sk',f])
        if a == b:
            print "Equal"
            break
        else:
            print "UnEqual"
            break
        

block("keydown.py")
