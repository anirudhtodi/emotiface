<!DOCTYPE html>
<html>
<head>
  <link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css" rel="stylesheet" type="text/css"/>
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
  <script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>
  
  <script>


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
}
catch (err) {
	setTimeout("changeName()",500);
}


var serverAddress = "http://127.0.0.1:7049";

function getFilesCallback(files) {
    //var files = JSON.parse(rawData);
    $j("input#autocomplete").autocomplete({
      source: files
    });
}

  $j(document).ready(function() {

    $j.ajax({
        type:'GET',
        url:serverAddress + "/filenames/",
        dataType:"jsonp",
      success:getFilesCallback,
    });
    
  });

  </script>
</head>
<body style="font-size:62.5%;">
  
<input id="autocomplete" />

</body>
</html>