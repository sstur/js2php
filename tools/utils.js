/*global module, exports*/
(function() {

  //these constructs contain variable scope (technically, there's catch scope and ES6 let)
  var SCOPE_TYPES = {"FunctionDeclaration": 1, "FunctionExpression": 1, "Program": 1};

  //these constructs contain variable scope (technically, there's catch scope and ES6 let)
  var SUPER_GLOBALS = {"GLOBALS": 1, "_SERVER": 1, "_GET": 1, "_POST": 1, "_FILES": 1, "_COOKIE": 1, "_SESSION": 1, "_REQUEST": 1, "_ENV": 1};

  // table of character substitutions
  var meta = {
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '$' : '\\$',
    '\\': '\\\\'
  };

  function pad(s) {
    return (s.length < 2) ? '0' + s : s;
  }

  function encodeString(string) {
    string = string.replace(/[\\"\$\x00-\x1F]/g, function(ch) {
      return (ch in meta) ? meta[ch] : '\\x' + pad(ch.charCodeAt(0).toString(16).toUpperCase());
    });
    string = string.replace(/[\x7F-\xFF\u0100-\uFFFF]/g, function(ch) {
      return encodeURI(ch).split('%').join('\\x');
    });
    return '"' + string + '"';
  }

  function encodeVarName(name, suffix) {
    suffix = suffix || '';
    if (!suffix && SUPER_GLOBALS[name]) {
      suffix = '_';
    }
    if (!suffix && name.slice(-1) === '_') {
      suffix = '_';
    }
    return '$' + name.replace(/[^a-z0-9_]/ig, encodeVarChar) + suffix;
  }

  function encodeVarChar(ch) {
    var code = ch.charCodeAt(0);
    if (code < 128) {
      var hex = code.toString(16);
      hex = hex.length === 1 ? '0' + hex : hex;
      return '«' + hex + '»';
    }
    return encodeURI(ch).replace(/%(..)/g, '«$1»').toLowerCase();
  }

  function getParentScope(node) {
    var parent = node.parent;
    while (!(parent.type in SCOPE_TYPES)) {
      parent = parent.parent;
    }
    return (parent.type === 'Program') ? parent : parent.body;
  }

  exports.encodeString = encodeString;
  exports.encodeVarName = encodeVarName;
  exports.getParentScope = getParentScope;

})();