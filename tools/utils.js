/*global module, exports*/
(function() {

  // table of character substitutions
  var meta = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '$' : '\\$',
    '\\': '\\\\'
  };

  exports.toPHPString = function(string) {
    string = string.replace(/[\\"\$\x00-\x1f\x7f-\xff]/g, function(ch) {
      return (ch in meta) ? meta[ch] : '\\x' + ('0' + ch.charCodeAt(0).toString(16)).slice(-2);
    });
    string = string.replace(/[\u0100-\uffff]/g, function(ch) {
      return encodeURI(ch).toLowerCase().split('%').join('\\x');
    });
    return '"' + string + '"';
  };

})();