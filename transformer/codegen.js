(function() {
  var util = require('util');

  var OPERATOR_MAP = {
    //unary operators
    'u:+': 'unary_plus',
    'u:-': 'unary_negate',
    'u:~': 'bitwise_not',
    //binary operators
    'b:+': 'plus',
    'b:&&': 'and',
    'b:||': 'or',
    'b:&': 'bitwise_and',
    'b:|': 'bitwise_or',
    'b:^': 'bitwise_xor',
    'b:<<': 'bitwise_ls', //Left shift
    'b:>>': 'bitwise_sprs', //Sign-propagating right shift
    'b:>>>': 'bitwise_zfrs' //Zero-fill right shift
  };

  var gen = {
    'Body': function(node, opts) {
      var results = [];
      opts.indentLevel += 1;
      node.body.forEach(function(node) {
        results.push(indent(opts.indentLevel) + generate(node, opts));
      });
      if (opts.indentLevel > 0) {
        opts.indentLevel -= 1;
      }
      return results.join('');
    },

    'VariableDeclaration': function(node, opts) {
      var results = [];
      node.declarations.forEach(function(node) {
        results.push(encodeVar(node.id.name) + ' = null;');
      });
      return results.join(' ') + '\n';
    },

    'IfStatement': function(node, opts) {
      var results = ['if ('];
      results.push(generate(node.test, opts));
      results.push(') {\n');
      results.push(gen.Body(node.consequent, opts));
      results.push(indent(opts.indentLevel) + '}');
      if (node.alternate) {
        results.push(' else ');
        if (node.alternate.type === 'BlockStatement') {
          results.push('{\n');
          results.push(gen.Body(node.alternate, opts));
          results.push(indent(opts.indentLevel) + '}\n');
        } else {
          results.push(generate(node.alternate, opts));
        }
      }
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
      results.push(gen.Body(node.body, opts));
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
      results.push(generate(node.right, opts) + ') as $i_ => ' + encodeVar(identifier.name) + ') {\n');
      results.push(gen.Body(node.body, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'WhileStatement': function(node, opts) {
      var results = ['while ('];
      results.push(generate(node.test, opts));
      results.push(') {\n');
      results.push(gen.Body(node.body, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'BlockStatement': function(node, opts) {
      var results = ['{\n'];
      results.push(gen.Body(node, opts));
      results.push(indent(opts.indentLevel) + '}');
      return results.join('') + '\n';
    },

    'FunctionExpression': function(node, opts) {
      var results = ['new Func('];
      if (node.id) {
        results.push(encodeString(node.id.name) + ', ');
      }
      var params = node.params.map(function(param) {
        return encodeVar(param.name);
      });
      params.unshift('$arguments');
      params.unshift('$this_');
      var lexicalVars = '';
      if (node.body.startToken.prev.type === 'BlockComment') {
        var value = node.body.startToken.prev.value;
        if (value.match(/^\[use:(.+?)\]$/)) {
          var vars = value.slice(5, -1).split(', ');
          lexicalVars = 'use (&' + vars.map(encodeVar).join(', &') + ') ';
        }
      }
      results.push('function(' + params.join(', ') + ') ' + lexicalVars + '{\n');
      if (node.id) {
        results.push(indent(opts.indentLevel + 1) + encodeVar(node.id.name) + ' = $arguments->callee;\n');
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
      node.properties.forEach(function(nod) {
        var key = nod.key;
        //key can be a literal or an identifier (quoted or not)
        var keyName = (key.type === 'Identifier') ? key.name : key.value;
        items.push(encodeString(keyName));
        items.push(generate(nod.value, opts));
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
      return 'js_new(' + generate(node.callee, opts) + (args.length ? ', ' + args.join(', ') : '') + ')';
    },

    'AssignmentExpression': function(node, opts) {
      if (node.left.type === 'MemberExpression') {
        return 'set(' + generate(node.left.object, opts) + ', ' + encodeProp(node.left) + ', ' + generate(node.right, opts) + ')';
      }
      return encodeVar(node.left.name) + ' ' + node.operator + ' ' + generate(node.right, opts);
    },

    'BinaryExpression': function(node, opts) {
      var op = node.operator;
      var name = 'b:' + op;
      if (name in OPERATOR_MAP) {
        op = OPERATOR_MAP[name];
      }
      if (op.match(/^[a-z_]+$/)) {
        return 'js_' + op + '(' + generate(node.left, opts) + ', ' + generate(node.right, opts) + ')';
      }
      return generate(node.left, opts) + ' ' + op + ' ' + generate(node.right, opts);
    },

    'UnaryExpression': function(node, opts) {
      var op = node.operator;
      var name = 'u:' + op;
      if (name in OPERATOR_MAP) {
        op = OPERATOR_MAP[name];
      }
      //special case here because `delete a.b.c` needs to compute a.b and then delete c
      if (op === 'delete' && node.argument.type === 'MemberExpression') {
        return 'js_delete(' + generate(node.argument.object, opts) + ', ' + encodeProp(node.argument) + ')';
      }
      if (op.match(/^[a-z_]+$/)) {
        return 'js_' + op + '(' + generate(node.argument, opts) + ')';
      }
      return op + generate(node.argument, opts);
    },

    'SequenceExpression': function(node, opts) {
      var expressions = node.expressions.map(function(node) {
        return generate(node, opts);
      });
      return expressions.join(', ');
    },

    'UpdateExpression': function(node, opts) {
      if (node.prefix) {
        return node.operator + generate(node.argument, opts);
      } else {
        return generate(node.argument, opts) + node.operator;
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
      case 'EmptyStatement':
        result = '';
        break;
      case 'VariableDeclaration':
      case 'IfStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'WhileStatement':
      case 'BlockStatement':
        result = gen[type](node, opts);
        break;
      case 'BreakStatement':
      case 'CatchClause':
      case 'ContinueStatement':
      case 'DirectiveStatement':
      case 'DoWhileStatement':
      case 'DebuggerStatement':
      case 'ForOfStatement':
      case 'FunctionDeclaration':
      case 'LabeledStatement':
      case 'SwitchStatement':
      case 'SwitchCase':
      case 'ThrowStatement':
      case 'TryStatement':
      case 'WithStatement':
        result = 'unsupported("' + node.type + '");\n';
        break;

      //EXPRESSIONS
      case 'Literal':
        result = encodeLiteral(node.value, opts);
        break;
      case 'Identifier':
        result = encodeVar(node.name);
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
      case 'SequenceExpression':
      case 'UpdateExpression':
      case 'ConditionalExpression':
        result = gen[type](node, opts);
        break;
      case 'ArrayPattern':
      case 'LogicalExpression':
      case 'ObjectPattern':
      case 'Property':
        result = 'unsupported("' + node.type + '")';
        break;

      default:
        throw new Error('Unknown node type: ' + node.type);
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
      //todo: 1e2
      return ~value.indexOf('.') ? value : value + '.0';
    }
    throw new Error('No handler for literal of type: ' + util.inspect(value));
  }

  function encodeString(str) {
    //JSON.stringify(undefined) === undefined
    str = JSON.stringify(str) || '';
    return str.replace(/\$/g, '\\$');
  }

  function encodeProp(node) {
    if (node.computed) {
      //a[0] or a[b]
      return (node.property.type === 'Literal') ? encodeLiteral(node.property.value) : encodeVar(node.property.name);
    } else {
      //a.b
      return encodeLiteral(node.property.name);
    }
  }

  function encodeVar(name) {
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