import os
output_text = 'tell application "System Events" to '
def keydown(file_name, packets):
    output_text2 = ""
    new_file_name = "QQQ_" + file_name
    f = open(new_file_name, 'w')
    for i in range(len(packets)):
        output_text2 += "keystroke '" + packets[i] + "' and return "
    output_text2 += 'end tell'
    f.write(output_text + output_text2)

keydown("file", ["hi", "bye"])
