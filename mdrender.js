/* This script look for a data attibute in div
 * replace the div with the url content
 * and render the markdown into the div it self
 
showdown.min.js 1.9.1
 see also https://www.jsdelivr.com/package/npm/showdown

 https://cdn.jsdelivr.net/npm/showdown@latest/dist/showdown.min.js
 https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js
 https://unpkg.com/showdown/dist/showdown.min.js

 */

// include the markdown script ...
var script = document.createElement('script');
    script.setAttribute('type','text/javascript');
    script.src = 'https://cdn.jsdelivr.net/npm/showdown@latest/dist/showdown.min.js'
    document.getElementsByTagName('head')[0].appendChild(script);

let divs = document.getElementsByTagName('div');
for (let i = 0; i < divs.length; i++) {
  let e = divs[i];
  if (typeof(e.dataset.md) != 'undefined') {
     let md_url = e.dataset.md;
     var request = new XMLHttpRequest();
     request.open('GET', md_url, true);
     request.send();
     request.onload = function () { // display the fetched markdown
        resp = request.response.toString()
        e.innerHTML = resp;
        let buf = resp.replace(/\\\n/g,'<br>');
        if ( typeof(showdown) == 'undefined' ) {
          e.innerHTML = "/!\\ showdown failed to load"
          script.onload = function () {
             var converter = new showdown.Converter();
             e.innerHTML = converter.makeHtml(buf);
          }
        } else {
          var converter = new showdown.Converter();
          e.innerHTML = converter.makeHtml(buf);
        }
     }
  }
}


// script.onreadystatechange = function () { }

