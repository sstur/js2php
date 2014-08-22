/**
 * https://gist.github.com/Benvie/4657032
 * See also:
 *   http://tobyho.com/2013/12/20/falafel-source-rewriting-magicial-assert/
 *   https://github.com/clausreinke/estr
 *   https://github.com/Constellation/escope
 *   https://github.com/buildjs/periscope
 * Demo:
 *   http://piuccio.github.io/rocambole-visualize/
 *   http://felix-kling.de/esprima_ast_explorer/
 *   http://clausreinke.github.io/estr/
 *   http://esprima.org/demo/highlight.html
 * Hoist:
 *   https://github.com/nathan7/ast-hoist
 *   https://github.com/mmckegg/hoister
 *
 */
/*global module */
var scopify = (function() {
  var esprima = require('esprima');

  // utilities

  function hide(object, key) {
    Object.defineProperty(object, key, {enumerable: false});
  }

  function define(object, methods) {
    var descriptor = {
      configurable: true,
      enumerable: false,
      writable: true
    };
    Object.keys(methods).forEach(function(name) {
      descriptor.value = methods[name];
      Object.defineProperty(object, name, descriptor);
    });
    return object;
  }

  function inherit(Ctor, Super, methods) {
    Ctor.prototype = Object.create(Super.prototype);
    define(Ctor.prototype, methods);
  }

  function isObject(o) {
    return typeof o === 'object' ? o !== null : typeof o === 'function';
  }

  function isLexicalDeclaration(node) {
    return node.type === 'VariableDeclaration'
      && node.kind !== 'var';
  }

  // ###############
  // ### HashSet ###
  // ###############

  function HashSet(items) {
    this.data = Object.create(null);
    this.size = 0;
    if (items) {
      this.add(items);
    }
  }

  define(HashSet.prototype, {
    add: function(items) {
      if (typeof items === 'string') {
        if (!(items in this.data)) {
          this.data[items] = true;
          this.size++;
        }
      } else if (items instanceof HashSet) {
        for (var item in items.data) {
          this.add(item);
        }
      } else if (items instanceof Array) {
        for (var i = 0; i < items.length; i++) {
          this.add(items[i]);
        }
      }
    },
    has: function(item) {
      return item in this.data;
    },
    remove: function(item) {
      if (item in this.data) {
        delete this.data[item];
        this.size--;
        return true;
      }
      return false;
    },
    filter: function(callback, context) {
      var index = 0,
        result = new HashSet();

      context || (context = this);

      for (var item in this.data) {
        if (callback.call(context, item, index++, this)) {
          result.add(item);
        }
      }

      return result;
    },
    items: function() {
      var result = [];
      for (var item in this.data) {
        result.push(item);
      }
      return result;
    },
    difference: function(set) {
      return this.filter(function(item) {
        return !set.has(item);
      });
    },
    inspect: function() {
      return require('util').inspect(this.items());
    }
  });

  // #############
  // ### Scope ###
  // #############

  function Scope() {
    this.declared = new HashSet();
    this.undeclared = null;
    this.used = new HashSet();
    this.unused = null;
    this.children = [];
  }

  define(Scope.prototype, {
    declare: function(kind, names) {
      this.declared.add(names);
    },
    use: function(names) {
      this.used.add(names);
    },
    close: function() {
      this.undeclared = this.used.difference(this.declared);
      this.unused = this.declared.difference(this.used);
    }
  });

  // ###################
  // ### GlobalScope ###
  // ###################

  function GlobalScope() {
    this.type = 'global';
    Scope.call(this);
  }

  inherit(GlobalScope, Scope, {});

  // #####################
  // ### FunctionScope ###
  // #####################

  function FunctionScope(node, outer) {
    this.type = 'function';
    this.name = node.id ? node.id.name : '';
    if (node.type === 'FunctionExpression') {
      this.expression = true;
    }
    Scope.call(this);
    this.node = node;
    hide(this, 'node');
    this.outer = outer;
    hide(this, 'outer');
    outer.children.push(this);
  }

  inherit(FunctionScope, Scope, {
    close: function() {
      Scope.prototype.close.call(this);
      if (this.name && this.expression) {
        this.undeclared.remove(this.name);
      }
      this.outer.use(this.undeclared);
    }
  });

  // ##################
  // ### BlockScope ###
  // ##################

  function BlockScope(outer) {
    this.type = 'block';
    Scope.call(this);
    this.outer = outer;
    hide(this, 'outer');
    outer.children.push(this);
  }

  inherit(BlockScope, Scope, {
    close: function() {
      Scope.prototype.close.call(this);
      this.outer.use(this.undeclared);
    },
    declare: function(kind, names) {
      if (kind === 'var') {
        this.outer.declare(kind, names);
      } else {
        this.declared.add(names);
      }
    }
  });

  // bound names collectors

  var patterns = {
    ArrayPattern: function(node, names) {
      node.elements.forEach(function(element) {
        element && boundNames(element, names);
      });
    },
    Identifier: function(node, names) {
      names.add(node.name);
    },
    ObjectPattern: function(node, names) {
      node.properties.forEach(function(property) {
        boundNames(property.value, names);
      });
    }
  };

  function boundNames(node, names) {
    names || (names = new HashSet());
    patterns[node.type](node, names);
    return names;
  }

  var scanners = {
    ArrayPattern: function(node, scope) {
      node.elements.forEach(function(element) {
        element && scanNode(element, scope);
      });
    },
    BlockStatement: function(node, scope) {
      var childScope = new BlockScope(scope);
      scanEach(node.body, childScope);
      childScope.close();
    },
    ForStatement: function(node, scope) {
      if (node.init && isLexicalDeclaration(node.init)) {
        var childScope = new BlockScope(scope);
        scanEach(node, childScope);
        childScope.close();
      } else {
        scanEach(node, scope);
      }
    },
    ForInStatement: function(node, scope) {
      if (isLexicalDeclaration(node.left)) {
        var childScope = new BlockScope(scope);
        scanEach(node, childScope);
        childScope.close();
      } else {
        scanEach(node, scope);
      }
    },
    ForOfStatement: function(node, scope) {
      scanners.ForInStatement(node, scope);
    },
    FunctionDeclaration: function(node, scope) {
      scope.declare('let', node.id.name);
      scanners.FunctionExpression(node, scope);
    },
    FunctionExpression: function(node, scope) {
      var childScope = new FunctionScope(node, scope);
      node.params.forEach(function(param) {
        childScope.declare('var', boundNames(param));
      });
      scanEach(node.body.body, childScope);
      childScope.close();
    },
    Identifier: function(node, scope) {
      if (node.parent.type === 'MemberExpression' && node.parent.property === node && !node.parent.computed) {
        //console.log('skipping:', getName(node.parent) + '.' + node.name);
        return;
      }
      if (node.parent.type === 'Property' && node.parent.key === node) {
        //console.log('skipping object key:', node.name);
        return;
      }
      //if (node.parent.type === 'FunctionExpression' || node.parent.type === 'FunctionDeclaration') {
      //  console.log('parent function:', node.parent.type, node.name);
      //  //return;
      //}
      scope.use(node.name);
    },
    ObjectPattern: function(node, scope) {
      node.properties.forEach(function(property) {
        scanNode(property, scope);
      });
    },
    VariableDeclaration: function(node, scope) {
      node.declarations.forEach(function(decl) {
        scanNode(decl.init, scope);
        scope.declare(node.kind, boundNames(decl.id));
      });
    },
    WithStatement: function(node, scope) {
      throw new Error('Encountered `with` statement');
    }
  };

  function getName(memberExpr) {
    var object = memberExpr.object;
    if (object.type === 'ThisExpression') {
      return 'this';
    } else
    if (object.type === 'MemberExpression') {
      return getName(object) + '.' + object.property.name;
    } else {
      return object.name;
    }
  }

  // recursive AST node walkers
  var DO_NOT_SCAN = {
    parent: true,
    toString: true,
    next: true,
    prev: true,
    depth: true,
    startToken: true,
    endToken: true,
    range: true
  };

  function scanEach(node, scope) {
    if (node.type) {
      var keys = Object.keys(node);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key in DO_NOT_SCAN) continue;
        scanNode(node[key], scope);
      }
    } else
    if (Array.isArray(node)) {
      for (var j = 0; j < node.length; j++) {
        scanNode(node[j], scope);
      }
    }
  }

  function scanNode(node, scope) {
    if (isObject(node)) {
      if (node.type in scanners) {
        scanners[node.type](node, scope);
      } else {
        scanEach(node, scope);
      }
    }
  }

  // exported function

  var scopify = function scopify(input) {
    var node = isObject(input) ? input : esprima.parse(input);
    var scope = new GlobalScope();
    scanEach(node.body, scope);
    scope.close();
    return scope;
  };

  scopify.HashSet = HashSet;
  return scopify;
})();

if (typeof module === 'object') {
  module.exports = scopify;
}
