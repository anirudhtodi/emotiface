$(document).ready(function() {
    var dropbox = document.getElementById("dropbox")

    // init event handlers
    dropbox.addEventListener("dragenter", dragEnter, false);
    dropbox.addEventListener("dragexit", dragExit, false);
    dropbox.addEventListener("dragover", dragOver, false);
    dropbox.addEventListener("drop", drop, false);

    // init the widgets
    $("#progressbar").progressbar();
});

function dragEnter(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}

function dragExit(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}

function dragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}

function drop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    theEvent = evt;
    console.log(evt);
    var files = evt.dataTransfer.files;
    var count = files.length;

    // Only call the handler if 1 or more files was dropped.
    if (count > 0)
	handleFiles(files);
}


function handleFiles(files) {
    var file = files[0];
    alert(file.fileName);
    $j.ajax({
    	type:'GET',
    	url:serverAddress + '/filetransfer/' + file.fileName,
        dataType:'jsonp',
        success:####
    });
}

function handleReaderProgress(evt) {
    if (evt.lengthComputable) {
	var loaded = (evt.loaded / evt.total);

	$("#progressbar").progressbar({ value: loaded * 100 });
    }
}

function handleReaderLoadEnd(evt) {
    $("#progressbar").progressbar({ value: 100 });

    var img = document.getElementById("preview");
    img.src = evt.target.result;
}
