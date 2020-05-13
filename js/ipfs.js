// ipfs routines
console.log('ipfs.js: v1.0');

if (typeof(api_url) == 'undefined') {
var api_url = 'http://127.0.0.1:5001/api/v0/'
console.log('api_url: ',api_url)
}
if (typeof(gw_url) == 'undefined') {
var gw_url = 'http://127.0.0.1:8080'
console.log('gw_url: ',gw_url)
}

// detecte the core ...
const core=getCoreName(document.location.href)
const pp = core['dir'].substr(1,2);
let coreid = document.getElementById('core')
if (coreid) {
  document.getElementById('core').innerHTML = core.name
console.log('core: ',core)
}

var container = document.getElementsByClassName('container');

// get the peer id ...
let peerid = getPeerId()
.then(id => { peerid = (typeof(id) == 'undefined') ? 'QmYourIPFSisNotRunning' : id; return peerid })
//.then( updateGlobalContainer('peerid'))
// .then( updateByName('container','peerid') )
.then( updatePeerId )
.then( peerid => {
  let s = peerid.substr(0,7);
  console.log('s: ',s);
  replaceHTML('shortid',s)
})
.catch(logError);

function updatePeerId(id) { 
  let e = document.getElementsByTagName('form')[0].elements['peerid'];
  console.log('peerid: '+id)
  if (typeof(e) != 'undefined') {
    console.log(e.outerHTML)
    e.value = e.value.replace(new RegExp(':peerid','g'),id)
  }
  return id
}

function updateGlobalContainer(name) {
  return value => { container.innerHTML = container.innerHTML.replace(new RegExp(':'+name,'g'),value); return value; }
}


function updateByName(where,name) { return value => {
   if (typeof(callback) != 'undefined') {
      callback(name,value)
   } else {
      let elements = document.getElementsByClassName(where);
      for (let i=0; i<elements.length; i++) {
         let e = elements[i];
         e.insertAdjacentHTML('beforeEnd', e.innerHTML.replace(new RegExp(':'+name,'g'),value))
         //console.log(e.innerHTML)
      }
   }
   return value;
 }
}
function replaceHTML(name,value) {
   let elements = document.getElementsByClassName(name);
   for (let i=0; i<elements.length; i++) {
      let e = elements[i];
      /* assign outerHTML doesn't seem to work directly */
      /*
      e.insertAdjacentHTML('beforeBegin', e.outerHTML.replace(new RegExp(':'+name,'g'),value))
      console.dir(e.parentElement)
      e.parentElement.removeChild(e)
      console.log('outer: '+e.outerHTML); /* old element still exist !

      */
      for (let a of ['href','title','src','innerHTML','alt']) {
         if (typeof(e[a]) != 'undefined' && e[a].match(name)) {
            console.log(a+': ',e[a])
            e[a] = e[a].replace(new RegExp(':'+name,'g'),value)
         
         }
      }
   }
}


function ipfsPublish(pubpath) {
  let parent;
  let fname
  if (pubpath.match('/./')) {
  [parent,fname] = pubpath.split('/./')
  } else {
    let p = pubpath.lastIndexOf('/')
    console.log('p: '+p)
    parent = pubpath.substr(0,p)
    fname = pubpath.substr(p+1)
  }
  console.log('parent: ',parent);
  console.log('fname: ',fname);
  // get hash of parent
  return getMFSFileHash(parent)
  .then( hash => { // publish hash with folder name
    let record = hash+': '+parent;
    console.log('record: ',record)
    let indexlogf = core.dir+'/published/'+core.index
    return ipfsLogAppend(indexlogf,record)
    .then(
      getMFSFileHash(core.dir) // get hash of POR
      .then( hash => { // publish under self/peerid
       return ipfsNamePublish('self','/ipfs/'+hash)
       .then(consLog('ipfsNamePublish'))
       .catch(logError)
      })
      .catch(logError)
    )

  })
  .catch(logError)
  
}

function ipfsNamePublish(k,v) {
    var url = api_url + 'name/publish?key='+k+'&arg='+v+'&allow-offline=1&resolve=0';
    return fetchGetJson(url).catch(logError)
}


function ipfsAddBinaryFile(file) {
 return readAsBinaryString(file)
 .then( buf => {
   url = api_url + 'add?file=file.txt&cid-version=0'
   return fetchPostBinary(url,buf)
   .then( resp => resp.json() )
   .then( json => json.Hash ).catch(logError)
 })
 .catch(logError)
}
function ipfsAddTextFile(file) {
 return readAsText(file)
 .then( buf => {
   // curl -X POST -F file=@myfile "http://127.0.0.1:5001/api/v0/add?quiet=0&quieter=0&silent=0&progress=0&trickle=0&only-hash=1
   //  &wrap-with-directory=0&chunker=size-262144&pin=1&raw-leaves=1
   //  &nocopy=0&fscache=1&cid-version=0&hash=sha2-256&inline=0&inline-limit=32"
   url = api_url + 'add?file=file.txt&cid-version=0&only-hash=1'
   return fetchPostText(url,buf)
   .then( resp => resp.json() )
   .then( json => json.Hash ).catch(logError)
 })
 .catch(logError)
}

function getContentHash(buf) {
 url = api_url + 'add?file=blob.data&cid-version=0&hash-only=1'
 console.log('url: '+url);
 return fetchPostBinary(url,buf)
 .then( resp => resp.json() )
 .then(consLog('getContentHash'))
 .then( json => json.Hash )
 .catch(logError)

}

function ipfsRmMFSFile(mfspath) {
   url = api_url + 'files/rm?arg='+mfspath
   return fetch(url)
   .then( resp => {
      if (resp.ok) { return resp.text(); }
      else { return resp.json(); }
   })
   .catch(logError)
}
function ipfsCpMFSFile(target,source) {
   url = api_url + 'files/cp?arg='+source+'&arg='+target;
   return fetch(url)
   .then( resp => {
      console.log('resp: ',resp)
      if (resp.ok) { return resp.text(); }
      else { return resp.json(); }
   })
   .catch(logError)

}
function ipfsWriteContent(mfspath,buf) {
// truncate doesn't work !
// so do a rm before
  return createParent(mfspath)
  .then(ipfsRmMFSFile(mfspath))
  .then( _ => {
    var url = api_url + 'files/write?arg=' + mfspath + '&create=true&truncate=false';
    return fetchPostBinary(url, buf)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
   })
   .catch(consLog('ipfsWriteContent'))
}
function ipfsWriteText(mfspath,buf) {
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=true&truncate=false';
    return fetchPostText(url, buf)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
  })
  .catch(consLog('ipfsWriteText.createParent'))
}


function ipfsWriteBinary(mfspath,buf) { // truncate doesn't work !
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=true&truncate=false';
    return fetchPostBinary(url, buf)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
  })
  .catch(consLog('ipfsWriteBinary.createParent'))
}
function ipfsWriteText(mfspath,buf) {
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=true&truncate=false';
    return fetchPostText(url, buf)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
  })
  .catch(consLog('ipfsWriteText.createParent'))
}


function ipfsWriteJson(mfspath,obj) {
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=true&truncate=false';
    return fetchPostJson(url, obj)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
  })
  .catch(consLog('ipfsWriteJson.createParent'))
}
function ipfsLogAppend(mfspath,record) {
  return createParent(mfspath)
  .then( _ => getMFSFileSize(mfspath))
  .then( offset => {
    var url = api_url + 'files/write?arg=' + mfspath + '&raw-leave=true&trickle=true&cid-base=base58btc&create=true&offset='+offset;
    console.log(mfspath,': offset=',offset);
    return fetchPostText(url, record+"\n")
  .then( _ => getMFSFileHash(mfspath)) 
  })
  .catch(logError)
}

function createParent(path) {
  console.log('createParent: '+path)
  let dir = path.replace(new RegExp('/[^/]*$'),'');
  var url = api_url + 'files/stat?arg=' + dir + '&size=true'
  return fetch(url).then( resp => resp.json() )
  .then( json => {
    if (typeof(json.Code) == 'undefined') {
      console.log('-d '+dir + '; stat: ', json);
      return json;
    } else {
      // {"Message":"file does not exist","Code":0,"Type":"error"}
      console.log('! -e '+dir);
      console.log(json)
      url = api_url + 'files/mkdir?arg=' + dir + '&parents=true'
      return fetch(url).then(
       resp => {
         console.log('mkdir.resp: ',resp)
         if (resp.ok) { // if mkdir sucessful, return hash
           var url = api_url + 'files/stat?arg=' + dir + '&size=true'
           return fetch(url).then( resp => resp.json() )
         } else {
           Promise.reject(new Error(resp.statusText))
         }
       })
      .then ( obj => { console.log('mkdir: ',obj); return obj })
      .catch(logError)
    } 
  })
  .catch(consLog('Error:'))
}

function getMFSFileSize(mfspath) {
  var url = api_url + 'files/stat?arg=' + mfspath + '&size=true'
  return fetch(url)
  .then( resp => resp.json() )
  .then( json => { return (typeof json.Size == 'undefined') ? 0 : json.Size } )
  .catch(consLog('getMFSFileSize'))
}
function getMFSFileHash(mfspath) {
   var url = api_url + 'files/stat?arg='+mfspath+'&hash=true'
   return fetch(url)
   .then( resp => resp.json() )
   .then( json => {
       if (typeof json.Hash == 'undefined') {
         if (typeof(qmEmpty) != 'undefined') { return qmEmpty }
         else { return 'QmYYY' }
       } else {
         return json.Hash
       }
   })
   .catch(logError)
}

function fetchAPI(url) {
  return fetch(url)
  .then
  .catch(ConsLog('fetchAPI')) {
  }
}

function getPeerId() {
     let url = api_url + 'config?&arg=Identity.PeerID&encoding=json';
     return fetch(url,{ method: "GET"} )
     .then( resp => resp.json() )
     .then( obj => { return Promise.resolve(obj.Value) })
     .catch(logError)
}

function getCoreName(url) {
  console.log('getCoreName.url: '+url)
  let core = {};
  if (url.match('holo') ) {
    core['name'] = 'holoRings'
    core['index'] = 'hlindex.log'
    core['dir'] = '/.hlrings';
  } else if (url.match('block')) {
    core['name'] = 'blockRing™'
    core['dir'] = '/.brings';
  } else if (url.match('KIN')) {
    core['name'] = 'Krys*thal INtelligence Network'
    core['index'] = 'knindex.log'
    core['dir'] = '/.knrings';
  } else if (url.match('js')) {
    core['name'] = 'jsRings™'
    core['index'] = 'jsindex.log'
    core['dir'] = '/.jsrings';
  } else {
    core['name'] = 'persoRings'
    core['index'] = 'prindex.log'
    core['dir'] = '/.prings'; // privateRings
  }
  return core;
}
