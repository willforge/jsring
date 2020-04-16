// ipfs routines

function ipfsPublish(pubpath) {
  [parent,fname] = pubpath.split('/./')
  console.log('parent: ',parent);
  console.log('fname: ',fname);
}

function ipfsWriteJson(mfspath,obj) {
  return createParent(mfspath)
  .then( _ => {
     var url = api_url + 'files/write?arg=' + mfspath + '&create=1&truncate=1';
    return fetchPostJson(url, obj)
    .then( _ => getMFSFileHash(mfspath)) 
    .then(consLog)
  })
  .catch(logError)
}
function ipfsLogAppend(mfspath,record) {
  return createParent(mfspath)
  .then( _ => getMFSFileSize(mfspath))
  .then( offset => {
    var url = api_url + 'files/write?arg=' + mfspath + '&create=1&offset='+offset;
    console.log('offset: ',offset);
    return fetchPostText(url, record+"\n")
  .then( _ => getMFSFileHash(mfspath)) 
  })
  .catch(logError)
}

function createParent(path) {
  let dir = path.replace(new RegExp('/[^/]*$'),'');
  var url = api_url + 'files/stat?arg=' + dir + '&size=true'
  return fetch(url).then( resp => resp.json() )
  .then( json => {
    if (typeof(json.Code) == 'undefined') {
      console.log('-d '+dir);
      return json;
    } else {
      // {"Message":"file does not exist","Code":0,"Type":"error"}
      console.log('! -e '+dir);
      url = api_url + 'files/mkdir?arg=' + dir + '&parents=true'
      return fetch(url).then(
       resp => {
         if (resp.text() == '') {
           var url = api_url + 'files/stat?arg=' + dir + '&size=true'
           return fetch(url).then( resp => resp.json() )
         } else {
           Promise.reject(new Error(resp.statusText))
         }
       })
      .then ( obj => { console.log(obj) })
    } 
  })
  .catch(logError)
}

function getMFSFileSize(mfspath) {
  var url = api_url + 'files/stat?arg=' + mfspath + '&size=true'
  return fetch(url).then( resp => resp.json() )
  .then( json => { return (typeof json.Size == 'undefined') ? 0 : json.Size } )
  .catch(logError)
}
function getMFSFileHash(mfspath) {
   var url = api_url + 'files/stat?arg='+mfspath+'&hash=true'
   return fetch(url).then( resp => resp.json() )
   .then( json => { return json.Hash} )
   .catch(logError)
}

