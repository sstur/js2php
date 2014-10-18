/*global process*/
(function() {
  var fs = process.binding('fs');
  var pathname = './runtime.php';
  var data = fs.readFile(pathname, 'utf8');
  fs.writeFile('./_runtime.php', data);
  console.log(data + '\n');
})();