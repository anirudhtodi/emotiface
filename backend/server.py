#!/usr/bin/env python
import sys, threading, json, signal, uuid, base64
from twisted.internet import reactor
from twisted.web import static, server
from twisted.web.resource import Resource


signal.signal(signal.SIGINT, signal.SIG_DFL)

class Server(Resource, threading.Thread):
    """
    
    """
    max_payload_size = 950
    
    def __init__(self):
        threading.Thread.__init__(self)
        Resource.__init__(self)
        self.functions = {
            'recordgif' : self.record_gif,
            'getgif' : self.get_gif,
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
            
            if path == "/static":
                f = open("", 'r')
                return f.read()

            lst = path.split("/")
            base = lst[1]
            args = lst[2:]
            if base in self.functions:
                return self.functions[base](args)
            else:
                return "Error: path does not exist '%s'" % path
        except Exception as e:
            request.setResponseCode(500)
            #import traceback
            #print traceback.print_exc()
            return "General webserver error on path %s: %s" % (path ,e)

    def record_gif(self, args):
        return "RECORDGIF %s" % args

    def get_gif(self, args):
        """
        Returns json encoded packet list of the form:
          [packet, packet, packet....]
        where packets are of the form:
          [transfer_unique_id, packet_number, total_packets, payload]
        where packet_number starts at 0 and ends at total_packets.
        """
        filename = args[0]
        f = open(filename, 'rb')
        
        packets = []
        packetnum = -1
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
                packets.append([packetid, packetnum, payload])
            
        if len(text) > 0:
            packetnum += 1
            packets.append([packetid, packetnum, text])

        packets = [[x[0], x[1], packetnum, x[2]] for x in packets]

        return json.dumps(packets)

if __name__ == "__main__":
    s = Server()
    s.start()
