// ==UserScript==
// @name          Emotifaces!
// @description   Everyone loves gifs!
// @match 	  http://facebook.com/
// @match 	  https://facebook.com/
// @match	  http://www.facebook.com/
// @match	  https://www.facebook.com/
// ==/UserScript==

//document.body.style.backgroundColor = "#0066cc";

_my_script1=document.createElement('SCRIPT');
_my_script3=document.createElement('SCRIPT');
_my_style=document.createElement('LINK');

_my_script1.type='text/javascript';
_my_script3.type='text/javascript';

_my_style.type='text/css';
_my_style.rel="stylesheet";
_my_style.media="all";

_my_script1.src='http://127.0.0.1:7049/static/thejs.js';
_my_script3.src='http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js';
_my_style.href='http://127.0.0.1:7049/static/style.css';

document.getElementsByTagName('head')[0].appendChild(_my_script1);
document.getElementsByTagName('head')[0].appendChild(_my_script3);
document.getElementsByTagName('head')[0].appendChild(_my_style);

console.log('done with both');



	

