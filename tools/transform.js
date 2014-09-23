/*global module, require, exports*/
(function() {
  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var utils = require('./utils');

  var rocambole = require('rocambole');
  var escope = require('escope');

  var codegen = require('./codegen');

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
    this.opts = opts || (opts = {});
    this.parse(opts.source);
    this.hoistFunctionDeclarations();
    this.indexScopes();
    return codegen.generate(this.ast);
  };

  Transformer.prototype.parse = function(source) {
    //fixes a weird bug when source begins with var or function declaration
    this.source = '\n' + source.trim();
    this.ast = rocambole.parse(this.source);
  };

  Transformer.prototype.hoistFunctionDeclarations = function() {
    var ast = this.ast;
    //first we grab the index of each point where we wish to splice the code
    var splicePoints = [];

    var scopesWithFunctionDeclarations = [];
    var functionsDeclarations = [];

    rocambole.recursive(ast, function(node) {
      //function declarations (to be hoisted)
      if (node.type === 'FunctionDeclaration') {
        var scope = utils.getParentScope(node);
        if (scopesWithFunctionDeclarations.indexOf(scope) === -1) {
          scopesWithFunctionDeclarations.push(scope);
        }
        setHidden(node, 'parentScope', scope);
        functionsDeclarations.push(node);
      }
    });

    //mark functions for hoisting [hacky]
    var count = 0;
    scopesWithFunctionDeclarations.forEach(function(scope) {
      var toHoist = [];
      functionsDeclarations.forEach(function(func) {
        if (func.parentScope !== scope) return;
        //drop in comment placeholders for later hoisting
        var index = ++count;
        toHoist.push('/*!' + index + ':' + func.id.name + '!*/');
        splicePoints.push({
          index: func.startToken.range[0],
          insert: '/*[' + index + '~*/'
        });
        splicePoints.push({
          index: func.endToken.range[1],
          insert: '/*~' + index + ']*/'
        });
      });
      splicePoints.push({
        index: scope.type === 'Program' ? scope.startToken.range[0] : scope.startToken.range[1],
        insert: '\n' + toHoist.join('\n') + '\n'
      });

    });

    var source = this.source;
    source = spliceString(splicePoints, source);
    source = hoistFromMarkers(source);
    this.parse(source);
  };

  Transformer.prototype.indexScopes = function() {
    var ast = this.ast;
    //index var declarations
    rocambole.recursive(ast, function(node) {
      //todo: include function declarations
      if (node.type === 'VariableDeclaration') {
        var scope = utils.getParentScope(node);
        var varNames = scope.vars || setHidden(scope, 'vars', {});
        node.declarations.forEach(function(decl) {
          varNames[decl.id.name] = true;
        });
      }
    });

    var scopes = escope.analyze(ast).scopes;
    //this attaches some scope information to certain nodes
    indexScope(scopes[0]);
    //traverse for variable declarations that are immediately re-assigned
    scopes.forEach(function(scope) {
      if (scope.type !== 'function' && scope.type !== 'global') return;
      var block = scope.block;
      scope.variables.forEach(function(variable) {
        var id = variable.identifiers[0];
        if (!id) return;
        var name = id.name;
        if (id.parent.type === 'VariableDeclarator') {
          var usedLexically = false;
          var childScopes = scope.childScopes || [];
          childScopes.forEach(function(childScope) {
            var childScopeIndex = childScope.block.scopeIndex || {};
            var unresolved = childScopeIndex.unresolved;
            if (unresolved && unresolved[name]) {
              usedLexically = true;
            }
          });
          if (!usedLexically) {
            var references = scope.references.filter(function(ref) {
              return (ref.identifier.name === name);
            });
            if (references.length) {
              var node = references[0].identifier;
              var isVarInit = (node.parent.type === 'VariableDeclarator' && node.parent.init);
              var isAssignment = (node.parent.type === 'AssignmentExpression' && node.parent.left === node);
              if (isVarInit || isAssignment) {
                var implicitlyDefined = block.implicitVars || setHidden(block, 'implicitVars', {});
                implicitlyDefined[name] = true;
              }
            }
          }
        } else
        if (id.parent.type === 'FunctionDeclaration') {
          var funcDeclarations = block.funcs || setHidden(block, 'funcs', {});
          funcDeclarations[name] = block;
        }
      });
    });
    //used to append to variables that need to be renamed unique
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


  function spliceString(splicePoints, source) {
    //then sort by index
    splicePoints.sort(function(a, b) {
      return a.index - b.index;
    });
    //and finally go through and perform the splice actions
    var newSource = [];
    var lastIndex = 0;
    splicePoints.forEach(function(splice) {
      var before = source.slice(lastIndex, splice.index);
      newSource.push(before, splice.insert);
      lastIndex = splice.index + (splice.removeCount || 0);
    });
    newSource.push(source.slice(lastIndex));
    return newSource.join('');
  }


  function hoistFromMarkers(source) {
    var match;
    while ((match = source.match(/\/\*\[(\d+)~\*\/([\s\S]+?)\/\*~\1\]\*\//))) {
      var i = match[1];
      var src = match[2];
      source = source.slice(0, match.index) + source.slice(match.index + match[0].length);
      var startToken = '/*!' + i + ':';
      var endToken = '!*/';
      var index = source.indexOf(startToken);
      var index2 = source.indexOf(endToken, index);
      var name = source.slice(index + startToken.length, index2);
      source = source.replace(startToken + name + endToken, 'var ' + name + ' = ' + src + ';');
    }
    return source;
  }


  function buildRuntime() {
    var source = fs.readFileSync(path.join(__dirname, '../tests.php'), 'utf8');
    var index = source.indexOf('//</BOILERPLATE>');
    if (index === -1) {
      throw new Error('Unable to find runtime.');
    }
    source = source.slice(0, index);
    var output = [];
    source.replace(/require_once\('(.+?)'\)/g, function(_, file) {
      var source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      source = source.replace(/^<\?php/, '');
      source = source.replace(/^\n+|\n+$/g, '');
      output.push(source);
    });
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