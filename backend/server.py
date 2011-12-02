#!/usr/bin/env python
import sys, threading, json, signal, uuid, base64, subprocess, os, time, shutil
from twisted.internet import reactor
from twisted.web import static, server
from twisted.web.resource import Resource


signal.signal(signal.SIGINT, signal.SIG_DFL)

class Server(Resource, threading.Thread):
    """
    
    """
    max_payload_size = 900
    
    def __init__(self):
        threading.Thread.__init__(self)
        Resource.__init__(self)
        self.functions = {
            'recordgif' : self.record_gif,
            'getgif' : self.get_gif,
            'keydowngif' : self.keydown
            }

    
    def run(self):
        s = server.Site(self)
        reactor.listenTCP(7049, s)
        reactor.run(installSignalHandlers=0)

    def getChild(self, name, request):
        return self

    def render_POST(self, request):
        return self.render_GET(request)

    def render_GET(self, request):
        try:
            path = request.path


            request.setHeader('Access-Control-Allow-Origin', '*')
            request.setHeader('Access-Control-Allow-Methods', 'GET')
            request.setHeader('Access-Control-Allow-Headers',
                           'x-prototype-version,x-requested-with')
            request.setHeader('Access-Control-Max-Age', 2520)
            request.setHeader('Content-type', 'application/json')

            lst = path.split("/")
            base = lst[1]
            args = lst[2:]

            if base == 'compilegif':
                args = json.decode(request.args["packetlist"])
                self.compile(args)
            elif base == "static":
                if path.endswith(".css"):
                    request.setHeader('content-type', 'text/css')
                f = open(path[1:], 'r')
                return f.read()
            elif base in self.functions:
                return self.functions[base](args)
            else:
                return "Error: path does not exist '%s'" % path
        except Exception as e:
            request.setResponseCode(500)
            import traceback
            print traceback.print_exc()
            return "General webserver error on path %s: %s" % (path ,e)

    def compile(self, packets):
        packet = packets[0]
        self.write_keystroke_file(packet["filename"], packets)
        filename = "static/" + packet["filename"]
        f = open(filename, 'wb')
        for packet in packets:
            endata = packet["payload"]
            f.write(base64.b64decode(endata))
        return ""

    def keydown(self, args):
        filename = args[0]
        filepath = "static/QQQ_" + filename
        print filepath
        subprocess.check_call(["osascript", filepath])
        return ""

    def record_gif(self, args):
        filename = args[0]
        subprocess.check_call(["osascript", "gen.sc"])
        time.sleep(5)
        self.move_movie()
        movie = "movie.mov"
        subprocess.check_call(['ffmpeg', '-i', movie, '-pix_fmt', 'rgb24', '-s', 'qcif', '-loop_output', '0', 'static/recording.gif'])
        subprocess.check_call(['convert', '-delay', '1x30', '-loop', '0', 'static/recording.gif', 'static/' + filename + '.gif'])
        subprocess.check_call(['rm', 'static/recording.gif'])
        return ""
        
    def move_movie(self):
        #try:
            path = os.path.expanduser("~/")
            path = os.path.join(path, "Movies/Movie Recording.mov")
            shutil.move(path, "./movie.mov")
        #except:
        #    print "exception", path
        #    time.sleep(2)
        #    self.move_movie()

    def get_gif(self, args):
        """
        Returns json encoded packet list of the form:
          [packet, packet, packet....]
        where packets are of the form:
          [transfer_unique_id, packet_number, total_packets, payload]
        where packet_number starts at 0 and ends at total_packets.
        """
        filename = args[0]
        return self.encode_file(filename)

    def encode_file(self, filename):
        """
        Encodes the given file into a JSON encoded set of "packets."

        """
        f = open(filename, 'rb')
        
        packets = []
        packetnum = 0
        packetid = str(uuid.uuid4())
        text = ""
        while True:
            data = f.read(self.max_payload_size)
            if data == '':
                break
            encoded = base64.b64encode(data)
            text += encoded
            
            if len(text) >= self.max_payload_size:
                payload = text[:self.max_payload_size]
                text = text[self.max_payload_size:]
                packetnum += 1
                p = {"uuid" : packetid, "seqnum" : packetnum, "payload" : payload, "filename" : filename}
                packets.append(p)
            
        if len(text) > 0:
            packetnum += 1
            p = {"uuid" : packetid, "seqnum" : packetnum, "payload" : text, "filename" : filename}
            packets.append(p)

        for p in packets:
            p["total"] = packetnum

        self.write_keystroke_file(filename, packets)
        return json.dumps(packets)

    def write_keystroke_file(self, filename, packets):
        output_text = 'tell application "System Events"\n'
        packets = [json.dumps(p) for p in packets]
        output_text2 = ""
        new_file_name = "QQQ_" + filename
        f = open("static/" + new_file_name, 'w')
        for packet in packets:
            p = packet.replace('\"', "'")
            output_text2 += 'keystroke "%s" \nkey down return \n' % p
        output_text2 += 'end tell\n'
        f.write(output_text + output_text2)
        

if __name__ == "__main__":
    s = Server()
    s.start()
