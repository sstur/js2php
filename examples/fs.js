/*global process*/
(function() {
  var fs = process.binding('fs');
  var pathname = './fs.js'; //self
  var text = fs.readFile(pathname, 'utf8');
  console.log(text);
})();