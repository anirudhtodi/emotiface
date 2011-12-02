import subprocess, os, time, shutil




def foo():
    try:
        path = os.path.expanduser("~/")
        path = os.path.join(path, "Movies/Movie Recording.mov")
        print path
        shutil.move(path, "./movie.mov")
    except Exception as e:
        print "EXCEPTIOPM: %s" % e
        time.sleep(5)
        foo()

subprocess.check_call(["osascript", "gen.sc"])
foo()

#import os
#os.system("osascript gen.sc")
#os.system("mv ~/Movies/Movie\ Recording.mov ./movie.mov")
