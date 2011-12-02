import subprocess

movie = "Movie Recording.mov"
subprocess.check_call(['ffmpeg', '-i', movie, '-pix_fmt', 'rgb24', '-s', 'qcif', '-loop_output', '0', 'recording.gif'])
subprocess.check_call(['convert', '-delay', '1x30', 'recording.gif', 'recording-faster.gif'])
