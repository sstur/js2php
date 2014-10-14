/*global module, require, exports*/
(function() {
  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var utils = require('./utils');

  var rocambole = require('rocambole');
  var escope = require('escope');

  var codegen = require('./codegen');

  /**
   * opts.source - JS source code to transform
   * opts.initVars - initialize all variables in PHP (default: true)
   */
  module.exports = function(opts) {
    var transformer = new Transformer();
    return transformer.process(opts);
  };

  module.exports.Transformer = Transformer;
  module.exports.buildRuntime = buildRuntime;

  var nodeHandlers = {
    NewExpression: function(node) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'Function') {
        var args = node.arguments.slice(0);
        //ensure all arguments are string literals
        for (var i = 0, len = args.length; i < len; i++) {
          var arg = args[i];
          if (arg.type !== 'Literal' || typeof arg.value !== 'string') {
            throw new Error('Parse Error: new Function() not supported except with string literal');
          }
        }
        args = args.map(function(arg) {
          return arg.value;
        });
        var body = args.pop();
        var code = '(function(' + args.join(', ') + ') {' + body + '})';
        var ast = this.parse(code);
        var newNode = ast.body[0].expression;
        this.replaceNode(node, newNode);
        setHidden(newNode, 'useStrict', false);
      }
    },
    VariableDeclaration: function(node) {
      var scope = utils.getParentScope(node);
      var varNames = scope.vars || setHidden(scope, 'vars', {});
      node.declarations.forEach(function(decl) {
        varNames[decl.id.name] = true;
      });
    },
    FunctionDeclaration: function(node) {
      var name = node.id.name;
      var scope = utils.getParentScope(node);
      var funcDeclarations = scope.funcs || setHidden(scope, 'funcs', {});
      funcDeclarations[name] = node;
    },
    BinaryExpression: function(node) {
      if (node.operator === '+') {
        var terms = getTerms(node, '+');
        var isConcat = terms.some(function(node) {
          return (node.type === 'Literal' && typeof node.value === 'string');
        });
        setHidden(node, 'terms', terms);
        setHidden(node, 'isConcat', isConcat);
      }
    }
  };

  function getTerms(node, op) {
    var terms = [];
    if (node.left.type === 'BinaryExpression' && node.left.operator === op) {
      terms = terms.concat(getTerms(node.left, op));
    } else {
      terms.push(node.left);
    }
    if (node.right.type === 'BinaryExpression' && node.right.operator === op) {
      terms = terms.concat(getTerms(node.right, op));
    } else {
      terms.push(node.right);
    }
    return terms;
  }

  function Transformer() {
    return (this instanceof Transformer) ? this : new Transformer();
  }

  Transformer.prototype.process = function(opts) {
    opts = Object.create(opts || {});
    opts.initVars = (opts.initVars !== false);
    this.opts = opts;
    var ast = this.parse(opts.source);
    return codegen.generate(ast, opts);
  };

  Transformer.prototype.parse = function(source) {
    source = source.trim();
    var ast = rocambole.parse(source);
    this.transform(ast);
    return ast;
  };

  Transformer.prototype.transform = function(ast) {
    var self = this;
    //walk tree and let handlers manipulate specific nodes (by type)
    rocambole.recursive(ast, function(node) {
      var type = node.type;
      if (type in nodeHandlers) {
        nodeHandlers[type].call(self, node);
      }
    });

    //analyze and walk scope, attaching some information to certain nodes
    var scopes = escope.analyze(ast).scopes;
    indexScope(scopes[0]);

    //count is for creating unique variable names
    var count = 0;
    //traverse for catch clauses and rename param if necessary
    scopes.forEach(function(scope) {
      if (scope.type === 'catch') {
        var param = scope.variables[0];
        //todo: rename only if parent scope has any references with same name
        var identifiers = [param.identifiers[0]];
        param.references.forEach(function(ref) {
          identifiers.push(ref.identifier);
        });
        var suffix = '_' + (++count) + '_';
        identifiers.forEach(function(identifier) {
          identifier.appendSuffix = suffix;
        });
      }
    });
  };

  Transformer.prototype.replaceNode = function(oldNode, newNode) {
    var parent = oldNode.parent;
    Object.keys(parent).forEach(function(key) {
      if (parent[key] === oldNode) {
        parent[key] = newNode;
      }
    });
    newNode.parent = parent;
  };



  //index a scope, calculating lists of defined, referenced and unresolved vars
  function indexScope(scope) {
    if (scope.functionExpressionScope) {
      //named function expressions are wrapped in an extra scope; skip over this
      return indexScope(scope.childScopes[0]);
    }
    //get variable names defined in this scope
    var defined = Object.create(null);
    scope.variables.forEach(function(variable) {
      defined[variable.name] = true;
    });
    //get all variable names referenced and unresolved ones
    var referenced = Object.create(null);
    var unresolved = Object.create(null);
    scope.references.forEach(function(ref) {
      var name = ref.identifier.name;
      referenced[name] = true;
      if (!ref.resolved || ref.resolved.scope !== scope) {
        unresolved[name] = true;
      }
    });
    //get descendant references not defined locally
    var childScopes = scope.childScopes || [];
    childScopes.forEach(function(childScope) {
      var index = indexScope(childScope);
      Object.keys(index.unresolved).forEach(function(name) {
        referenced[name] = true;
        if (!defined[name]) {
          unresolved[name] = true;
        }
      });
    });
    var scopeIndex = {
      defined: defined,
      referenced: referenced,
      unresolved: unresolved,
      thisFound: scope.thisFound
    };
    setHidden(scope.block, 'scopeIndex', scopeIndex);
    return scopeIndex;
  }


  function buildRuntime() {
    var source = fs.readFileSync(path.join(__dirname, '../runtime.php'), 'utf8');
    var output = [];
    source.replace(/require_once\('(.+?)'\)/g, function(_, file) {
      var source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      source = source.replace(/^<\?php/, '');
      source = source.replace(/^\n+|\n+$/g, '');
      output.push(source);
    });
    output.unshift('mb_internal_encoding("UTF-8");\n');
    var timezone = new Date().toString().slice(-4, -1);
    output.unshift('define("LOCAL_TZ", "' + timezone + '");\n');
    output = output.join('\n');
    //note: this is a really primitive way to remove comments from PHP; it will
    // choke on several edge cases, but it's OK because we don't have anything
    // too funky in our runtime code
    output = output.replace(/'(\\.|[^'\n])*'|"(\\.|[^"\n])*"|\/\*([\s\S]*?)\*\/|\/\/.*?\n/g, function(match) {
      var ch = match.charAt(0);
      if (ch === '"' || ch === "'") {
        return match;
      }
      return (match.slice(0, 2) === '//') ? '\n' : '';
    });
    //remove empty lines
    output = output.replace(/\n([ \t]*\n)+/g, '\n');
    return output;
  }

  function setHidden(object, name, value) {
    Object.defineProperty(object, name, {
      value: value,
      enumerable: false,
      writable: true,
      configurable: true
    });
    return value;
  }

})();