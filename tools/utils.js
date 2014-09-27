/*global module, exports*/
(function() {

  //these constructs contain variable scope (technically, there's catch scope and ES6 let)
  var SCOPE_TYPES = {FunctionDeclaration: 1, FunctionExpression: 1, Program: 1};

  // table of character substitutions
  var meta = {
    '\b': '\\x08',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '$' : '\\$',
    '\\': '\\\\'
  };

  function encodeString(string) {
    string = string.replace(/[\\"\$\x00-\x1f]/g, function(ch) {
      return (ch in meta) ? meta[ch] : '\\x' + ('0' + ch.charCodeAt(0).toString(16)).slice(-2);
    });
    string = string.replace(/[\x7f-\xff\u0100-\uffff]/g, function(ch) {
      return encodeURI(ch).split('%').join('\\x');
    });
    return '"' + string + '"';
  }

  function getParentScope(node) {
    var parent = node.parent;
    while (!(parent.type in SCOPE_TYPES)) {
      parent = parent.parent;
    }
    return (parent.type === 'Program') ? parent : parent.body;
  }

  exports.encodeString = encodeString;
  exports.getParentScope = getParentScope;

})();