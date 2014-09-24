(function() {
  var util = require('util');
  var utils = require('./utils');

  var toString = Object.prototype.toString;

  var OPERATOR_MAP = {
    //unary operators
    'u:-': 'negate',
    'u:+': 'unary_plus',
    'u:~': 'bitwise_not',
    //binary operators
    'b:+': 'plus',
    'b:&&': 'and',
    'b:||': 'or',
    'b:&': 'bitwise_and',
    'b:|': 'bitwise_or',
    'b:^': 'bitwise_xor',
    'b:<<': 'bitwise_ls', //left shift
    'b:>>': 'bitwise_sprs', //sign-propagating right shift
    'b:>>>': 'bitwise_zfrs' //zero-fill right shift
  };

  //built-in globals (should not be re-assigned)
  var GLOBALS = {'Array': 1, 'Boolean': 1, 'Buffer': 1, 'Date': 1, 'Error': 1, 'Function': 1, 'Infinity': 1, 'JSON': 1, 'Math': 1, 'NaN': 1, 'Number': 1, 'Object': 1, 'RegExp': 1, 'String': 1, 'console': 1, 'decodeURI': 1, 'decodeURIComponent': 1, 'encodeURI': 1, 'encodeURIComponent': 1, 'escape': 1, 'eval': 1, 'isFinite': 1, 'isNaN': 1, 'parseFloat': 1, 'parseInt': 1, 'undefined': 1, 'unescape': 1};

  var gen = {
    //accepts a BlockStatement or an ExpressionStatement (turns to block)
    // assumes the `{}` have already been generated
    toBlock: function(node, opts) {
      if (node.type === 'BlockStatement') {
        return gen.Body(node, opts);
      }
      opts.indentLevel += 1;
      var result = generate(node, opts);
      if (result) {
        result = indent(opts.indentLevel) + result;
      }
      opts.indentLevel -= 1;
      return result;
    },

    //generate function or program body
    // assumes the `{}` have already been written
    'Body': function(node, opts) {
      var scopeIndex = node.scopeIndex || Object.create(null);
      var results = [];
      opts.indentLevel += 1;
      if (node.type === 'Program' && scopeIndex.thisFound) {
        results.push(indent(opts.indentLevel) + '$this_ = $global;\n');
      }
      if (node.vars) {
        var implicitlyDefined = node.implicitVars || {};
        var declarations = [];
        Object.keys(node.vars).forEach(function(name) {
          if (!implicitlyDefined[name]) {
            declarations.push(encodeVarName(name) + ' = null;');
          }
        });
        if (declarations.length) {
          results.push(indent(opts.indentLevel) + declarations.join(' ') + '\n');
        }
      }
      var funcDeclarations = node.funcs;
      if (funcDeclarations) {
        Object.keys(funcDeclarations).forEach(function(name) {
          var func = gen.FunctionExpression(funcDeclarations[name], opts);
          results.push(indent(opts.indentLevel) + encodeVarName(name) + ' = ' + func + ';\n');
        });
      }

      node.body.forEach(function(node) {
        var result = generate(node, opts);
        if (result) {
          results.push(indent(opts.indentLevel) + result);
        }
      });
      if (opts.indentLevel > 0) {
        opts.indentLevel -= 1;
      }
      return results.join('');
    },

    'BlockStatement': function(node, opts) {
      var results = ['{\n'];
      results.push(gen.Body(node, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'VariableDeclaration': function(node, opts) {
      var results = [];
      node.declarations.forEach(function(node) {
        if (node.init) {
          results.push(encodeVar(node.id) + ' = ' + generate(node.init, opts));
        }
      });
      if (!results.length) {
        return '';
      }
      if (node.parent.type === 'ForStatement') {
        return results.join(', ');
      }
      return results.join('; ') + ';\n';
    },

    'IfStatement': function(node, opts) {
      var results = ['if ('];
      results.push(generate(node.test, opts));
      results.push(') {\n');
      results.push(gen.toBlock(node.consequent, opts));
      results.push(indent(opts.indentLevel) + '}');
      if (node.alternate) {
        results.push(' else ');
        if (node.alternate.type === 'IfStatement') {
          results.push(generate(node.alternate, opts));
        } else {
          results.push('{\n');
          results.push(gen.toBlock(node.alternate, opts));
          results.push(indent(opts.indentLevel) + '}\n');
        }
      }
      return results.join('') + '\n';
    },

    'SwitchStatement': function(node, opts) {
      var results = ['switch ('];
      results.push(generate(node.discriminant, opts));
      results.push(') {\n');
      opts.indentLevel += 1;
      node.cases.forEach(function(node) {
        results.push(indent(opts.indentLevel));
        if (node.test === null) {
          results.push('default:\n');
        } else {
          results.push('case ' + generate(node.test, opts) + ':\n');
        }
        opts.indentLevel += 1;
        node.consequent.forEach(function(node) {
          results.push(indent(opts.indentLevel) + generate(node, opts));
        });
        opts.indentLevel -= 1;
      });
      opts.indentLevel -= 1;
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'ConditionalExpression': function(node, opts) {
      return generate(node.test, opts) + ' ? ' + generate(node.consequent, opts) + ' : ' + generate(node.alternate, opts);
    },

    'ForStatement': function(node, opts) {
      var results = ['for ('];
      results.push(generate(node.init, opts) + '; ');
      results.push(generate(node.test, opts) + '; ');
      results.push(generate(node.update, opts));
      results.push(') {\n');
      results.push(gen.toBlock(node.body, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'ForInStatement': function(node, opts) {
      var results = [];
      if (node.left.type === 'VariableDeclaration') {
        var identifier = node.left.declarations[0].id;
      } else
      if (node.left.type === 'Identifier') {
        identifier = node.left;
      } else {
        throw new Error('Unknown left part of for..in `' + node.left.type + '`');
      }
      results.push('foreach (keys(');
      results.push(generate(node.right, opts) + ') as $i_ => ' + encodeVar(identifier) + ') {\n');
      results.push(gen.toBlock(node.body, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'WhileStatement': function(node, opts) {
      var results = ['while ('];
      results.push(generate(node.test, opts));
      results.push(') {\n');
      results.push(gen.toBlock(node.body, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'DoWhileStatement': function(node, opts) {
      var results = ['do {\n'];
      results.push(gen.toBlock(node.body, opts));
      results.push(indent(opts.indentLevel) + '} while (' + generate(node.test, opts) + ');');
      return results.join('') + '\n';
    },

    'TryStatement': function(node, opts) {
      var catchClause = node.handlers[0];
      var param = catchClause.param;
      var results = ['try {\n'];
      results.push(gen.Body(node.block, opts));
      results.push(indent(opts.indentLevel) + '} catch(Exception ' + encodeVar(param) + ') {\n');
      results.push(indent(opts.indentLevel + 1) + 'if (' + encodeVar(param) + ' instanceof Ex) ' + encodeVar(param) + ' = ' + encodeVar(param) + '->value;\n');
      results.push(gen.Body(catchClause.body, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'ThrowStatement': function(node, opts) {
      return 'throw new Ex(' + generate(node.argument, opts) + ');\n';
    },

    'FunctionExpression': function(node, opts) {
      var results = ['new Func('];
      if (node.id) {
        results.push(encodeString(node.id.name) + ', ');
      }
      var params = node.params.map(function(param) {
        return encodeVar(param) + ' = null';
      });
      params.unshift('$arguments');
      params.unshift('$this_');
      var scopeIndex = node.scopeIndex || Object.create(null);
      var functionName = node.id ? node.id.name : '';
      if (scopeIndex.unresolved[functionName]) {
        delete scopeIndex.unresolved[functionName];
      }
      var unresolvedRefs = Object.keys(scopeIndex.unresolved);
      var useClause = unresolvedRefs.length ? 'use (&' + unresolvedRefs.map(encodeVarName).join(', &') + ') ' : '';
      results.push('function(' + params.join(', ') + ') ' + useClause + '{\n');
      if (scopeIndex.referenced[functionName]) {
        results.push(indent(opts.indentLevel + 1) + encodeVarName(functionName) + ' = $arguments->callee;\n');
      }
      results.push(gen.Body(node.body, opts));
      results.push(indent(opts.indentLevel) + '})');
      return results.join('');
    },

    'ArrayExpression': function(node, opts) {
      var items = node.elements.map(function(el) {
        return generate(el, opts);
      });
      return 'new Arr(' + items.join(', ') + ')';
    },

    'ObjectExpression': function(node, opts) {
      var items = [];
      node.properties.forEach(function(node) {
        var key = node.key;
        //key can be a literal or an identifier (quoted or not)
        var keyName = (key.type === 'Identifier') ? key.name : String(key.value);
        items.push(encodeString(keyName));
        items.push(generate(node.value, opts));
      });
      return 'new Object(' + items.join(', ') + ')';
    },

    'CallExpression': function(node, opts) {
      var args = node.arguments.map(function(arg) {
        return generate(arg, opts);
      });
      if (node.callee.type === 'MemberExpression') {
        return 'call_method(' + generate(node.callee.object, opts) + ', ' + encodeProp(node.callee) + (args.length ? ', ' + args.join(', ') : '') + ')';
      } else {
        return 'call(' + generate(node.callee, opts) + (args.length ? ', ' + args.join(', ') : '') + ')';
      }
    },

    'MemberExpression': function(node, opts) {
      return 'get(' + generate(node.object, opts) + ', ' + encodeProp(node) + ')';
    },

    'NewExpression': function(node, opts) {
      var args = node.arguments.map(function(arg) {
        return generate(arg, opts);
      });
      return 'x_new(' + generate(node.callee, opts) + (args.length ? ', ' + args.join(', ') : '') + ')';
    },

    'AssignmentExpression': function(node, opts) {
      if (node.left.type === 'MemberExpression') {
        //`a.b = 1` -> `set(a, "b", 1)` but `a.b += 1` -> `set(a, "b", 1, "+=")`
        if (node.operator === '=') {
          return 'set(' + generate(node.left.object, opts) + ', ' + encodeProp(node.left) + ', ' + generate(node.right, opts) + ')';
        } else {
          return 'set(' + generate(node.left.object, opts) + ', ' + encodeProp(node.left) + ', ' + generate(node.right, opts) + ', "' + node.operator + '")';
        }
      }
      if (node.left.name in GLOBALS) {
        var scope = utils.getParentScope(node);
        if (scope.type === 'Program') {
          node.left.appendSuffix = '_';
        }
      }
      return encodeVar(node.left) + ' ' + node.operator + ' ' + generate(node.right, opts);
    },

    'UpdateExpression': function(node, opts) {
      if (node.argument.type === 'MemberExpression') {
        //convert `++a` to `a += 1`
        var operator = (node.operator === '++') ? '+=' : '-=';
        // ++i returns the new (updated) value; i++ returns the old value
        var returnOld = node.prefix ? false : true;
        return 'set(' + generate(node.argument.object, opts) + ', ' + encodeProp(node.argument) + ', 1, "' + operator + '", ' + returnOld + ')';
      }
      //todo: [hacky] this works only work on numbers
      if (node.prefix) {
        return node.operator + generate(node.argument, opts);
      } else {
        return generate(node.argument, opts) + node.operator;
      }
    },

    'LogicalExpression': function(node, opts) {
      return gen.BinaryExpression(node, opts);
    },

    'BinaryExpression': function(node, opts) {
      var op = node.operator;
      var name = 'b:' + op;
      if (name in OPERATOR_MAP) {
        op = OPERATOR_MAP[name];
      }
      if (op.match(/^[a-z_]+$/)) {
        return 'x_' + op + '(' + generate(node.left, opts) + ', ' + generate(node.right, opts) + ')';
      }
      var parentType = node.parent && node.parent.type;
      var result = generate(node.left, opts) + ' ' + op + ' ' + generate(node.right, opts);
      if (parentType === 'BinaryExpression' || parentType === 'LogicalExpression') {
        return '(' + result + ')';
      }
      return result;
    },

    'UnaryExpression': function(node, opts) {
      var op = node.operator;
      var name = 'u:' + op;
      if (name in OPERATOR_MAP) {
        op = OPERATOR_MAP[name];
      }
      //special case here because -1 is actually a number literal, not negate(1)
      if (op === 'negate' && node.argument.type === 'Literal' && typeof node.argument.value === 'number') {
        return '-' + encodeLiteral(node.argument.value);
      }
      //special case here because `delete a.b.c` needs to compute a.b and then delete c
      if (op === 'delete' && node.argument.type === 'MemberExpression') {
        return 'x_delete(' + generate(node.argument.object, opts) + ', ' + encodeProp(node.argument) + ')';
      }
      if (op.match(/^[a-z_]+$/)) {
        return 'x_' + op + '(' + generate(node.argument, opts) + ')';
      }
      return op + generate(node.argument, opts);
    },

    'SequenceExpression': function(node, opts) {
      var expressions = node.expressions.map(function(node) {
        return generate(node, opts);
      });
      //allow sequence expression only in the init of a for loop
      if (node.parent.type === 'ForStatement' && node.parent.init === node) {
        return expressions.join(', ');
      } else {
        return 'x_seq(' + expressions.join(', ') + ')';
      }
    }
  };

  function generate(node, opts) {
    opts = opts || {};
    if (opts.indentLevel == null) {
      opts.indentLevel = -1;
    }
    //we might get a null call `for (; i < l; i++) { ... }`
    if (node == null) {
      return '';
    }
    var type = node.type;
    var result;
    switch (type) {
      //STATEMENTS
      case 'Program':
        result = gen.Body(node, opts);
        break;
      case 'ExpressionStatement':
        result = generate(node.expression, opts) + ';\n';
        break;
      case 'ReturnStatement':
        result = 'return ' + generate(node.argument) + ';\n';
        break;
      case 'ContinueStatement':
        result = 'continue;\n';
        break;
      case 'BreakStatement':
        result = 'break;\n';
        break;
      case 'EmptyStatement':
      case 'DebuggerStatement':
      //this is handled at beginning of parent scope
      case 'FunctionDeclaration':
        result = '';
        break;
      case 'VariableDeclaration':
      case 'IfStatement':
      case 'SwitchStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'BlockStatement':
      case 'TryStatement':
      case 'ThrowStatement':
        result = gen[type](node, opts);
        break;
      //these should never be encountered here because they are handled elsewhere
      case 'SwitchCase':
      case 'CatchClause':
        throw new Error('should never encounter: "' + type + '"');
        break;
      //these are not implemented (some are es6, some are irrelevant)
      case 'DirectiveStatement':
      case 'ForOfStatement':
      case 'LabeledStatement':
      case 'WithStatement':
        throw new Error('unsupported: "' + type + '"');
        break;

      //EXPRESSIONS
      case 'Literal':
        result = encodeLiteral(node.value, opts);
        break;
      case 'Identifier':
        result = encodeVar(node);
        break;
      case 'ThisExpression':
        result = '$this_';
        break;
      case 'FunctionExpression':
      case 'AssignmentExpression':
      case 'CallExpression':
      case 'MemberExpression':
      case 'NewExpression':
      case 'ArrayExpression':
      case 'ObjectExpression':
      case 'UnaryExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'SequenceExpression':
      case 'UpdateExpression':
      case 'ConditionalExpression':
        result = gen[type](node, opts);
        break;
      //these are not implemented (es6?)
      case 'ArrayPattern':
      case 'ObjectPattern':
      case 'Property':
        throw new Error('unsupported: "' + type + '"');
        break;

      default:
        throw new Error('unknown node type: "' + type + '"');
    }

    return result;
  }


  function encodeLiteral(value) {
    var type = (value === null) ? 'null' : typeof value;
    if (type === 'undefined') {
      return 'null';
    }
    if (type === 'null') {
      return 'Null::$null';
    }
    if (type === 'string') {
      return encodeString(value);
    }
    if (type === 'boolean') {
      return value.toString();
    }
    if (type === 'number') {
      value = value.toString();
      return (~value.indexOf('.') || ~value.indexOf('e')) ? value : value + '.0';
    }
    if (toString.call(value) === '[object RegExp]') {
      return encodeRegExp(value);
    }
    throw new Error('No handler for literal of type: ' + type + ': ' + util.inspect(value));
  }

  function encodeRegExp(value) {
    var flags = '';
    if (value.global) flags += 'g';
    if (value.ignoreCase) flags += 'i';
    if (value.multiline) flags += 'm';
    //normalize source to ensure no forward slashes are "escaped"
    var source = value.source.replace(/\\./g, function(s) {
      return (s === '\\/') ? '/' : s;
    });
    return 'new RegExp(' + encodeString(source) + ', ' + encodeString(flags) + ')';
  }

  function encodeString(string) {
    return utils.toPHPString(string);
  }

  function encodeProp(node) {
    if (node.computed) {
      //a[0] or a[b] or a[b + 1]
      return generate(node.property);
    } else {
      //a.b
      return encodeLiteral(node.property.name);
    }
  }

  function encodeVar(identifier) {
    var name = identifier.name;
    if (identifier.appendSuffix) {
      name += identifier.appendSuffix;
    } else {
      name = name.replace(/_$/, '__');
    }
    return '$' + name.replace(/[^a-z0-9_]/ig, encodeVarChar);
  }

  function encodeVarName(name) {
    return '$' + name.replace(/_$/, '__').replace(/[^a-z0-9_]/ig, encodeVarChar);
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

  function indent(count) {
    return repeat('  ', count);
  }

  function repeat(str, count) {
    return new Array(count + 1).join(str);
  }

  exports.generate = generate;
})();