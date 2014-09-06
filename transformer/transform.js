/*global module, require, exports*/
(function() {
  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  var rocambole = require('rocambole');
  var escope = require('escope');

  //var scopify = require('./scopify');
  var codegen = require('./codegen');

  //these constructs contain variable scope (technically, there's catch scope and ES6 let)
  var SCOPE_TYPES = {FunctionDeclaration: 1, FunctionExpression: 1, Program: 1};

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
    this.source = opts.source || fs.readFileSync(opts.infile, 'utf8');
    this.ast = rocambole.parse(this.source);
    this.mutateFirstPass();
    this.mutateSecondPass();
    this.mutateThirdPass();
    //var escodegen = require('escodegen');
    //var js = escodegen.generate(this.ast, {format: {indent: {style: '  '}}});
    //fs.writeFileSync('./_output.js', js, 'utf8');
    var php = codegen.generate(this.ast);
    if (opts.outpath && opts.buildRuntime !== false) {
      var runtime = buildRuntime();
      fs.writeFileSync(path.join(opts.outpath, 'runtime.php'), runtime, 'utf8');
    }
    return '<?php\n' + 'require_once("runtime.php");\n\n' + php;
  };

  Transformer.prototype.mutateFirstPass = function() {
    var ast = this.ast;
    //first we grab the index of each point where we wish to splice the code
    var splicePoints = [];

    var scopesWithFunctionDeclarations = [];
    var functionsDeclarations = [];

    rocambole.recursive(ast, function(node) {
      //split comma-separated var statements
      if (node.type === 'VariableDeclaration') {
        //don't split vars in `for`
        if (!isBlockLevelVar(node)) return;
        node.declarations.forEach(function(decl) {
          var sep = decl.endToken && decl.endToken.next;
          if (sep && sep.type === 'Punctuator' && sep.value === ',') {
            splicePoints.push({
              index: sep.range[0],
              removeCount: 1,
              insert: '; var' + (sep.next.type === 'WhiteSpace' ? '' : ' ')
            });
          }
        });
        return;
      }

      //wrap statement in block
      var wrapStmtInBlock = function(node) {
        splicePoints.push({
          index: node.startToken.range[0],
          insert: '{'
        });
        splicePoints.push({
          index: node.endToken.range[1],
          insert: '}'
        });
      };

      //enforce all if/else to use blocks
      if (node.type === 'IfStatement') {
        if (node.consequent.type !== 'BlockStatement') {
          wrapStmtInBlock(node.consequent);
        }
        if (node.alternate) {
          //wrap else part if it's not a block or another if statement
          if (node.alternate.type !== 'BlockStatement' && node.alternate.type !== 'IfStatement') {
            wrapStmtInBlock(node.alternate);
          }
        }
        return;
      }

      //force all while, for, for..in to use blocks
      if (node.type === 'WhileStatement' || node.type === 'ForStatement' || node.type === 'ForInStatement') {
        if (node.body.type !== 'BlockStatement') {
          wrapStmtInBlock(node.body);
        }
      }

      //function declarations (to be hoisted)
      if (node.type === 'FunctionDeclaration') {
        var scope = getParentScope(node);
        if (scopesWithFunctionDeclarations.indexOf(scope) === -1) {
          scopesWithFunctionDeclarations.push(scope);
        }
        set(node, 'parentScope', scope);
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
    //todo: fix a weird bug when the first character starts a var declaration
    source = '\n' + source;
    this.source = source;
    this.ast = rocambole.parse(source);
  };

  Transformer.prototype.mutateSecondPass = function() {
    var ast = this.ast;
    //first we grab the index of each point where we wish to splice the code
    var splicePoints = [];
    var scopesWithVars = [];

    //traverse for var declarations
    rocambole.recursive(ast, function(node) {
      if (node.type !== 'VariableDeclaration') {
        return;
      }

      //add each decl to the list of var names of the parent scope
      //there will be only one declaration, unless it's in a `for`
      node.declarations.forEach(function(decl) {
        var scope = getParentScope(node);
        if (scopesWithVars.indexOf(scope) === -1) {
          scopesWithVars.push(scope);
        }
        var varNames = scope.vars || set(scope, 'vars', []);
        if (varNames.indexOf(decl.id.name) === -1) {
          varNames.push(decl.id.name);
        }
      });
      //if it's a `var` without an `=`, remove it completely (unless we're in a `for`)
      if (node.declarations.length === 1 && node.declarations[0].init === null && isBlockLevelVar(node)) {
        var endIndex = node.range[1];
        if (node.endToken.next && node.endToken.next.type === 'Punctuator') {
          endIndex = node.endToken.next.range[0];
        }
        splicePoints.push({
          index: node.range[0],
          removeCount: endIndex - node.range[0]
        });
        return;
      }
      splicePoints.push({
        index: node.range[0],
        removeCount: 4
      });
    });

    //hoist var declarations
    scopesWithVars.forEach(function(scope) {
      var vars = scope.vars || [];
      splicePoints.push({
        index: scope.type === 'Program' ? scope.startToken.range[0] : scope.startToken.range[1],
        insert: '\nvar ' + vars.join(', ') + ';\n'
      });
    });

    this.source = spliceString(splicePoints, this.source);
    this.ast = rocambole.parse(this.source);
  };

  Transformer.prototype.mutateThirdPass = function() {
    var ast = this.ast;
    var scopes = escope.analyze(ast).scopes;
    scopes.forEach(function(scope) {
      if (scope.type === 'function') {
        var undeclaredVars = [];
        scope.references.forEach(function(ref) {
          if (ref.from !== scope) {
            undeclaredVars.push(ref.identifier.name);
          }
        });
        set(scope.block, 'undeclaredVars', undeclaredVars);
      }
    });
    //used to append to variables that need to be renamed unique
    var count = 0;
    scopes.forEach(function(scope) {
      if (scope.type === 'catch') {
        //var param = scope.block.param;
        var param = scope.variables[0];
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
//    var scope = scopify(ast);
//    //fs.writeFileSync('./_scope.txt', util.inspect(scope, {depth: 4}), 'utf8');
//    function walkChildren(scope) {
//      scope.children.forEach(function(scope) {
//        if (scope.type === 'block') {
//          walkChildren(scope);
//          return;
//        }
//        var undeclared = scope.undeclared.items();
//        undeclared = undeclared.filter(function(key) {
//          return (key !== 'arguments');
//        });
//        set(scope.node, 'undeclaredVars', undeclared);
//        walkChildren(scope);
//      });
//    }
//    walkChildren(scope);
  };



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


  function getParentScope(node) {
    var parent = node.parent;
    while (!(parent.type in SCOPE_TYPES)) {
      parent = parent.parent;
    }
    return (parent.type === 'Program') ? parent : parent.body;
  }


  //determine if var statement is in code block (not in `for`)
  function isBlockLevelVar(node) {
    return (node.parent.type === 'Program' || node.parent.type === 'BlockStatement');
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
      source = source.replace('<?php\n', '');
      output.push.apply(output, source.split('\n'));
    });
    var timezone = new Date().toString().slice(-4, -1);
    output.unshift('define("LOCAL_TZ", "' + timezone + '");');
    source = output.join('\n') + '\n';
    return '<?php\n' + source;
  }

  function set(object, name, value) {
    Object.defineProperty(object, name, {
      value: value,
      enumerable: false,
      writable: true,
      configurable: true
    });
    return value;
  }

})();