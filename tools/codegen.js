(function() {
  var util = require('util');
  var utils = require('./utils');

  var toString = Object.prototype.toString;

  var OPERATOR_MAP = {
    //unary operators
    'u:-': 'negate',
    //'u:+': 'unary_plus',
    //'u:~': 'bitwise_not',

    //binary operators
    'b:+': 'plus',
    //'b:&': 'bitwise_and',
    //'b:|': 'bitwise_or',
    //'b:^': 'bitwise_xor',
    //'b:<<': 'bitwise_ls', //left shift
    //'b:>>': 'bitwise_sprs', //sign-propagating right shift
    'b:>>>': 'bitwise_zfrs' //zero-fill right shift
  };

  //built-in globals (should not be re-assigned)
  var GLOBALS = {Array: 1, Boolean: 1, Buffer: 1, Date: 1, Error: 1, RangeError: 1, ReferenceError: 1, SyntaxError: 1, TypeError: 1, Function: 1, Infinity: 1, JSON: 1, Math: 1, NaN: 1, Number: 1, Object: 1, RegExp: 1, String: 1, console: 1, decodeURI: 1, decodeURIComponent: 1, encodeURI: 1, encodeURIComponent: 1, escape: 1, eval: 1, isFinite: 1, isNaN: 1, parseFloat: 1, parseInt: 1, undefined: 1, unescape: 1};

  function Generator(opts) {
    this.opts = Object.create(opts || {});
  }

  Generator.prototype = {
    //accepts a BlockStatement or an ExpressionStatement (turns to block)
    // assumes the `{}` have already been generated
    toBlock: function(node) {
      var opts = this.opts;
      if (node.type === 'BlockStatement') {
        return this.Body(node);
      }
      opts.indentLevel += 1;
      var result = this.generate(node);
      if (result) {
        result = this.indent() + result;
      }
      opts.indentLevel -= 1;
      return result;
    },

    //generate function or program body
    // assumes the `{}` have already been written
    Body: function(node) {
      var opts = this.opts;
      var scopeIndex = node.scopeIndex || Object.create(null);
      var results = [];
      opts.indentLevel += 1;
      if (node.type === 'Program' && scopeIndex.thisFound) {
        results.push(this.indent() + '$this_ = $global;\n');
      }
      if (node.vars && opts.initVars) {
        var declarations = [];
        Object.keys(node.vars).forEach(function(name) {
          declarations.push(encodeVarName(name) + ' = null;');
        });
        if (declarations.length) {
          results.push(this.indent() + declarations.join(' ') + '\n');
        }
      }
      var funcDeclarations = node.funcs;
      if (funcDeclarations) {
        Object.keys(funcDeclarations).forEach(function(name) {
          var func = this.FunctionExpression(funcDeclarations[name]);
          results.push(this.indent() + encodeVarName(name) + ' = ' + func + ';\n');
        }, this);
      }

      node.body.forEach(function(node) {
        var result = this.generate(node);
        if (result) {
          results.push(this.indent() + result);
        }
      }, this);
      if (opts.indentLevel > 0) {
        opts.indentLevel -= 1;
      }
      return results.join('');
    },

    BlockStatement: function(node) {
      var results = ['{\n'];
      results.push(this.Body(node));
      results.push(this.indent() + '}');
      return results.join('') + '\n';
    },

    VariableDeclaration: function(node) {
      var results = [];
      node.declarations.forEach(function(node) {
        if (node.init) {
          results.push(encodeVar(node.id) + ' = ' + this.generate(node.init));
        }
      }, this);
      if (!results.length) {
        return '';
      }
      if (node.parent.type === 'ForStatement') {
        return results.join(', ');
      }
      return results.join('; ') + ';\n';
    },

    IfStatement: function(node) {
      var results = ['if (is('];
      results.push(this.generate(node.test));
      results.push(')) {\n');
      results.push(this.toBlock(node.consequent));
      results.push(this.indent() + '}');
      if (node.alternate) {
        results.push(' else ');
        if (node.alternate.type === 'IfStatement') {
          results.push(this.generate(node.alternate));
        } else {
          results.push('{\n');
          results.push(this.toBlock(node.alternate));
          results.push(this.indent() + '}\n');
        }
      }
      return results.join('') + '\n';
    },

    SwitchStatement: function(node) {
      var opts = this.opts;
      var results = ['switch ('];
      results.push(this.generate(node.discriminant));
      results.push(') {\n');
      opts.indentLevel += 1;
      node.cases.forEach(function(node) {
        results.push(this.indent());
        if (node.test === null) {
          results.push('default:\n');
        } else {
          results.push('case ' + this.generate(node.test) + ':\n');
        }
        opts.indentLevel += 1;
        node.consequent.forEach(function(node) {
          results.push(this.indent() + this.generate(node));
        }, this);
        opts.indentLevel -= 1;
      }, this);
      opts.indentLevel -= 1;
      results.push(this.indent() + '}');
      return results.join('') + '\n';
    },

    ConditionalExpression: function(node) {
      return 'is(' + this.generate(node.test) + ') ? ' + this.generate(node.consequent) + ' : ' + this.generate(node.alternate);
    },

    ForStatement: function(node) {
      var results = ['for ('];
      results.push(this.generate(node.init) + '; ');
      results.push('is(' + this.generate(node.test) + '); ');
      results.push(this.generate(node.update));
      results.push(') {\n');
      results.push(this.toBlock(node.body));
      results.push(this.indent() + '}');
      return results.join('') + '\n';
    },

    ForInStatement: function(node) {
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
      results.push(this.generate(node.right) + ') as ' + encodeVar(identifier) + ') {\n');
      results.push(this.toBlock(node.body));
      results.push(this.indent() + '}');
      return results.join('') + '\n';
    },

    WhileStatement: function(node) {
      var results = ['while (is('];
      results.push(this.generate(node.test));
      results.push(')) {\n');
      results.push(this.toBlock(node.body));
      results.push(this.indent() + '}');
      return results.join('') + '\n';
    },

    DoWhileStatement: function(node) {
      var results = ['do {\n'];
      results.push(this.toBlock(node.body));
      results.push(this.indent() + '} while (is(' + this.generate(node.test) + '));');
      return results.join('') + '\n';
    },

    TryStatement: function(node) {
      var catchClause = node.handlers[0];
      var param = catchClause.param;
      var results = ['try {\n'];
      results.push(this.Body(node.block));
      results.push(this.indent() + '} catch(Exception ' + encodeVar(param) + ') {\n');
      results.push(this.indent(1) + 'if (' + encodeVar(param) + ' instanceof Ex) ' + encodeVar(param) + ' = ' + encodeVar(param) + '->value;\n');
      results.push(this.Body(catchClause.body));
      results.push(this.indent() + '}');
      return results.join('') + '\n';
    },

    ThrowStatement: function(node) {
      return 'throw new Ex(' + this.generate(node.argument) + ');\n';
    },

    FunctionExpression: function(node) {
      var meta = [];
      var opts = this.opts;
      var parentIsStrict = opts.isStrict;
      opts.isStrict = parentIsStrict || isStrictDirective(node.body.body[0]);
      if (opts.isStrict) {
        meta.push('"strict" => true');
      }
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
        results.push(this.indent(1) + encodeVarName(functionName) + ' = $arguments->callee;\n');
      }
      results.push(this.Body(node.body));
      results.push(this.indent() + '}');
      if (meta.length) {
        results.push(', array(' + meta.join(', ') + ')');
      }
      results.push(')');
      opts.isStrict = parentIsStrict;
      return results.join('');
    },

    ArrayExpression: function(node) {
      var items = node.elements.map(function(el) {
        return (el === null) ? 'Arr::$empty' : this.generate(el);
      }, this);
      return 'new Arr(' + items.join(', ') + ')';
    },

    ObjectExpression: function(node) {
      var items = [];
      node.properties.forEach(function(node) {
        var key = node.key;
        //key can be a literal or an identifier (quoted or not)
        var keyName = (key.type === 'Identifier') ? key.name : String(key.value);
        items.push(encodeString(keyName));
        items.push(this.generate(node.value));
      }, this);
      return 'new Object(' + items.join(', ') + ')';
    },

    CallExpression: function(node) {
      var args = node.arguments.map(function(arg) {
        return this.generate(arg);
      }, this);
      if (node.callee.type === 'MemberExpression') {
        return 'call_method(' + this.generate(node.callee.object) + ', ' + this.encodeProp(node.callee) + (args.length ? ', ' + args.join(', ') : '') + ')';
      } else {
        return 'call(' + this.generate(node.callee) + (args.length ? ', ' + args.join(', ') : '') + ')';
      }
    },

    MemberExpression: function(node) {
      return 'get(' + this.generate(node.object) + ', ' + this.encodeProp(node) + ')';
    },

    NewExpression: function(node) {
      var args = node.arguments.map(function(arg) {
        return this.generate(arg);
      }, this);
      return 'x_new(' + this.generate(node.callee) + (args.length ? ', ' + args.join(', ') : '') + ')';
    },

    AssignmentExpression: function(node) {
      if (node.left.type === 'MemberExpression') {
        //`a.b = 1` -> `set(a, "b", 1)` but `a.b += 1` -> `set(a, "b", 1, "+=")`
        if (node.operator === '=') {
          return 'set(' + this.generate(node.left.object) + ', ' + this.encodeProp(node.left) + ', ' + this.generate(node.right) + ')';
        } else {
          return 'set(' + this.generate(node.left.object) + ', ' + this.encodeProp(node.left) + ', ' + this.generate(node.right) + ', "' + node.operator + '")';
        }
      }
      if (node.left.name in GLOBALS) {
        var scope = utils.getParentScope(node);
        if (scope.type === 'Program') {
          node.left.appendSuffix = '_';
        }
      }
      return encodeVar(node.left) + ' ' + node.operator + ' ' + this.generate(node.right);
    },

    UpdateExpression: function(node) {
      if (node.argument.type === 'MemberExpression') {
        //convert `++a` to `a += 1`
        var operator = (node.operator === '++') ? '+=' : '-=';
        // ++i returns the new (updated) value; i++ returns the old value
        var returnOld = node.prefix ? false : true;
        return 'set(' + this.generate(node.argument.object) + ', ' + this.encodeProp(node.argument) + ', 1, "' + operator + '", ' + returnOld + ')';
      }
      //todo: [hacky] this works only work on numbers
      if (node.prefix) {
        return node.operator + this.generate(node.argument);
      } else {
        return this.generate(node.argument) + node.operator;
      }
    },

    LogicalExpression: function(node) {
      return this.BinaryExpression(node);
    },

    genAnd: function(node) {
      var opts = this.opts;
      opts.andDepth = (opts.andDepth == null) ? 0 : opts.andDepth + 1;
      var name = (opts.andDepth === 0) ? '$and_' : '$and' + opts.andDepth + '_';
      var result = '(is(' + name + ' = ' + this.generate(node.left) + ') ? ' + this.generate(node.right) + ' : ' + name + ')';
      opts.andDepth = (opts.andDepth === 0) ? null : opts.andDepth - 1;
      return result;
    },

    genOr: function(node) {
      var opts = this.opts;
      opts.orDepth = (opts.orDepth == null) ? 0 : opts.orDepth + 1;
      var name = (opts.orDepth === 0) ? '$or_' : '$or' + opts.orDepth + '_';
      var result = '(is(' + name + ' = ' + this.generate(node.left) + ') ? ' + name + ' : ' + this.generate(node.right) + ')';
      opts.orDepth = (opts.orDepth === 0) ? null : opts.orDepth - 1;
      return result;
    },

    BinaryExpression: function(node) {
      var op = node.operator;
      if (op === '&&') {
        return this.genAnd(node);
      }
      if (op === '||') {
        return this.genOr(node);
      }
      if (op === '+') {
        var terms = node.terms.map(this.generate, this);
        if (node.isConcat) {
          return 'x_concat(' + terms.join(', ') + ')';
        } else {
          return 'x_plus(' + terms.join(', ') + ')';
        }
      }
      var name = 'b:' + op;
      if (name in OPERATOR_MAP) {
        op = OPERATOR_MAP[name];
      }
      if (op.match(/^[a-z_]+$/)) {
        return 'x_' + op + '(' + this.generate(node.left) + ', ' + this.generate(node.right) + ')';
      }
      var parentType = node.parent && node.parent.type;
      var result = this.generate(node.left) + ' ' + op + ' ' + this.generate(node.right);
      if (parentType === 'BinaryExpression' || parentType === 'LogicalExpression') {
        return '(' + result + ')';
      }
      return result;
    },

    UnaryExpression: function(node) {
      var op = node.operator;
      if (op === '!') {
        return 'not(' + this.generate(node.argument) + ')';
      }
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
        return 'x_delete(' + this.generate(node.argument.object) + ', ' + this.encodeProp(node.argument) + ')';
      }
      if (op.match(/^[a-z_]+$/)) {
        return 'x_' + op + '(' + this.generate(node.argument) + ')';
      }
      return op + this.generate(node.argument);
    },

    SequenceExpression: function(node) {
      var expressions = node.expressions.map(function(node) {
        return this.generate(node);
      }, this);
      //allow sequence expression only in the init of a for loop
      if (node.parent.type === 'ForStatement' && node.parent.init === node) {
        return expressions.join(', ');
      } else {
        return 'x_seq(' + expressions.join(', ') + ')';
      }
    },

    generate: function(node) {
      var opts = this.opts;
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
          opts.isStrict = isStrictDirective(node.body[0]);
          result = this.Body(node);
          break;
        case 'ExpressionStatement':
          result = isStrictDirective(node) ? '' : this.generate(node.expression) + ';\n';
          break;
        case 'ReturnStatement':
          result = 'return ' + this.generate(node.argument) + ';\n';
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
          result = this[type](node);
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
          result = encodeLiteral(node.value);
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
          result = this[type](node);
          break;
        //these are not implemented (es6)
        case 'ArrayPattern':
        case 'ObjectPattern':
        case 'Property':
          throw new Error('unsupported: "' + type + '"');
          break;

        default:
          throw new Error('unknown node type: "' + type + '"');
      }

      return result;
    },

    encodeProp: function(node) {
      if (node.computed) {
        //a[0] or a[b] or a[b + 1]
        return this.generate(node.property);
      } else {
        //a.b
        return encodeLiteral(node.property.name);
      }
    },

    indent: function(count) {
      var indentLevel = this.opts.indentLevel + (count || 0);
      return repeat('  ', indentLevel);
    }
  };


  function isStrictDirective(stmt) {
    if (stmt && stmt.type === 'ExpressionStatement') {
      var expr = stmt.expression;
      if (expr.type === 'Literal' && expr.value === 'use strict') {
        return true;
      }
    }
    return false;
  }


  function encodeLiteral(value) {
    var type = (value === null) ? 'null' : typeof value;
    if (type === 'undefined') {
      return 'null';
    }
    if (type === 'null') {
      return 'Object::$null';
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

  function encodeString(value) {
    return utils.encodeString(value);
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

  function repeat(str, count) {
    return new Array(count + 1).join(str);
  }

  exports.generate = function(ast, opts) {
    var generator = new Generator(opts);
    return generator.generate(ast);
  };
})();