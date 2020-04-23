// ipfs routines

if (typeof(api_url) == 'undefined') {
var api_url = 'http://127.0.0.1:5001/api/v0/'
}

const core=getCoreName(document.location.href)
const pp = core['dir'].substr(1,2);
document.getElementById('core').innerHTML = core.name
console.log('core: ',core)

let peerid = getPeerId().then(resolve('peerid')); // get peerId promise

function resolve(tag) { return d => callback(tag,d) }
function callback(key,value) {
  let elements = document.getElementsByClassName('container');
  for (let i=0; i<elements.length; i++) {
    let e = elements[i];
    e.innerHTML = e.innerHTML.replace(new RegExp(':'+key,'g'),value)
  }
  return value;
}

function ipfsPublish(pubpath) {
  [parent,fname] = pubpath.split('/./')
  console.log('parent: ',parent);
  console.log('fname: ',fname);
  // get hash of parent
  return getMFSFileHash(parent)
  .then( hash => { // publish hash with folder name
    let record = hash+': '+parent;
    let indexlogf = core.dir+'/published/'+core.index
    return ipfsLogAppend(indexlogf,record)
    .then(
      getMFSFileHash(core.dir) // get hash of POR
      .then( hash => { // publish under self/peerid
       return ipfsNamePublish('self','/ipfs/'+hash)
       .then(consLog)
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
 url = api_url + 'add?file=blob.data&cid-version=0&only-hash=1'
 return fetchPostText(url,buf)
 .then( resp => resp.json() )
 .then( json => json.Hash ).catch(logError)

}

function ipfsWriteText(mfspath,buf) {
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=1&truncate=1';
    return fetchPostText(url, buf)
    .then(consLog)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
  })
  .catch(consLog)
}


function ipfsWriteJson(mfspath,obj) {
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=1&truncate=1';
    return fetchPostJson(url, obj)
    .then( _ => getMFSFileHash(mfspath)) 
    .catch(logError)
  })
  .catch(consLog)
}
function ipfsLogAppend(mfspath,record) {
  return createParent(mfspath)
  .then( _ => getMFSFileSize(mfspath))
  .then( offset => {
    var url = api_url + 'files/write?arg=' + mfspath + '&create=1&offset='+offset;
    console.log(mfspath,': offset=',offset);
    return fetchPostText(url, record+"\n")
  .then( _ => getMFSFileHash(mfspath)) 
  })
  .catch(logError)
}

function getContentHash(buf) {
    url = api_url + 'add?file=published.blob&cid-version=0&only-hash=0'
    return fetchPostText(url,buf)
    .then( resp => resp.json() )
    .then( json => json.Hash ).catch(logError)
}

function createParent(path) {
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
         if (resp.text() == '') { // if mkdir sucessful, return hash
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
  .catch(logError)
}

function getMFSFileSize(mfspath) {
  var url = api_url + 'files/stat?arg=' + mfspath + '&size=true'
  return fetch(url).then( resp => resp.json() )
  .then( json => { return (typeof json.Size == 'undefined') ? 0 : json.Size } )
  .catch(consLog)
}
function getMFSFileHash(mfspath) {
   var url = api_url + 'files/stat?arg='+mfspath+'&hash=true'
   return fetch(url).then( resp => resp.json() )
   .then( json => {
       if (typeof json.Hash == 'undefined') {
         if (typeof(qmEmpty) != 'undefined') { return qmEmpty }
         else { return undefined }
       } else {
         return json.Hash
       }
   })
   .catch(logError)
}



function getPeerId() {
     let url = api_url + 'config?&arg=Identity.PeerID&encoding=json';
     return fetch(url,{ method: "GET"} )
     .then( resp => resp.json() )
     .then( obj => { return Promise.resolve(obj.Value) })
     .catch(logError)
}

function getCoreName(url) {
  console.log('url: '+url)
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
