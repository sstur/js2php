/*global process*/
(function() {
  var request = process.binding('request');
  var response = process.binding('response');
  var method = request.getMethod();
  var url = request.getURL();
  console.log('Request:', method, url);
  var resHeaders = {
    'Content-Type': 'text/plain'
  };
  response.writeHead(200, 'OK', resHeaders);
  response.write(method + ' ' + url + '\n');
  var reqHeaders = request.getHeaders();
  Object.keys(reqHeaders).forEach(function(key) {
    response.write(key + ': ' + reqHeaders[key] + '\n');
  });
  response.end();
})();