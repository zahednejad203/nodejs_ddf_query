import fs from 'fs'
import csv from 'csvtojson'

export const hasProperty = () => {

}

export const fileExists  = (path) => {
	try {
	  if (fs.existsSync(path)) {
	    return true;
	  }
	} catch(err) {
	  return false;
	}
}

export const writeFile = (filename, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, 'utf8', (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

export const readJSONfile = (filename) => new Promise((resolve, reject) => {
  var obj;
  fs.readFile(filename, 'utf8', function (err, data) {
    if (err) throw err;
    obj = JSON.parse(data);
    resolve(obj);
  });
});

export const readCSV = (filename, callback) => csv()
.fromStream(fs.createReadStream(filename))
.subscribe(function(json){ //single json object will be emitted for each csv line
   // parse each json asynchronousely
   return new Promise(function(resolve){
        callback?.call(undefined, json, resolve)
   })
});
