(function() {
  var util = require('util');

  var OPERATOR_MAP = {
    '+': 'plus',
    '&&': 'and',
    '||': 'or'
  };

  function genBody(node, opts) {
    var results = [];
    opts.indentLevel += 1;
    node.body.forEach(function(node) {
      results.push(repeat('  ', opts.indentLevel) + generate(node, opts));
    });
    if (opts.indentLevel > 0) {
      opts.indentLevel -= 1;
    }
    return results.join('');
  }

  function genVariableDeclaration(node, opts) {
    var results = [];
    node.declarations.forEach(function(node) {
      results.push(encodeVar(node.id.name) + ' = null;')
    });
    return results.join(' ') + '\n';
  }

  function genIfStatement(node, opts) {
    var results = ['if ('];
    results.push(generate(node.test, opts));
    results.push(') {\n');
    results.push(genBody(node.consequent, opts));
    results.push(repeat('  ', opts.indentLevel) + '}');
    if (node.alternate) {
      results.push(' else ');
      if (node.alternate.type === 'BlockStatement') {
        results.push('{\n');
        results.push(genBody(node.alternate, opts));
        results.push(repeat('  ', opts.indentLevel) + '}\n');
      } else {
        results.push(generate(node.alternate, opts));
      }
    }
    return results.join('') + '\n';
  }

  function genForStatement(node, opts) {
    var results = ['for ('];
    results.push(generate(node.init, opts) + '; ');
    results.push(generate(node.test, opts) + '; ');
    results.push(generate(node.update, opts));
    results.push(') {\n');
    results.push(genBody(node.body, opts));
    results.push(repeat('  ', opts.indentLevel) + '}');
    return results.join('') + '\n';
  }

  function genFuncExp(node, opts) {
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
    results.push(genBody(node.body, opts));
    results.push(repeat('  ', opts.indentLevel) + '})');
    return results.join('');
  }

  function genArrayExpression(node, opts) {
    var items = node.elements.map(function(el) {
      return generate(el, opts);
    });
    return 'new Arr(' + items.join(', ') + ')';
  }

  function genObjectExpression(node, opts) {
    var items = [];
    node.properties.forEach(function(node) {
      items.push(encodeString(node.key.name));
      items.push(generate(node.value, opts));
    });
    return 'new Object(' + items.join(', ') + ')';
  }

  function genCallExpression(node, opts) {
    var args = node.arguments.map(function(arg) {
      return generate(arg, opts);
    });
    if (node.callee.type === 'MemberExpression') {
      return 'call_method(' + generate(node.callee.object, opts) + ', ' + encodeProp(node.callee) + (args.length ? ', ' + args.join(', ') : '') + ')';
    } else {
      return 'call(' + generate(node.callee, opts) + (args.length ? ', ' + args.join(', ') : '') + ')';
    }
  }

  function genMemberExpression(node, opts) {
    return 'get(' + generate(node.object, opts) + ', ' + encodeProp(node) + ')';
  }

  function genNewExpression(node, opts) {
    var args = node.arguments.map(function(arg) {
      return generate(arg, opts);
    });
    return 'js_new(' + generate(node.callee, opts) + (args.length ? ', ' + args.join(', ') : '') + ')';
  }

  function genAssignmentExpression(node, opts) {
    if (node.left.type === 'MemberExpression') {
      return 'set(' + generate(node.left.object, opts) + ', ' + encodeProp(node.left) + ', ' + generate(node.right, opts) + ')';
    }
    return encodeVar(node.left.name) + ' ' + node.operator + ' ' + generate(node.right, opts);
  }

  function genBinaryExpression(node, opts) {
    var op = node.operator;
    if (op in OPERATOR_MAP) {
      op = OPERATOR_MAP[op];
    }
    if (op.match(/^[a-z]+$/)) {
      return 'js_' + op + '(' + generate(node.left, opts) + ', ' + generate(node.right, opts) + ')';
    }
    return generate(node.left, opts) + ' ' + op + ' ' + generate(node.right, opts);
  }

  function genSequenceExpression(node, opts) {
    var expressions = node.expressions.map(function(node) {
      return generate(node, opts);
    });
    return expressions.join(', ');
  }

  function genUpdateExpression(node, opts) {
    if (node.prefix) {
      return node.operator + generate(node.argument, opts);
    } else {
      return generate(node.argument, opts) + node.operator;
    }
  }


  function generate(node, opts) {
    opts = opts || {};
    if (opts.indentLevel == null) {
      opts.indentLevel = -1;
    }
    var result;
    switch (node.type) {
      //STATEMENTS
      case 'BlockStatement':
      case 'BreakStatement':
      case 'CatchClause':
      case 'ContinueStatement':
      case 'DirectiveStatement':
      case 'DoWhileStatement':
      case 'DebuggerStatement':
      case 'EmptyStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'FunctionDeclaration':
      case 'LabeledStatement':
      case 'ReturnStatement':
      case 'SwitchStatement':
      case 'SwitchCase':
      case 'ThrowStatement':
      case 'TryStatement':
      case 'WhileStatement':
      case 'WithStatement':
        result = 'unsupported("' + node.type + '");\n';
        break;
      case 'Program':
        result = genBody(node, opts);
        break;
      case 'ExpressionStatement':
        result = generate(node.expression, opts) + ';\n';
        break;
      case 'VariableDeclaration':
        result = genVariableDeclaration(node, opts);
        break;
      case 'IfStatement':
        result = genIfStatement(node, opts);
        break;
      case 'ForStatement':
        result = genForStatement(node, opts);
        break;

      //EXPRESSIONS
      case 'FunctionExpression':
        result = genFuncExp(node, opts);
        break;
      case 'AssignmentExpression':
        result = genAssignmentExpression(node, opts);
        break;
      case 'Literal':
        result = encodeLiteral(node.value, opts);
        break;
      case 'CallExpression':
        result = genCallExpression(node, opts);
        break;
      case 'Identifier':
        result = encodeVar(node.name);
        break;
      case 'MemberExpression':
        result = genMemberExpression(node, opts);
        break;
      case 'NewExpression':
        result = genNewExpression(node, opts);
        break;
      case 'ThisExpression':
        result = '$this_';
        break;
      case 'ArrayExpression':
        result = genArrayExpression(node, opts);
        break;
      case 'ObjectExpression':
        result = genObjectExpression(node, opts);
        break;
      case 'BinaryExpression':
        result = genBinaryExpression(node, opts);
        break;
      case 'SequenceExpression':
        result = genSequenceExpression(node, opts);
        break;
      case 'UpdateExpression':
        result = genUpdateExpression(node, opts);
        break;
      case 'ArrayPattern':
      case 'ConditionalExpression':
      case 'LogicalExpression':
      case 'ObjectPattern':
      case 'Property':
      case 'UnaryExpression':
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
      return ~value.indexOf('.') ? value : value + '.';
    }
    throw new Error('No handler for literal of type: ' + util.inspect(value));
  }

  function encodeString(str) {
    return JSON.stringify(str).replace(/\$/g, '\\$');
  }

  function encodeProp(node) {
    return (node.computed) ? encodeVar(node.property.name) : encodeLiteral(node.property.name);
  }

  function encodeVar(name) {
    return '$' + name.replace(/_$/, '__').replace(/[^a-z0-9_]/ig, encodeVarChar);
  }

  function encodeVarChar(ch) {
    var hex = ch.charCodeAt(0).toString(16);
    hex = ('0' + hex).slice(-2);
    return '«' + hex + '»';
  }

  function repeat(str, count) {
    return new Array(count + 1).join(str);
  }

  exports.generate = generate;
})();