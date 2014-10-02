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

  function Transformer() {
    return (this instanceof Transformer) ? this : new Transformer();
  }

  Transformer.prototype.process = function(opts) {
    opts = Object.create(opts || {});
    opts.initVars = (opts.initVars !== false);
    this.parse(opts.source);
    this.indexScopes();
    return codegen.generate(this.ast, opts);
  };

  Transformer.prototype.parse = function(source) {
    this.source = source.trim();
    this.ast = rocambole.parse(this.source);
  };

  Transformer.prototype.indexScopes = function() {
    var ast = this.ast;

    //index var and function declarations
    rocambole.recursive(ast, function(node) {
      if (node.type === 'VariableDeclaration') {
        var scope = utils.getParentScope(node);
        var varNames = scope.vars || setHidden(scope, 'vars', {});
        node.declarations.forEach(function(decl) {
          varNames[decl.id.name] = true;
        });
      } else
      if (node.type === 'FunctionDeclaration') {
        var name = node.id.name;
        scope = utils.getParentScope(node);
        var funcDeclarations = scope.funcs || setHidden(scope, 'funcs', {});
        funcDeclarations[name] = node;
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
    return output.join('\n');
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