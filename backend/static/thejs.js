/****** CLASSES *****/

//partialFileNames = new Object();
//completedFileNames = new Object();

//use the filename as a string to access these objects
files = new Object();
processedPackets = new Object();

function partialFile(filename,totalPackets)
{
    this.filename = filename;
    this.isComplete = false;
    this.numPackets = 0;
    this.totalPackets = totalPackets;

    //need to check the packet map every time,
    //story the seqnum as the key!
    this.packetMap = {};

    this.print = function(){
        alert("printing file " + this.filename);
        alert("Packets so far " + this.numPackets);
        alert("need this many packets " + this.totalPackets);
        console.log(this.packetMap);
    }

    this.addPacket = function(packetObject){
        //if our packet map doesn't have it yet
        if(!this.packetMap[packetObject.seqnum])
        {
            //add it and increase our num packets
            this.numPackets++;
            this.packetMap[packetObject.seqnum] = packetObject;

            //now check if we are done
            if(this.numPackets == this.totalPackets)
            {
                alert("This file is done!!");
                //call to local!
            }
        }
    }
}


/****** GLOBALS ****/

var stopChecking = false;
var myFacebookID = "nameNotSend";
var serverAddress = "http://127.0.0.1:7049";


function convertPacket(theObj)
{
    objText = theObj.text();
    //need to determine if this JSON or not.....
    console.log("Processing this packet" + objText);
    objText = objText.replace(/'/g,'"');
    var packetObject;
    var isPacket = false;
    try {
        packetObject = JSON.parse(objText);
        console.log("is a packet!");
        isPacket = true;
    } catch(err) { 
        console.log("not a packet apparently...");
    }

    if(isPacket)
    {
        processPacket(packetObject);
    }
}

function keydownGifClick()
{
    var fileName = $j('#fileInput').val();
    if(!$j('#fileInput').val())
    {
        alert("wrong file!");
    }
    //focus on the first chat box??
    $j('.fbNubFlyoutInner').find('textarea').focus();

    keydownCheck(fileName,0);

    $j.ajax({
        type:'GET',
        url:serverAddress + "/keydowngif/" + fileName,
        dataType:"jsonp",
    });
}

function keydownCheck(filename,numPacket)
{
    //check if it's nothing
    var theVal = $j('.fbNubFlyoutInner').find('textarea').val();
    alert(theVal);
}



function recordGifClick()
{
    //filename
    var fileName = $j('#fileInput').val();

    //make the call to local
    $j.ajax({
        type:'GET',
        data:{'hi':'hello'},
        url:serverAddress + "/recordgif/" + fileName,
        dataType:'jsonp',
        success:function(){alert("back");}
    });
}

function processPacket(packetObject)
{
    //PACKET FORMAT CHANGES HERE
    //packet format of:
    // keys are
    // uuid
    // seqnum
    // total
    // payload
    // filename
    console.log("The object");
    console.log(packetObject);

    //ok now we need to start checking things
    //check for incompleteness
    if(!packetObject.filename || !packetObject.total || !packetObject.payload || !packetObject.uuid)
    {
        alert('incomplete packet!');
        return;
    }

    //check if packet was processed already!
    var uniqueID = packetObject.uuid + String(packetObject.seqnum);
    if(processedPackets[uniqueID])
    {
        return;
    }

    //i know it's technically not done yet but give me a break!
    processedPackets[uniqueID] = true;
    alert("Processing new packet with seqnum " + packetObject.seqnum + " and uuid " + packetObject.uuid);
    
    //check if there's a partial file for this right now
    if(!files[packetObject.filename])
    {
        //no file, so go make one
        alert("Had to make new file");
        files[packetObject.filename] = new partialFile(packetObject.filename,packetObject.total);
    }

    //now we are sure it's made, so go add this packet
    files[packetObject.filename].addPacket(packetObject);
    //print the file
    files[packetObject.filename].print();
}


function changeName()
{
	try {
		console.log("Trying");
		$j = jQuery.noConflict();
        init();
		return true;
	}
	catch (err)
	{
		setTimeout("changeName()",500);
	}
}

try {
	$j = jQuery.noConflict();
    init();
}
catch (err) {
	setTimeout("changeName()",500);
}

//setTimeout("init()",500);

function typedSomething(eventObj)
{
    console.log("key press..");
    theArea = eventObj.srcElement;
    newText = eventObj.srcElement.value;

    //now figure out stuff like :coolstory:
    regexResult = /:(\w+):/g.exec(newText);

    if(!regexResult)
    {
        //we are done here, no coolstory things
        return;
    }
    matchingPart = regexResult[0];
    filename = regexResult[1];
    alert(matchingPart);
    alert(filename);



}

function quickCheck()
{
    if(stopChecking)
    {
        return;
    }

    console.log("Checking...");
    all = $j('.fbChatMessage').not('.read');
    if(all.length > 0)
    {
        console.log("New message or messages!!");

        //mark these as read!
        //all.addClass('read');

        all.each(function(index){
            var thisText = $j(this).text();

            //get the profile link from the conversation this belongs to
            var link = $j(this).parent().parent().children('.profileLink').attr('href');
            var profileName = /facebook\.com\/([a-zA-Z0-9.-]+)/g.exec(link)[1];
            if(profileName == "peter.cottle")
            {
                $j('#outgoing').append("<p>" + thisText + "</p>");
                //SILLY!!!
                //convertPacket($j(this));
            }
            else
            {
                $j('#incoming').append("<p>" + thisText + "</p>");
                convertPacket($j(this));
            }
        });
        all.addClass('read');
    }
    setTimeout("quickCheck()",200);
}





function init()
{
    $j('body').append('<div id="gradient"></div>');

    $j('#pagelet_bookmark_nav').css('display','none');
    $j('#pagelet_current').css('display','none');
    $j('#pagelet_ego_pane_w').css('display','none');
    $j('#contentCol').css('display','none');

    $j('.fbxWelcomeBoxName').css('color','white');

    $j('body').append('<div id="outgoing" class="packetDebug"></div>');
    $j('body').append('<div id="incoming" class="packetDebug"></div>');
    $j('body').append('<div id="ui"></div>');
    $j('#ui').append('<button onclick="recordGifClick()">Record a gif</button></br>');
    $j('#ui').append('<button onclick="keydownGifClick()">Keydown a gif</button>');

    $j('#ui').append('<textarea id="fileInput">test</textarea>');

    quickCheck();
    //get our name
    var homeLink = $j('.tinyman').children('a')[0].href;
    myFacebookID = /facebook\.com\/([0-9a-zA-Z.-]+)/g.exec(homeLink)[1];


    $j('textarea.uiTextareaAutogrow.input').live('keyup',typedSomething);

}
