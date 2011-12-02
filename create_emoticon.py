import subprocess
class Create_Emoticon:
    print 3
    # subprocess.Popen(['convert', '-delay', '1x10', '-loop', '0', '*.JPG', 'animation.gif'])
    subprocess.check_call(['imagesnap', '-w', '1.00', 'emoticon1.JPG'])
    for i in range(2,120):
        image_name = 'emoticon' + str(i) + '.JPG'
        subprocess.check_call(['imagesnap', image_name])
    subprocess.check_call(['convert', '*.JPG', '-resize', '5%', 'resized.JPG'])
    subprocess.check_call(['convert', '-delay', '1x10', '-loop', '0',
                           'resized*.JPG', 'emoticon.gif'])
