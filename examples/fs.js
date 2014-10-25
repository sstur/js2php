/*global process*/
(function() {
  var fs = process.binding('fs');
  var info = fs.getInfo('./test', true);
  var children = info.children;
  //children = children.map(function(item) { return item.name; });
  var names = [];
  children.forEach(function(child) {
    names.push(child.name);
  });
  //delete info.children;
  //console.log(children.length, names.join(', '));
  var s = JSON.stringify(info);
  console.log(s);
//  var pathname = './runtime.php';
//  var data = fs.readFile(pathname, 'utf8');
//  fs.writeFile('./_runtime.php', data);
//  console.log(data + '\n');
})();