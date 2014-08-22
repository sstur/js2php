/*global module, require, exports*/
(function() {
  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  var rocambole = require('rocambole');
  var escodegen = require('escodegen');

  var scopify = require('./scopify');
  var codegen = require('./codegen');

  //these constructs contain variable scope (technically, there's catch scope and ES6 let)
  var SCOPE_TYPES = {FunctionDeclaration: 1, FunctionExpression: 1, Program: 1};

  module.exports = function(opts) {
    var source = opts.source || fs.readFileSync(opts.infile, 'utf8');
    source = mutateFirstPass(source);
    //todo: fix a weird bug when the first character starts a var declaration
    source = '\n' + source;
    source = mutateSecondPass(source);
    source = mutateThirdPass(source);
    var ast = rocambole.parse(source);
    //var js = escodegen.generate(ast, {format: {indent: {style: '  '}}});
    //fs.writeFileSync('./_output.js', js, 'utf8');
    var php = codegen.generate(ast);
    if (opts.outpath && opts.buildRuntime !== false) {
      buildRuntime(opts);
    }
    return '<?php\n' + 'require_once("runtime.php");\n\n' + php;
  };

  module.exports.buildRuntime = buildRuntime;

  function mutateFirstPass(source) {
    clearData();
    var ast = rocambole.parse(source);
    //first we grab the index of each point where we wish to splice the code
    var splicePoints = [];

    //wrap statement in block
    var wrapStatement = function(node) {
      splicePoints.push({
        index: node.startToken.range[0],
        insert: '{'
      });
      splicePoints.push({
        index: node.endToken.range[1],
        insert: '}'
      });
    };

    //determine if var statement should be split (not in if/for/while)
    function shouldSplitVar(parentType) {
      return (parentType === 'Program' || parentType === 'BlockStatement');
    }

    var scopesWithFunctionDeclarations = [];
    var functionsDeclarations = [];

    rocambole.recursive(ast, function(node) {
      //split comma-separated var statements
      if (node.type === 'VariableDeclaration') {
        if (!shouldSplitVar(node.parent.type)) return;
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

      //enforce all if/else to use blocks
      if (node.type === 'IfStatement') {
        if (node.consequent.type !== 'BlockStatement') {
          wrapStatement(node.consequent);
        }
        if (node.alternate) {
          if (node.alternate.type !== 'BlockStatement' && node.alternate.type !== 'IfStatement') {
            wrapStatement(node.alternate);
          }
        }
        return;
      }

      //force all while, for, for..in to use blocks
      if (node.type === 'WhileStatement' || node.type === 'ForStatement' || node.type === 'ForInStatement') {
        if (node.body.type !== 'BlockStatement') {
          wrapStatement(node.body);
        }
      }

      //function declarations
      if (node.type === 'FunctionDeclaration') {
        var scope = getParentScope(node);
        if (scopesWithFunctionDeclarations.indexOf(scope) === -1) {
          scopesWithFunctionDeclarations.push(scope);
        }
        setData(node, 'parentScope', scope);
        functionsDeclarations.push(node);
      }
    });

    //mark functions for hoisting
    var count = 0;
    scopesWithFunctionDeclarations.forEach(function(scope) {
      var toHoist = [];
      functionsDeclarations.forEach(function(func) {
        if (getData(func, 'parentScope') !== scope) return;
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

    source = spliceString(splicePoints, source);
    source = hoistFromMarkers(source);
    return source;
  }


  function mutateSecondPass(source) {
    clearData();
    var ast = rocambole.parse(source);
    //first we grab the index of each point where we wish to splice the code
    var splicePoints = [];
    var scopesWithVars = [];

    //traverse for var declarations
    rocambole.recursive(ast, function(node) {
      if (node.type !== 'VariableDeclaration') return;
      if (node.declarations.length === 1 && node.declarations[0].init === null) {
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
      node.declarations.forEach(function(decl) {
        var scope = getParentScope(node);
        if (scopesWithVars.indexOf(scope) === -1) {
          scopesWithVars.push(scope);
        }
        var varNames = getData(scope, 'vars') || setData(scope, 'vars', []);
        if (varNames.indexOf(decl.id.name) === -1) {
          varNames.push(decl.id.name);
        }
      });
      splicePoints.push({
        index: node.range[0],
        removeCount: 3
      });
    });

    //hoist var declarations
    scopesWithVars.forEach(function(scope) {
      var vars = getData(scope, 'vars') || [];
      splicePoints.push({
        index: scope.type === 'Program' ? scope.startToken.range[0] : scope.startToken.range[1],
        insert: '\nvar ' + vars.join(', ') + ';\n'
      });
    });

    source = spliceString(splicePoints, source);
    return source;
  }


  function mutateThirdPass(source) {
    clearData();
    var ast = rocambole.parse(source);
    var splicePoints = [];
    var scope = scopify(ast);
    var functions = [];
    function walkChildren(scope) {
      scope.children.forEach(function(scope) {
        if (scope.type === 'block') return;
        var keys = scope.undeclared.items();
        if (keys.length) {
          functions.push(scope.node);
          setData(scope.node, 'lexUse', keys);
        }
        walkChildren(scope);
      });
    }
    walkChildren(scope);
    //hoist var declarations
    functions.forEach(function(func) {
      var names = getData(func, 'lexUse') || [];
      splicePoints.push({
        index: func.body.startToken.range[0],
        insert: '/*[use:' + names.join(', ') + ']*/'
      });
    });
    //fs.writeFileSync('./_scope.txt', util.inspect(scope), 'utf8');
    source = spliceString(splicePoints, source);
    return source;
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


  function getParentScope(node) {
    var parent = node.parent;
    while (!(parent.type in SCOPE_TYPES)) {
      parent = parent.parent;
    }
    return (parent.type === 'Program') ? parent : parent.body;
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


  function buildRuntime(opts) {
    var source = fs.readFileSync(path.join(__dirname, '../tests.php'), 'utf8');
    var index = source.indexOf('//</BOILERPLATE>');
    if (index === -1) {
      throw new Error('Unable to find runtime.');
    }
    source = source.slice(0, index);
    var output = [];
    source.replace(/require_once\('(.+?)'\)/g, function(_, file) {
      var source = fs.readFileSync(path.join('.', file), 'utf8');
      source = source.replace('<?php\n', '');
      output.push.apply(output, source.split('\n'));
    });
    var timezone = new Date().toString().slice(-4, -1);
    output.unshift('define("LOCAL_TZ", "' + timezone + '");');
    source = output.join('\n') + '\n';
    fs.writeFileSync(path.join(opts.outpath, 'runtime.php'), '<?php\n' + source, 'utf8');
  }


  function setData(object, name, value) {
    var objects = setData.objects || (setData.objects = []);
    var dataSets = setData.dataSets || (setData.dataSets = {});
    var index = objects.indexOf(object);
    if (index === -1) {
      objects.push(object);
      index = objects.length - 1;
    }
    var data = dataSets[index] || (dataSets[index] = {});
    return (data[name] = value);
  }

  function getData(object, name) {
    var objects = setData.objects || [];
    var dataSets = setData.dataSets || {};
    var index = objects.indexOf(object);
    var data = (index !== -1) && dataSets[index] || {};
    return data[name];
  }

  function clearData() {
    setData.objects = [];
    setData.dataSets = {};
  }

})();