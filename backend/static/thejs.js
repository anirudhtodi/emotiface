/****** CLASSES *****/

//partialFileNames = new Object();
//completedFileNames = new Object();

//use the filename as a string to access these objects
files = new Object();
gifsWeHave = new Object();
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

    this.whichToStartAt = function()
    {
        //return the seqnum of the first packet we are missing!
        for(var i = 1; i <= this.totalPackets; i++)
        {
            if(!this.packetMap[i])
            {
                //this is it
                return i;
            }
        }
        alert("uh i appear to be done...");
        return this.totalPackets + 1;
    }

    this.addPacket = function(packetObject){
        //if our packet map doesn't have it yet
        if(!this.packetMap[packetObject.seqnum])
        {
            //add it and increase our num packets
            this.numPackets++;
            this.packetMap[packetObject.seqnum] = packetObject;

            //also update the progress bar if necessary
            if(progressScatterFilename == this.filename)
            {
                //find this packet seqnum and make it green
                var theNum = packetObject.seqnum;
                $j('#p' + String(theNum)).addClass('packetReceived');
            }

            //now check if we are done
            if(this.numPackets == this.totalPackets)
            {
                this.isComplete = true;
                //call to local!
            }
        }
    }
}


function compileFile(fileObj)
{
    alert("compiling file");
    console.log(fileObj);


    for(var i = 1; i <= fileObj.totalPackets; i++)
    {
        //make an ajax call for each one of these...
        $j.ajax({
            type:'GET',
            url:serverAddress + '/compilegif',
            data:fileObj.packetMap[i],
            dataType:'jsonp',
            success:checkCompileDone,
        });
    }
    console.log("done with calls");
}

function checkCompileDone(returnVal)
{
    if(!returnVal)
    {
        //not done yet
        console.log("COMPILE returned this " + returnVal);
        return;
    }
    alert("this compiled on the back end " + returnVal);
    alert("asdasd");
    gifsWeHave[returnVal] = true;
}


function makeScatterPlot(totalPackets)
{
    //check if it's there
    if(!$j('.scatterDiv').length)
    {
        //add it
        $j('body').append('<div class="scatterDiv"></div>');

    }

    //calcualte the size
    var eachSize = scatterWidth/totalPackets;

    var newWidth = Math.round(eachSize) * totalPackets;
    $j('.scatterDiv').css('width',newWidth);

    //now add all the packet things
    var appendStr = "";
    for(var i = 1; i <= totalPackets; i++)
    {
        appendStr = appendStr + '<div style="width:' + String(eachSize) + 'px" class="littlePacket" id="p' + String(i) + '"></div>';
    }
    $j('.scatterDiv').html(appendStr);
}

function checkHandshakeAgain()
{
    //check if we need to send again....


    //fuckit, just send it anyways??
   $j('.fbNubFlyoutInner').find('textarea').val(handshakeToSendText);

   $j.ajax({
       type:'GET',
       url:serverAddress + '/shortkeydowngif/',
       dataType:'jsonp'
    });
}

/****** GLOBALS ****/

var handshakeToSendText = "";
var handshakeSinceTimestamp = 0;
var handshakeSinceFilename = "";

var weAreTransferring = false;

var progressScatterFilename= "";
var stopChecking = false;
var stopKeydown = false;
var myFacebookID = "nameNotSend";
var serverAddress = "http://127.0.0.1:7049";

var keydownSleep = 50;
var quickcheckSleep = 100;

var scatterWidth = 500;

var myProfileName = "";


function convertPacket(theObj)
{
    objText = theObj.text();
    //need to determine if this JSON or not.....
    //console.log("Processing this packet" + objText);
    //objText = objText.replace(/'/g,'"');
    var packetObject;
    var isPacket = false;

    //first, real quick check for the ~ things
    results = /~(\w+)~/g.exec(objText);

    if(results)
    {
        //do this sthing
        var filename = results[1];
        //decide if we have it or not
        if(gifsWeHave[filename])
        {
            //embed it and peace
            embedGif(filename);
            //make sure it's loaded too!
            if(!files[filename])
            {
                goGetGif(filename); 
            }
            return;
        }

        //we don't so go request it!
        requestGif(filename);
        return;
    }

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

function getGifClick()
{
    var fileName = $j('#fileInput').val();

    if(!fileName)
    {
        alert("eneter a file name!");
        return;
    }

    goGetGif(fileName);
}

function goGetGif(fileName)
{
    //make a call to go get all these packets!
    $j.ajax({
        type:'GET',
        url:serverAddress + "/getgif/" + fileName,
        dataType:"jsonp",
        success:getGifCallback,
    });
}

function getGifCallback(rawData)
{
    firstPacket = rawData[0];
    console.log(firstPacket);

    var fileName = firstPacket.filename;
    var totalPackets = firstPacket.total;


    files[fileName] = new partialFile(fileName,totalPackets);

    for(var i = 0; i < rawData.length; i++)
    {
        files[fileName].addPacket(rawData[i]);
    }
    console.log(files[fileName]);
}


function keydownGifClick()
{
    var fileName = $j('#fileInput').val();
    goKeydownGif(fileName);
}

function goKeydownGif(fileName)
{
    if(!files[fileName])
    {
        alert("cant do this file yet " + fileName);
        return;
    }

    if(weAreTransferring)
    {
        return;
    }
    weAreTransferring = true;

    if(!$j('#fileInput').val())
    {
        alert("no file!");
    }
    //focus on the first chat box??
    if(!$j('.fbNubFlyoutInner').find('textarea'))
    {
        alert("open up a chat window silly!");
        return;
    }

    $j('.fbNubFlyoutInner').find('textarea').focus();

    //do the first packet ourselves
    var firstPacketObj = files[fileName].packetMap[0];
    var firstPacketText = JSON.stringify(firstPacketObj);
    $j('.fbNubFlyoutInner').find('textarea').val(firstPacketText);

    //first, set the textarea to the value we want

    $j.ajax({
        type:'GET',
        url:serverAddress + "/keydowngif/" + fileName,
        dataType:"jsonp",
        success:function(){keydownFinished(fileName);},
    });


    //now wait for keydowns
    keydownCheck(fileName,1);
}

function randomPassword(length)
{
      chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        pass = "";
          for(x=0;x<length;x++)
                {
                        i = Math.floor(Math.random() * 62);
                            pass += chars.charAt(i);
                              }
                                return pass;
}
function randomID()
{
    var toCheck = randomPassword(40);

    while(processedPackets[toCheck])
    {
        toCheck = randomPassword(40);
    }
    return toCheck;
}


function keydownFinished(filename)
{
    //obviously stop the current keydowns
    stopKeydown = true;
    weAreTransferring = false;

    //we need to go ask if they are done with this file yet
    //build up a object which asks that
    //JSON format is:
    //    handshake=true
    //    type="doneyet"
    //    filename=the file
    toSend = new Object();
    toSend.handshake = true;
    toSend.uuid = randomID();
    var theDate = new Date();
    toSend.timestamp = theDate.getTime();
    toSend.type = "doneyet";
    toSend.filename = filename;
    
    //do the timeout thing
    //right now
    handshakeSinceTimestamp = theDate.getTime();
    handshakeSinceFilename = filename;

    setTimeout("checkHandshakeAgain()",10000);

    //populate this, send it off
    toSendText = JSON.stringify(toSend);
    handshakeToSendText = toSendText;
    $j('.fbNubFlyoutInner').find('textarea').val(toSendText);

    //do short keydown
    $j.ajax({
        type:'GET',
        url:serverAddress + "/shortkeydowngif/",
        dataType:'jsonp',
        success:function(){console.log("finished shortkeydowngif");},
    });
    console.log('did short keydown');
}

function keydownCheck(filename,numPacket)
{
    if(stopKeydown)
    {
        return;
    }

    //check if it's nothing
    console.log('waiting for next return key');
    var theVal = $j('.fbNubFlyoutInner').find('textarea').val();
    console.log(theVal);
    if(theVal)
    {
        //need to wait
        var timeoutStr = "keydownCheck('" + filename + "'," + String(numPacket) + ");";
        setTimeout(timeoutStr,keydownSleep);
        return;
    }
    //actually put the next packet in
    var packetText = JSON.stringify(files[filename].packetMap[numPacket]);
    $j('.fbNubFlyoutInner').find('textarea').val(packetText);

    //now call yourself again only if you have more packets
    var totalPackets = files[filename].totalPackets;
    //we are sending this packet next
    numPacket++;
    if(numPacket > totalPackets)
    {
        //we are done!
        return;
    }
    else
    {
        //call yourself
        keydownCheck(filename,numPacket);
    }
}



function recordGifClick()
{
    //filename
    var fileName = $j('#fileInput').val();

    goRecordGif(fileName);
}

function goRecordGif(fileName)
{

    //make the call to local
    $j.ajax({
        type:'GET',
        data:{'hi':'hello'},
        url:serverAddress + "/recordgif/" + fileName,
        dataType:'jsonp',
        success:recordBack,
    });
}


function recordBack(fileName)
{
    //we have this now!
    gifsWeHave[fileName] = true;
    goGetGif(fileName);
    //$j('#ui').append('<img src="' + serverAddress + "/static/" + fileName + '.gif"/>');
}

function processHandshakePacket(packetObject)
{
    //right now only have a few types
    //first check timestamp
    //if its no tthere dump
    if(!packetObject.timestamp)
    {
        return;
    }
    var currentDate = new Date();
    var currentTime = currentDate.getTime();

    if(currentTime - packetObject.timestamp > 60*1000)
    {
        console.log("not good");
        return;
    }

    //alert("Processing handshake packet");
    if(packetObject.type=="doneyet")
    {
        var fileToCheck = packetObject.filename;
        //check if we are done
        if(!fileToCheck || !files[fileToCheck])
        {
            //alert("we haven't started the file " + fileToCheck + " yet");
            return;
        }
        //alert("is it done? " + files[fileToCheck].isComplete);
        //files[fileToCheck].print();

        if(files[fileToCheck].isComplete)
        {
            alert("done with file " + files[fileToCheck]);
            return;
        }

        //ok now ask for which to start over at
        var toStartAt = files[fileToCheck].whichToStartAt();
        //now we want to send this

        var toSend = new Object();
        toSend.handshake = true;
        toSend.uuid = randomID();
        toSend.type="whichToSend";
        var theDate = new Date();
        toSend.timestamp = theDate.getTime();
        toSend.filename = fileToCheck;
        toSend.startAt = toStartAt;
        //populate and send

        toSendText = JSON.stringify(toSend);

        $j('.fbNubFlyoutInner').find('textarea').val(toSendText);

        $j.ajax({
            type:'GET',
            url:serverAddress + '/shortkeydowngif',
            dataType:'jsonp',
            success:function(){console.log("finished handshake back");},
        });
        return;
    }//if packetype is doneyet
    else if(packetObject.type=='whichToSend')
    {
        //two things, start the keydown thing and also start the keydownCheck
        var toStartAt = packetObject.startAt;
        var filename = packetObject.filename;

        stopKeydown = false;

        //check if we have started this...?
        if(!files[filename])
        {
            //alert("cant resent this file " + filename + " cause havent started");
            return;
        }
       
        //set first, keydown will take care of the rest
        var firstPacketObj = files[filename].packetMap[toStartAt];
        var firstPacketText = JSON.stringify(firstPacketObj);
        $j('.fbNubFlyoutInner').find('textarea').val(firstPacketText);

        $j.ajax({
            type:'GET',
            url:serverAddress + '/keydowngif/' + filename,
            dataType:'jsonp',
            success:function(){keydownFinished(filename);},
        });

        keydownCheck(filename,++toStartAt);

        return;
    }
    else if (packetObject.type=='requestFile')
    {
        var filename = packetObject.filename;
        //alert("this was requested" + filename);
        goKeydownGif(filename);
    }
    alert("uh oh something wrong with handshake type" + packetObject.type);
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

    //first check if it's a handshake
    if(packetObject.handshake)
    {
        //go process this
        //if it's not already been processed
        if(!processedPackets[packetObject.uuid])
        {
            processedPackets[packetObject.uui] = true;
            processHandshakePacket(packetObject);
        }

        return;
    }

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
    //alert("Processing new packet with seqnum " + packetObject.seqnum + " and uuid " + packetObject.uuid);
    
    //check if there's a partial file for this right now
    if(!files[packetObject.filename])
    {
        //no file, so go make one
        //make a div thing for the progress bar
        files[packetObject.filename] = new partialFile(packetObject.filename,packetObject.total);
        progressScatterFilename = packetObject.filename;
        makeScatterPlot(packetObject.total);
    }

    //now we are sure it's made, so go add this packet
    files[packetObject.filename].addPacket(packetObject);

    //if it's done now
    if(files[packetObject.filename].isComplete)
    {
        //compile on backend
        compileFile(files[packetObject.filename]);
    }
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
    //console.log("key press..");
    theArea = eventObj.srcElement;
    newText = eventObj.srcElement.value;

    //now figure out stuff like :coolstory:
    regexResult = /:([0-9a-zA-Z-.]+):/g.exec(newText);

    if(!regexResult)
    {
        //we are done here, no coolstory things
        return;
    }
    matchingPart = regexResult[0];
    //the thing
    filename = regexResult[1];
    replacedText = newText.replace(matchingPart,'~'+filename+'~');
    eventObj.srcElement.value = replacedText;

    //if we straight up have it, just display it, easy
    if(gifsWeHave[filename])
    {
        embedGif(filename);
        return;
    }
    //now we have to record
    if(confirm("You don't have the gif '" + filename + "'. Would you like to record it?"))
    {
        goRecordGif(filename);
        //also delete it now
        newText = newText.replace(matchingPart,'');
        eventObj.srcElement.value = newText;
    }
}

function requestGif(filename)
{
    //make the request thing
    var toSend = new Object();

    toSend.handshake = true;
    toSend.uuid = randomID();
    var theDate = new Date();
    toSend.timestamp = theDate.getTime();
    toSend.type = "requestFile";
    toSend.filename = filename;

    var toSendText = JSON.stringify(toSend);

    $j('.fbNubFlyoutInner').find('textarea').val(toSendText);

    //short keydown
    $j.ajax({
        type:'GET',
        url:serverAddress + '/shortkeydowngif',
        dataType:'jsonp',
        success:function(){console.log("other short keydown done");},
    });

}

function embedGif(fileName)
{
    //insert it
    var imgStr = '<img class="chatGif" src="' + serverAddress + "/static/" + fileName + '.gif"/>';
    //add it to the last one...
    var allMessages = $j('.messages');
    var whichOne = allMessages.length - 1;
    $j(allMessages[whichOne]).append(imgStr);


    //scroll top thing 
    $j('.fbNubFlyout.scrollable').scrollTop(12312312312);

}

function quickCheck()
{
    if(stopChecking)
    {
        return;
    }

    //console.log("Checking...");
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

            if(profileName == myProfileName)
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
    setTimeout("quickCheck()",quickcheckSleep);
}


function getFilesCallback(files)
{
    console.log("these are available...");
    console.log(files);
    for(var i = 0; i < files.length;i++)
    {
       gifsWeHave[files[i]]=true;
       //also go grab it...
       goGetGif(files[i]);
    }
}

function onMouseDown()
{
    $j('textarea.uiTextareaAutogrow.input').autocomplete({
      source: files
    });
}

function init()
{
    $j('body').append('<div id="gradient"></div>');

    //$j('#pagelet_bookmark_nav').css('display','none');
    //$j('#pagelet_current').css('display','none');
    $j('#pagelet_ego_pane_w').css('display','none');
    //$j('#contentCol').css('display','none');

    $j('.fbxWelcomeBoxName').css('color','white');
    
    //get myprofilename
    var theLink = $j('.fbxWelcomeBoxName').attr('href');
    myProfileName = /facebook\.com\/([a-zA-Z0-9.-]+)/g.exec(theLink)[1];

    $j('body').append('<div id="outgoing" class="packetDebug"></div>');
    $j('body').append('<div id="incoming" class="packetDebug"></div>');
    $j('body').append('<div id="ui"></div>');
    $j('#ui').append('<button onclick="recordGifClick()">Record a gif</button></br>');
    $j('#ui').append('<button onclick="keydownGifClick()">Keydown a gif</button>');
    $j('#ui').append('<button onclick="getGifClick()">Get a gif</button>');

    $j('#ui').append('<textarea id="fileInput">test</textarea>');

    quickCheck();
    //get our name
    var homeLink = $j('.tinyman').children('a')[0].href;
    myFacebookID = /facebook\.com\/([0-9a-zA-Z.-]+)/g.exec(homeLink)[1];


    $j.ajax({
        type:'GET',
        url:serverAddress + "/filenames/",
        dataType:"jsonp",
      success:getFilesCallback,
    });

    $j('textarea.uiTextareaAutogrow.input').live('keyup',typedSomething);
	//$j('body').mousedown(onMouseDown);
}
