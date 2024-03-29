#!/usr/bin/env python
import sys, threading, json, signal, uuid, base64, subprocess, os, time, shutil, glob, re
from twisted.internet import reactor
from twisted.web import static, server
from twisted.web.resource import Resource
import binascii


signal.signal(signal.SIGINT, signal.SIG_DFL)

class Server(Resource, threading.Thread):
    """
    
    """
    max_payload_size = 620
    
    def __init__(self):
        threading.Thread.__init__(self)
        Resource.__init__(self)
        self.functions = {
            'recordgif' : self.record_gif,
            'getgif' : self.get_gif,
            'keydowngif' : self.keydown,
            'shortkeydowngif' : self.shortkeydown,
            'filenames' : self.filenames,
            'filetransfer' : self.file_transfer
            }
        self.packet_map = {}

    
    def run(self):
        s = server.Site(self)
        reactor.listenTCP(7049, s)
        reactor.run(installSignalHandlers=0)

    def getChild(self, name, request):
        return self

    def render_POST(self, request):
        return self.render_GET(request)

    def wrap(self, data, callback):
        return callback + "(" + data + ")"

    def render_GET(self, request):
        try:
            path = request.path
            if 'callback' in request.args:
                callback = request.args['callback'][0]
            else:
                callback = ''

            lst = path.split("/")
            base = lst[1]
            args = lst[2:]

            if base == 'compilegif':
                rval = self.compile(request.args)
                return self.wrap(rval, callback)
            elif base == "static":
                if path.endswith(".css"):
                    request.setHeader('content-type', 'text/css')
                f = open(path[1:], 'r')
                return f.read()
            elif base in self.functions:
                return self.wrap(self.functions[base](args), callback)
            else:
                return self.wrap("Error: path does not exist '%s'" % path, callback)
        except Exception as e:
            request.setResponseCode(500)
            import traceback
            print traceback.print_exc()
            return "General webserver error on path %s: %s" % (path ,e)

    def compile(self, packet):
        """
        Takes in a packet

        returns: false, but if the file is done, send the filename
        """
        uid = packet["uuid"][0]
        seqnum = packet["seqnum"][0]
        total = packet["total"][0]
        payload = packet["payload"][0]
        filename = packet["filename"][0]

        if uid not in self.packet_map.keys() and total != seqnum:
            print "FOOOOOOO", self.packet_map.keys(), uid
            self.packet_map[uid] = [filename, total, {seqnum : payload}]
        else:
            self.packet_map[uid][2][seqnum] = payload

        print "Compiling:", seqnum, total, len(self.packet_map[uid][2]), uid
        
        if len(self.packet_map[uid][2]) == int(total):
            print "Finished downloading", filename
            self.write_out_file(uid)
            return '"' + filename + '"'
        else:
            return "false"

    def write_out_file(self, uid):
        filename, total, packets = self.packet_map[uid]
        total = int(total)

        pattern = re.compile(r'[^. ]+\.\w+')
        match = pattern.search(filename)
        if match:
            path = os.path.expanduser("~/")
            path = os.path.join(path, "Desktop/" + filename)
            filepath = path
        else:
            filepath = "static/" + filename + ".gif"

        f = open(filepath, 'wb')
        i = 1
        while i <= total:
            endata = packets[str(i)]
            decoded =  base64.urlsafe_b64decode(endata)
            f.write(decoded)
            i += 1
        del self.packet_map[uid]

    def keydown(self, args):
        subprocess.check_call(["osascript", "keystroke.app"])
        return ""

    def shortkeydown(self, args):
        subprocess.check_call(["osascript", "shortkey.app"])
        return ""

    def record_gif(self, args):
        filename = args[0]
        subprocess.check_call(["osascript", "gen.sc"])
        time.sleep(5)
        path = self.check_existance()
        self.block(path)


        shutil.move(path, "./movie.mov")

        movie = "movie.mov"
        subprocess.check_call(['ffmpeg', '-i', movie, '-pix_fmt', 'rgb24', '-s', 'qcif', '-loop_output', '0', 'static/recording.gif'])
        subprocess.check_call(['convert', '-delay', '1x30', '-loop', '0', 'static/recording.gif', 'static/' + filename + '.gif'])
        subprocess.check_call(['convert', '-resize', '60%','static/' + filename + '.gif', 'static/' + filename + '.gif'])
        subprocess.check_call(['rm', 'static/recording.gif'])

        f = open("static/" + filename + ".gif", 'rb') 
        packets = self.encode_file(filename, f)
        return '"'+filename+'"'
        
    def check_existance(self):
        try:
            path = os.path.expanduser("~/")
            path = os.path.join(path, "Movies/Movie Recording.mov")
            return path
        except:
            print "exception", path
            time.sleep(2)
            self.check_existance()

    def block(self, f):
        while True:
            a = subprocess.check_output(['du', '-sk',f])
            time.sleep(2)
            b = subprocess.check_output(['du', '-sk',f])
            if a == b:
                print a, b, "equal"
                return
            else:
                print a, b, "notequal"

    def get_gif(self, args):
        """
        Returns json encoded packet list of the form:
          [packet, packet, packet....]
        where packets are of the form:
          [transfer_unique_id, packet_number, total_packets, payload]
        where packet_number starts at 0 and ends at total_packets.
        """
        filename = args[0]
        f = open("static/" + filename + ".gif", 'rb') 
        return self.encode_file(filename, f)

    def encode_file(self, filename, f):
        """
        Encodes the given file into a JSON encoded set of "packets."
        """
        
        packets = []
        packetnum = 0
        packetid = str(uuid.uuid4())
        text = ""
        while True:
            data = f.read(self.max_payload_size)
            if data == '':
                break
            encoded = base64.urlsafe_b64encode(data)
            packetnum += 1
            p = {"uuid" : packetid, "seqnum" : packetnum, "payload" : encoded, "filename" : filename}
            packets.append(p)

        f.close()
        for p in packets:
            p["total"] = packetnum

        return json.dumps(packets)

    def filenames(self, args):
        files = glob.glob('static/*')
        files = [f[7:-4] for f in files if f.endswith(".gif")]
        return json.dumps(files)

    def file_transfer(self, args):
        filename = args[0]
        path = os.path.expanduser("~/")
        path = os.path.join(path, "Desktop/" + filename)
        f = open(path, 'rb')
        return self.encode_file(filename, f)
        

if __name__ == "__main__":
    s = Server()
    s.start()
