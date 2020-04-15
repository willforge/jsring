const gw='http://127.0.0.1:8080'
let tic = getTic();

const myform = document.getElementsByTagName('form')[0]
let promises = [
  getCfIp().then( resolve(myform,'ip') ),
 getPeerId().then( resolve(myform,'peerid') ).then( changeImage('photo') )
];

 Promise.all(promises).then(
  _  => {
    [ip,peerid] = _
    console.log('ip: '+ip);
    console.log('peerid: '+peerid);
  }
)

function process(form) { // onclick 
  let query = getQuery(form);
  ipfsLogAppend('/var/logs/forms.log',query+'&tic'+tic)
  .then( hash => {
    console.log('hash: ',hash);
    document.getElementById('hash').innerHTML = '<a href="'+gw+'/ipfs/'+hash+'">'+hash+'</a>';
   })
  .catch(logError)

  let id = query2json(query)
  console.log(id)
}

function changeImage(imgid) {
   return substi = x => {
   if (typeof x == 'undefined') {
     document.getElementById(imgid).src='img/anon.svg'
    document.getElementById('hash').innerHTML = '/!\\ IPFS is not available'
    document.getElementById('hash').style.color = 'red'
   } else {
     document.getElementById(imgid).src='https://api.adorable.io/avatar/256/'+x+'.png'
   }
   return x };
}

function resolve(form,name) {
   return substi = x => { addInput(form,name,x); return x };
}

// update input element w/i form
function addInput(form,name,value) {
	 let e = form.elements[name];
   if (typeof e != 'undefined') {
	   e.value = value;
   } else {
     let s = document.createElement('span'); s.innerHTML = name + ' :'
     form.insertBefore(s,form.elements['button']); 

     let i = document.createElement('input');
     i.setAttribute('name',name);
     i.setAttribute('type','text');
     i.setAttribute('value',value);
     i.disabled = true;
     form.insertBefore(i,form.elements['button']);

     let b = document.createElement('br');
     form.insertBefore(b,form.elements['button']);
   }
}

function ipfsLogAppend(mfspath,record) {
  const api_url = 'http://127.0.0.1:5001/api/v0/'
  return createParent(mfspath)
  .then( _ => getMFSFileSize(mfspath))
  .then( offset => {
    var url = api_url + 'files/write?arg=' + mfspath + '&create=1&offset='+offset;
    console.log('offset: ',offset);
    return fetchPostText(url, record+"\n")
  .then( _ => getMFSFileHash(mfspath)) 
  .catch(logError)
  })
  .catch(logError)
}

function createParent(path) {
  const api_url = 'http://127.0.0.1:5001/api/v0/'
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
  const api_url = 'http://127.0.0.1:5001/api/v0/'
  var url = api_url + 'files/stat?arg=' + mfspath + '&size=true'
  return fetch(url).then( resp => resp.json() )
  .then( json => { return (typeof json.Size == 'undefined') ? 0 : json.Size } )
  .catch(logError)
}
function getMFSFileHash(mfspath) {
   const api_url = 'http://127.0.0.1:5001/api/v0/'
   var url = api_url + 'files/stat?arg='+mfspath+'&hash=true'
   return fetchGetJson(url)
   .then( json => { return json.Hash} );
}

