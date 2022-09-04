/*global module, exports*/
(function () {
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  //these constructs contain variable scope (technically, there's catch scope and ES6 let)
  var SCOPE_TYPES = {
    FunctionDeclaration: 1,
    FunctionExpression: 1,
    Program: 1,
  };

  //these have special meaning in PHP so we escape variables with these names
  var SUPER_GLOBALS = {
    GLOBALS: 1,
    _SERVER: 1,
    _GET: 1,
    _POST: 1,
    _FILES: 1,
    _COOKIE: 1,
    _SESSION: 1,
    _REQUEST: 1,
    _ENV: 1,
  };

  // table of character substitutions
  var ESC_CHARS = {
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    $: '\\$',
    '\\': '\\\\',
  };

  function toHex(code, prefix) {
    var hex = code.toString(16).toUpperCase();
    if (hex.length === 1) {
      hex = '0' + hex;
    }
    if (prefix) {
      hex = prefix + hex;
    }
    return hex;
  }

  function toOctet(codePoint, shift, prefix) {
    return toHex(((codePoint >> shift) & 0x3f) | 0x80, prefix);
  }

  //encode unicode character to a set of escaped octets like \xC2\xA9
  function encodeChar(ch, prefix) {
    var code = ch.charCodeAt(0);
    if ((code & 0xffffff80) == 0) {
      // 1-byte sequence
      return toHex(code, prefix);
    }
    var result = '';
    if ((code & 0xfffff800) == 0) {
      // 2-byte sequence
      result = toHex(((code >> 6) & 0x1f) | 0xc0, prefix);
    } else if ((code & 0xffff0000) == 0) {
      // 3-byte sequence
      result = toHex(((code >> 12) & 0x0f) | 0xe0, prefix);
      result += toOctet(code, 6, prefix);
    } else if ((code & 0xffe00000) == 0) {
      // 4-byte sequence
      result = toHex(((code >> 18) & 0x07) | 0xf0, prefix);
      result += toOctet(code, 12, prefix);
      result += toOctet(code, 6, prefix);
    }
    result += toHex((code & 0x3f) | 0x80, prefix);
    return result;
  }

  function encodeString(string) {
    string = string.replace(/[\\"\$\x00-\x1F\u007F-\uFFFF]/g, function (ch) {
      return ch in ESC_CHARS ? ESC_CHARS[ch] : encodeChar(ch, '\\x');
    });
    return '"' + string + '"';
  }

  function encodeVarName(name, suffix) {
    suffix = suffix || '';
    if (!suffix && hasOwnProperty.call(SUPER_GLOBALS, name)) {
      suffix = '_';
    }
    if (!suffix && name.slice(-1) === '_') {
      suffix = '_';
    }
    name = name.replace(/[^a-z0-9_]/gi, function (ch) {
      return '«' + encodeChar(ch).toLowerCase() + '»';
    });
    if (suffix === '' && name === '__dirname') {
      return '__DIR__';
    }
    return '$' + name + suffix;
  }

  function getParentScope(node) {
    var parent = node.parent;
    while (!(parent.type in SCOPE_TYPES)) {
      parent = parent.parent;
    }
    return parent.type === 'Program' ? parent : parent.body;
  }

  exports.encodeString = encodeString;
  exports.encodeVarName = encodeVarName;
  exports.getParentScope = getParentScope;
})();
