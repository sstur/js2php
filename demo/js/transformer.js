!(function (e) {
  if ('object' == typeof exports && 'undefined' != typeof module)
    module.exports = e();
  else if ('function' == typeof define && define.amd) define([], e);
  else {
    var f;
    'undefined' != typeof window
      ? (f = window)
      : 'undefined' != typeof global
      ? (f = global)
      : 'undefined' != typeof self && (f = self),
      (f.Transformer = e());
  }
})(function () {
  var define, module, exports;
  return (function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == 'function' && require;
          if (!u && a) return a(o, !0);
          if (i) return i(o, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
        var f = (n[o] = { exports: {} });
        t[o][0].call(
          f.exports,
          function (e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          },
          f,
          f.exports,
          e,
          t,
          n,
          r
        );
      }
      return n[o].exports;
    }
    var i = typeof require == 'function' && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s;
  })(
    {
      1: [
        function (_dereq_, module, exports) {
          /*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2013 Alex Seville <hi@alexanderseville.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

          /**
           * Escope (<a href="http://github.com/Constellation/escope">escope</a>) is an <a
           * href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ECMAScript</a>
           * scope analyzer extracted from the <a
           * href="http://github.com/Constellation/esmangle">esmangle project</a/>.
           * <p>
           * <em>escope</em> finds lexical scopes in a source program, i.e. areas of that
           * program where different occurrences of the same identifier refer to the same
           * variable. With each scope the contained variables are collected, and each
           * identifier reference in code is linked to its corresponding variable (if
           * possible).
           * <p>
           * <em>escope</em> works on a syntax tree of the parsed source code which has
           * to adhere to the <a
           * href="https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API">
           * Mozilla Parser API</a>. E.g. <a href="http://esprima.org">esprima</a> is a parser
           * that produces such syntax trees.
           * <p>
           * The main interface is the {@link analyze} function.
           * @module
           */

          /*jslint bitwise:true */
          /*global exports:true, define:true, require:true*/
          (function (factory, global) {
            'use strict';

            function namespace(str, obj) {
              var i, iz, names, name;
              names = str.split('.');
              for (i = 0, iz = names.length; i < iz; ++i) {
                name = names[i];
                if (obj.hasOwnProperty(name)) {
                  obj = obj[name];
                } else {
                  obj = obj[name] = {};
                }
              }
              return obj;
            }

            // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
            // and plain browser loading,
            if (typeof define === 'function' && define.amd) {
              define('escope', ['exports', 'estraverse'], function (
                exports,
                estraverse
              ) {
                factory(exports, global, estraverse);
              });
            } else if (typeof exports !== 'undefined') {
              factory(exports, global, _dereq_('estraverse'));
            } else {
              factory(namespace('escope', global), global, global.estraverse);
            }
          })(function (exports, global, estraverse) {
            'use strict';

            var Syntax, Map, currentScope, globalScope, scopes, options;

            Syntax = estraverse.Syntax;

            if (typeof global.Map !== 'undefined') {
              // ES6 Map
              Map = global.Map;
            } else {
              Map = function Map() {
                this.__data = {};
              };

              Map.prototype.get = function MapGet(key) {
                key = '$' + key;
                if (this.__data.hasOwnProperty(key)) {
                  return this.__data[key];
                }
                return undefined;
              };

              Map.prototype.has = function MapHas(key) {
                key = '$' + key;
                return this.__data.hasOwnProperty(key);
              };

              Map.prototype.set = function MapSet(key, val) {
                key = '$' + key;
                this.__data[key] = val;
              };

              Map.prototype['delete'] = function MapDelete(key) {
                key = '$' + key;
                return delete this.__data[key];
              };
            }

            function assert(cond, text) {
              if (!cond) {
                throw new Error(text);
              }
            }

            function defaultOptions() {
              return {
                optimistic: false,
                directive: false,
              };
            }

            function updateDeeply(target, override) {
              var key, val;

              function isHashObject(target) {
                return (
                  typeof target === 'object' &&
                  target instanceof Object &&
                  !(target instanceof RegExp)
                );
              }

              for (key in override) {
                if (override.hasOwnProperty(key)) {
                  val = override[key];
                  if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                      updateDeeply(target[key], val);
                    } else {
                      target[key] = updateDeeply({}, val);
                    }
                  } else {
                    target[key] = val;
                  }
                }
              }
              return target;
            }

            /**
             * A Reference represents a single occurrence of an identifier in code.
             * @class Reference
             */
            function Reference(
              ident,
              scope,
              flag,
              writeExpr,
              maybeImplicitGlobal
            ) {
              /**
               * Identifier syntax node.
               * @member {esprima#Identifier} Reference#identifier
               */
              this.identifier = ident;
              /**
               * Reference to the enclosing Scope.
               * @member {Scope} Reference#from
               */
              this.from = scope;
              /**
               * Whether the reference comes from a dynamic scope (such as 'eval',
               * 'with', etc.), and may be trapped by dynamic scopes.
               * @member {boolean} Reference#tainted
               */
              this.tainted = false;
              /**
               * The variable this reference is resolved with.
               * @member {Variable} Reference#resolved
               */
              this.resolved = null;
              /**
               * The read-write mode of the reference. (Value is one of {@link
               * Reference.READ}, {@link Reference.RW}, {@link Reference.WRITE}).
               * @member {number} Reference#flag
               * @private
               */
              this.flag = flag;
              if (this.isWrite()) {
                /**
                 * If reference is writeable, this is the tree being written to it.
                 * @member {esprima#Node} Reference#writeExpr
                 */
                this.writeExpr = writeExpr;
              }
              /**
               * Whether the Reference might refer to a global variable.
               * @member {boolean} Reference#__maybeImplicitGlobal
               * @private
               */
              this.__maybeImplicitGlobal = maybeImplicitGlobal;
            }

            /**
             * @constant Reference.READ
             * @private
             */
            Reference.READ = 0x1;
            /**
             * @constant Reference.WRITE
             * @private
             */
            Reference.WRITE = 0x2;
            /**
             * @constant Reference.RW
             * @private
             */
            Reference.RW = 0x3;

            /**
             * Whether the reference is static.
             * @method Reference#isStatic
             * @return {boolean}
             */
            Reference.prototype.isStatic = function isStatic() {
              return (
                !this.tainted && this.resolved && this.resolved.scope.isStatic()
              );
            };

            /**
             * Whether the reference is writeable.
             * @method Reference#isWrite
             * @return {boolean}
             */
            Reference.prototype.isWrite = function isWrite() {
              return this.flag & Reference.WRITE;
            };

            /**
             * Whether the reference is readable.
             * @method Reference#isRead
             * @return {boolean}
             */
            Reference.prototype.isRead = function isRead() {
              return this.flag & Reference.READ;
            };

            /**
             * Whether the reference is read-only.
             * @method Reference#isReadOnly
             * @return {boolean}
             */
            Reference.prototype.isReadOnly = function isReadOnly() {
              return this.flag === Reference.READ;
            };

            /**
             * Whether the reference is write-only.
             * @method Reference#isWriteOnly
             * @return {boolean}
             */
            Reference.prototype.isWriteOnly = function isWriteOnly() {
              return this.flag === Reference.WRITE;
            };

            /**
             * Whether the reference is read-write.
             * @method Reference#isReadWrite
             * @return {boolean}
             */
            Reference.prototype.isReadWrite = function isReadWrite() {
              return this.flag === Reference.RW;
            };

            /**
             * A Variable represents a locally scoped identifier. These include arguments to
             * functions.
             * @class Variable
             */
            function Variable(name, scope) {
              /**
               * The variable name, as given in the source code.
               * @member {String} Variable#name
               */
              this.name = name;
              /**
               * List of defining occurrences of this variable (like in 'var ...'
               * statements or as parameter), as AST nodes.
               * @member {esprima.Identifier[]} Variable#identifiers
               */
              this.identifiers = [];
              /**
               * List of {@link Reference|references} of this variable (excluding parameter entries)
               * in its defining scope and all nested scopes. For defining
               * occurrences only see {@link Variable#defs}.
               * @member {Reference[]} Variable#references
               */
              this.references = [];

              /**
               * List of defining occurrences of this variable (like in 'var ...'
               * statements or as parameter), as custom objects.
               * @typedef {Object} DefEntry
               * @property {String} DefEntry.type - the type of the occurrence (e.g.
               *      "Parameter", "Variable", ...)
               * @property {esprima.Identifier} DefEntry.name - the identifier AST node of the occurrence
               * @property {esprima.Node} DefEntry.node - the enclosing node of the
               *      identifier
               * @property {esprima.Node} [DefEntry.parent] - the enclosing statement
               *      node of the identifier
               * @member {DefEntry[]} Variable#defs
               */
              this.defs = [];

              this.tainted = false;
              /**
               * Whether this is a stack variable.
               * @member {boolean} Variable#stack
               */
              this.stack = true;
              /**
               * Reference to the enclosing Scope.
               * @member {Scope} Variable#scope
               */
              this.scope = scope;
            }

            Variable.CatchClause = 'CatchClause';
            Variable.Parameter = 'Parameter';
            Variable.FunctionName = 'FunctionName';
            Variable.Variable = 'Variable';
            Variable.ImplicitGlobalVariable = 'ImplicitGlobalVariable';

            function isStrictScope(scope, block) {
              var body, i, iz, stmt, expr;

              // When upper scope is exists and strict, inner scope is also strict.
              if (scope.upper && scope.upper.isStrict) {
                return true;
              }

              if (scope.type === 'function') {
                body = block.body;
              } else if (scope.type === 'global') {
                body = block;
              } else {
                return false;
              }

              if (options.directive) {
                for (i = 0, iz = body.body.length; i < iz; ++i) {
                  stmt = body.body[i];
                  if (stmt.type !== 'DirectiveStatement') {
                    break;
                  }
                  if (
                    stmt.raw === '"use strict"' ||
                    stmt.raw === "'use strict'"
                  ) {
                    return true;
                  }
                }
              } else {
                for (i = 0, iz = body.body.length; i < iz; ++i) {
                  stmt = body.body[i];
                  if (stmt.type !== Syntax.ExpressionStatement) {
                    break;
                  }
                  expr = stmt.expression;
                  if (
                    expr.type !== Syntax.Literal ||
                    typeof expr.value !== 'string'
                  ) {
                    break;
                  }
                  if (expr.raw != null) {
                    if (
                      expr.raw === '"use strict"' ||
                      expr.raw === "'use strict'"
                    ) {
                      return true;
                    }
                  } else {
                    if (expr.value === 'use strict') {
                      return true;
                    }
                  }
                }
              }
              return false;
            }

            /**
             * @class Scope
             */
            function Scope(block, opt) {
              var variable, body;

              /**
               * One of 'catch', 'with', 'function' or 'global'.
               * @member {String} Scope#type
               */
              this.type =
                block.type === Syntax.CatchClause
                  ? 'catch'
                  : block.type === Syntax.WithStatement
                  ? 'with'
                  : block.type === Syntax.Program
                  ? 'global'
                  : 'function';
              /**
               * The scoped {@link Variable}s of this scope, as <code>{ Variable.name
               * : Variable }</code>.
               * @member {Map} Scope#set
               */
              this.set = new Map();
              /**
               * The tainted variables of this scope, as <code>{ Variable.name :
               * boolean }</code>.
               * @member {Map} Scope#taints */
              this.taints = new Map();
              /**
               * Generally, through the lexical scoping of JS you can always know
               * which variable an identifier in the source code refers to. There are
               * a few exceptions to this rule. With 'global' and 'with' scopes you
               * can only decide at runtime which variable a reference refers to.
               * Moreover, if 'eval()' is used in a scope, it might introduce new
               * bindings in this or its prarent scopes.
               * All those scopes are considered 'dynamic'.
               * @member {boolean} Scope#dynamic
               */
              this.dynamic = this.type === 'global' || this.type === 'with';
              /**
               * A reference to the scope-defining syntax node.
               * @member {esprima.Node} Scope#block
               */
              this.block = block;
              /**
               * The {@link Reference|references} that are not resolved with this scope.
               * @member {Reference[]} Scope#through
               */
              this.through = [];
              /**
               * The scoped {@link Variable}s of this scope. In the case of a
               * 'function' scope this includes the automatic argument <em>arguments</em> as
               * its first element, as well as all further formal arguments.
               * @member {Variable[]} Scope#variables
               */
              this.variables = [];
              /**
               * Any variable {@link Reference|reference} found in this scope. This
               * includes occurrences of local variables as well as variables from
               * parent scopes (including the global scope). For local variables
               * this also includes defining occurrences (like in a 'var' statement).
               * In a 'function' scope this does not include the occurrences of the
               * formal parameter in the parameter list.
               * @member {Reference[]} Scope#references
               */
              this.references = [];
              /**
               * List of {@link Reference}s that are left to be resolved (i.e. which
               * need to be linked to the variable they refer to). Used internally to
               * resolve bindings during scope analysis. On a finalized scope
               * analysis, all sopes have <em>left</em> value <strong>null</strong>.
               * @member {Reference[]} Scope#left
               */
              this.left = [];
              /**
               * For 'global' and 'function' scopes, this is a self-reference. For
               * other scope types this is the <em>variableScope</em> value of the
               * parent scope.
               * @member {Scope} Scope#variableScope
               */
              this.variableScope =
                this.type === 'global' || this.type === 'function'
                  ? this
                  : currentScope.variableScope;
              /**
               * Whether this scope is created by a FunctionExpression.
               * @member {boolean} Scope#functionExpressionScope
               */
              this.functionExpressionScope = false;
              /**
               * Whether this is a scope that contains an 'eval()' invocation.
               * @member {boolean} Scope#directCallToEvalScope
               */
              this.directCallToEvalScope = false;
              /**
               * @member {boolean} Scope#thisFound
               */
              this.thisFound = false;
              body = this.type === 'function' ? block.body : block;
              if (opt.naming) {
                this.__define(block.id, {
                  type: Variable.FunctionName,
                  name: block.id,
                  node: block,
                });
                this.functionExpressionScope = true;
              } else {
                if (this.type === 'function') {
                  variable = new Variable('arguments', this);
                  this.taints.set('arguments', true);
                  this.set.set('arguments', variable);
                  this.variables.push(variable);
                }

                if (block.type === Syntax.FunctionExpression && block.id) {
                  new Scope(block, { naming: true });
                }
              }

              /**
               * Reference to the parent {@link Scope|scope}.
               * @member {Scope} Scope#upper
               */
              this.upper = currentScope;
              /**
               * Whether 'use strict' is in effect in this scope.
               * @member {boolean} Scope#isStrict
               */
              this.isStrict = isStrictScope(this, block);

              /**
               * List of nested {@link Scope}s.
               * @member {Scope[]} Scope#childScopes
               */
              this.childScopes = [];
              if (currentScope) {
                currentScope.childScopes.push(this);
              }

              // RAII
              currentScope = this;
              if (this.type === 'global') {
                globalScope = this;
                globalScope.implicit = {
                  set: new Map(),
                  variables: [],
                };
              }
              scopes.push(this);
            }

            Scope.prototype.__close = function __close() {
              var i, iz, ref, current, node, implicit;

              // Because if this is global environment, upper is null
              if (!this.dynamic || options.optimistic) {
                // static resolve
                for (i = 0, iz = this.left.length; i < iz; ++i) {
                  ref = this.left[i];
                  if (!this.__resolve(ref)) {
                    this.__delegateToUpperScope(ref);
                  }
                }
              } else {
                // this is "global" / "with" / "function with eval" environment
                if (this.type === 'with') {
                  for (i = 0, iz = this.left.length; i < iz; ++i) {
                    ref = this.left[i];
                    ref.tainted = true;
                    this.__delegateToUpperScope(ref);
                  }
                } else {
                  for (i = 0, iz = this.left.length; i < iz; ++i) {
                    // notify all names are through to global
                    ref = this.left[i];
                    current = this;
                    do {
                      current.through.push(ref);
                      current = current.upper;
                    } while (current);
                  }
                }
              }

              if (this.type === 'global') {
                implicit = [];
                for (i = 0, iz = this.left.length; i < iz; ++i) {
                  ref = this.left[i];
                  if (
                    ref.__maybeImplicitGlobal &&
                    !this.set.has(ref.identifier.name)
                  ) {
                    implicit.push(ref.__maybeImplicitGlobal);
                  }
                }

                // create an implicit global variable from assignment expression
                for (i = 0, iz = implicit.length; i < iz; ++i) {
                  node = implicit[i];
                  this.__defineImplicit(node.left, {
                    type: Variable.ImplicitGlobalVariable,
                    name: node.left,
                    node: node,
                  });
                }
              }

              this.left = null;
              currentScope = this.upper;
            };

            Scope.prototype.__resolve = function __resolve(ref) {
              var variable, name;
              name = ref.identifier.name;
              if (this.set.has(name)) {
                variable = this.set.get(name);
                variable.references.push(ref);
                variable.stack =
                  variable.stack &&
                  ref.from.variableScope === this.variableScope;
                if (ref.tainted) {
                  variable.tainted = true;
                  this.taints.set(variable.name, true);
                }
                ref.resolved = variable;
                return true;
              }
              return false;
            };

            Scope.prototype.__delegateToUpperScope =
              function __delegateToUpperScope(ref) {
                if (this.upper) {
                  this.upper.left.push(ref);
                }
                this.through.push(ref);
              };

            Scope.prototype.__defineImplicit = function __defineImplicit(
              node,
              info
            ) {
              var name, variable;
              if (node && node.type === Syntax.Identifier) {
                name = node.name;
                if (!this.implicit.set.has(name)) {
                  variable = new Variable(name, this);
                  variable.identifiers.push(node);
                  variable.defs.push(info);
                  this.implicit.set.set(name, variable);
                  this.implicit.variables.push(variable);
                } else {
                  variable = this.implicit.set.get(name);
                  variable.identifiers.push(node);
                  variable.defs.push(info);
                }
              }
            };

            Scope.prototype.__define = function __define(node, info) {
              var name, variable;
              if (node && node.type === Syntax.Identifier) {
                name = node.name;
                if (!this.set.has(name)) {
                  variable = new Variable(name, this);
                  variable.identifiers.push(node);
                  variable.defs.push(info);
                  this.set.set(name, variable);
                  this.variables.push(variable);
                } else {
                  variable = this.set.get(name);
                  variable.identifiers.push(node);
                  variable.defs.push(info);
                }
              }
            };

            Scope.prototype.__referencing = function __referencing(
              node,
              assign,
              writeExpr,
              maybeImplicitGlobal
            ) {
              var ref;
              // because Array element may be null
              if (node && node.type === Syntax.Identifier) {
                ref = new Reference(
                  node,
                  this,
                  assign || Reference.READ,
                  writeExpr,
                  maybeImplicitGlobal
                );
                this.references.push(ref);
                this.left.push(ref);
              }
            };

            Scope.prototype.__detectEval = function __detectEval() {
              var current;
              current = this;
              this.directCallToEvalScope = true;
              do {
                current.dynamic = true;
                current = current.upper;
              } while (current);
            };

            Scope.prototype.__detectThis = function __detectThis() {
              this.thisFound = true;
            };

            Scope.prototype.__isClosed = function isClosed() {
              return this.left === null;
            };

            // API Scope#resolve(name)
            // returns resolved reference
            Scope.prototype.resolve = function resolve(ident) {
              var ref, i, iz;
              assert(this.__isClosed(), 'scope should be closed');
              assert(
                ident.type === Syntax.Identifier,
                'target should be identifier'
              );
              for (i = 0, iz = this.references.length; i < iz; ++i) {
                ref = this.references[i];
                if (ref.identifier === ident) {
                  return ref;
                }
              }
              return null;
            };

            // API Scope#isStatic
            // returns this scope is static
            Scope.prototype.isStatic = function isStatic() {
              return !this.dynamic;
            };

            // API Scope#isArgumentsMaterialized
            // return this scope has materialized arguments
            Scope.prototype.isArgumentsMaterialized =
              function isArgumentsMaterialized() {
                // TODO(Constellation)
                // We can more aggressive on this condition like this.
                //
                // function t() {
                //     // arguments of t is always hidden.
                //     function arguments() {
                //     }
                // }
                var variable;

                // This is not function scope
                if (this.type !== 'function') {
                  return true;
                }

                if (!this.isStatic()) {
                  return true;
                }

                variable = this.set.get('arguments');
                assert(variable, 'always have arguments variable');
                return variable.tainted || variable.references.length !== 0;
              };

            // API Scope#isThisMaterialized
            // return this scope has materialized `this` reference
            Scope.prototype.isThisMaterialized = function isThisMaterialized() {
              // This is not function scope
              if (this.type !== 'function') {
                return true;
              }
              if (!this.isStatic()) {
                return true;
              }
              return this.thisFound;
            };

            Scope.mangledName = '__$escope$__';

            Scope.prototype.attach = function attach() {
              if (!this.functionExpressionScope) {
                this.block[Scope.mangledName] = this;
              }
            };

            Scope.prototype.detach = function detach() {
              if (!this.functionExpressionScope) {
                delete this.block[Scope.mangledName];
              }
            };

            Scope.prototype.isUsedName = function (name) {
              if (this.set.has(name)) {
                return true;
              }
              for (var i = 0, iz = this.through.length; i < iz; ++i) {
                if (this.through[i].identifier.name === name) {
                  return true;
                }
              }
              return false;
            };

            /**
             * @class ScopeManager
             */
            function ScopeManager(scopes) {
              this.scopes = scopes;
              this.attached = false;
            }

            // Returns appropliate scope for this node
            ScopeManager.prototype.__get = function __get(node) {
              var i, iz, scope;
              if (this.attached) {
                return node[Scope.mangledName] || null;
              }
              if (Scope.isScopeRequired(node)) {
                for (i = 0, iz = this.scopes.length; i < iz; ++i) {
                  scope = this.scopes[i];
                  if (!scope.functionExpressionScope) {
                    if (scope.block === node) {
                      return scope;
                    }
                  }
                }
              }
              return null;
            };

            ScopeManager.prototype.acquire = function acquire(node) {
              return this.__get(node);
            };

            ScopeManager.prototype.release = function release(node) {
              var scope = this.__get(node);
              if (scope) {
                scope = scope.upper;
                while (scope) {
                  if (!scope.functionExpressionScope) {
                    return scope;
                  }
                  scope = scope.upper;
                }
              }
              return null;
            };

            ScopeManager.prototype.attach = function attach() {
              var i, iz;
              for (i = 0, iz = this.scopes.length; i < iz; ++i) {
                this.scopes[i].attach();
              }
              this.attached = true;
            };

            ScopeManager.prototype.detach = function detach() {
              var i, iz;
              for (i = 0, iz = this.scopes.length; i < iz; ++i) {
                this.scopes[i].detach();
              }
              this.attached = false;
            };

            Scope.isScopeRequired = function isScopeRequired(node) {
              return (
                Scope.isVariableScopeRequired(node) ||
                node.type === Syntax.WithStatement ||
                node.type === Syntax.CatchClause
              );
            };

            Scope.isVariableScopeRequired = function isVariableScopeRequired(
              node
            ) {
              return (
                node.type === Syntax.Program ||
                node.type === Syntax.FunctionExpression ||
                node.type === Syntax.FunctionDeclaration
              );
            };

            /**
             * Main interface function. Takes an Esprima syntax tree and returns the
             * analyzed scopes.
             * @function analyze
             * @param {esprima.Tree} tree
             * @param {Object} providedOptions - Options that tailor the scope analysis
             * @param {boolean} [providedOptions.optimistic=false] - the optimistic flag
             * @param {boolean} [providedOptions.directive=false]- the directive flag
             * @param {boolean} [providedOptions.ignoreEval=false]- whether to check 'eval()' calls
             * @return {ScopeManager}
             */
            function analyze(tree, providedOptions) {
              var resultScopes;

              options = updateDeeply(defaultOptions(), providedOptions);
              resultScopes = scopes = [];
              currentScope = null;
              globalScope = null;

              // attach scope and collect / resolve names
              estraverse.traverse(tree, {
                enter: function enter(node) {
                  var i, iz, decl;
                  if (Scope.isScopeRequired(node)) {
                    new Scope(node, {});
                  }

                  switch (node.type) {
                    case Syntax.AssignmentExpression:
                      if (node.operator === '=') {
                        currentScope.__referencing(
                          node.left,
                          Reference.WRITE,
                          node.right,
                          !currentScope.isStrict &&
                            node.left.name != null &&
                            node
                        );
                      } else {
                        currentScope.__referencing(
                          node.left,
                          Reference.RW,
                          node.right
                        );
                      }
                      currentScope.__referencing(node.right);
                      break;

                    case Syntax.ArrayExpression:
                      for (i = 0, iz = node.elements.length; i < iz; ++i) {
                        currentScope.__referencing(node.elements[i]);
                      }
                      break;

                    case Syntax.BlockStatement:
                      break;

                    case Syntax.BinaryExpression:
                      currentScope.__referencing(node.left);
                      currentScope.__referencing(node.right);
                      break;

                    case Syntax.BreakStatement:
                      break;

                    case Syntax.CallExpression:
                      currentScope.__referencing(node.callee);
                      for (i = 0, iz = node['arguments'].length; i < iz; ++i) {
                        currentScope.__referencing(node['arguments'][i]);
                      }

                      // check this is direct call to eval
                      if (
                        !options.ignoreEval &&
                        node.callee.type === Syntax.Identifier &&
                        node.callee.name === 'eval'
                      ) {
                        currentScope.variableScope.__detectEval();
                      }
                      break;

                    case Syntax.CatchClause:
                      currentScope.__define(node.param, {
                        type: Variable.CatchClause,
                        name: node.param,
                        node: node,
                      });
                      break;

                    case Syntax.ConditionalExpression:
                      currentScope.__referencing(node.test);
                      currentScope.__referencing(node.consequent);
                      currentScope.__referencing(node.alternate);
                      break;

                    case Syntax.ContinueStatement:
                      break;

                    case Syntax.DirectiveStatement:
                      break;

                    case Syntax.DoWhileStatement:
                      currentScope.__referencing(node.test);
                      break;

                    case Syntax.DebuggerStatement:
                      break;

                    case Syntax.EmptyStatement:
                      break;

                    case Syntax.ExpressionStatement:
                      currentScope.__referencing(node.expression);
                      break;

                    case Syntax.ForStatement:
                      currentScope.__referencing(node.init);
                      currentScope.__referencing(node.test);
                      currentScope.__referencing(node.update);
                      break;

                    case Syntax.ForInStatement:
                      if (node.left.type === Syntax.VariableDeclaration) {
                        currentScope.__referencing(
                          node.left.declarations[0].id,
                          Reference.WRITE,
                          null,
                          false
                        );
                      } else {
                        currentScope.__referencing(
                          node.left,
                          Reference.WRITE,
                          null,
                          !currentScope.isStrict &&
                            node.left.name != null &&
                            node
                        );
                      }
                      currentScope.__referencing(node.right);
                      break;

                    case Syntax.FunctionDeclaration:
                      // FunctionDeclaration name is defined in upper scope
                      currentScope.upper.__define(node.id, {
                        type: Variable.FunctionName,
                        name: node.id,
                        node: node,
                      });
                      for (i = 0, iz = node.params.length; i < iz; ++i) {
                        currentScope.__define(node.params[i], {
                          type: Variable.Parameter,
                          name: node.params[i],
                          node: node,
                          index: i,
                        });
                      }
                      break;

                    case Syntax.FunctionExpression:
                      // id is defined in upper scope
                      for (i = 0, iz = node.params.length; i < iz; ++i) {
                        currentScope.__define(node.params[i], {
                          type: Variable.Parameter,
                          name: node.params[i],
                          node: node,
                          index: i,
                        });
                      }
                      break;

                    case Syntax.Identifier:
                      break;

                    case Syntax.IfStatement:
                      currentScope.__referencing(node.test);
                      break;

                    case Syntax.Literal:
                      break;

                    case Syntax.LabeledStatement:
                      break;

                    case Syntax.LogicalExpression:
                      currentScope.__referencing(node.left);
                      currentScope.__referencing(node.right);
                      break;

                    case Syntax.MemberExpression:
                      currentScope.__referencing(node.object);
                      if (node.computed) {
                        currentScope.__referencing(node.property);
                      }
                      break;

                    case Syntax.NewExpression:
                      currentScope.__referencing(node.callee);
                      for (i = 0, iz = node['arguments'].length; i < iz; ++i) {
                        currentScope.__referencing(node['arguments'][i]);
                      }
                      break;

                    case Syntax.ObjectExpression:
                      break;

                    case Syntax.Program:
                      break;

                    case Syntax.Property:
                      currentScope.__referencing(node.value);
                      break;

                    case Syntax.ReturnStatement:
                      currentScope.__referencing(node.argument);
                      break;

                    case Syntax.SequenceExpression:
                      for (i = 0, iz = node.expressions.length; i < iz; ++i) {
                        currentScope.__referencing(node.expressions[i]);
                      }
                      break;

                    case Syntax.SwitchStatement:
                      currentScope.__referencing(node.discriminant);
                      break;

                    case Syntax.SwitchCase:
                      currentScope.__referencing(node.test);
                      break;

                    case Syntax.ThisExpression:
                      currentScope.variableScope.__detectThis();
                      break;

                    case Syntax.ThrowStatement:
                      currentScope.__referencing(node.argument);
                      break;

                    case Syntax.TryStatement:
                      break;

                    case Syntax.UnaryExpression:
                      currentScope.__referencing(node.argument);
                      break;

                    case Syntax.UpdateExpression:
                      currentScope.__referencing(
                        node.argument,
                        Reference.RW,
                        null
                      );
                      break;

                    case Syntax.VariableDeclaration:
                      for (i = 0, iz = node.declarations.length; i < iz; ++i) {
                        decl = node.declarations[i];
                        currentScope.variableScope.__define(decl.id, {
                          type: Variable.Variable,
                          name: decl.id,
                          node: decl,
                          index: i,
                          parent: node,
                        });
                        if (decl.init) {
                          // initializer is found
                          currentScope.__referencing(
                            decl.id,
                            Reference.WRITE,
                            decl.init,
                            false
                          );
                          currentScope.__referencing(decl.init);
                        }
                      }
                      break;

                    case Syntax.VariableDeclarator:
                      break;

                    case Syntax.WhileStatement:
                      currentScope.__referencing(node.test);
                      break;

                    case Syntax.WithStatement:
                      // WithStatement object is referenced at upper scope
                      currentScope.upper.__referencing(node.object);
                      break;
                  }
                },

                leave: function leave(node) {
                  while (currentScope && node === currentScope.block) {
                    currentScope.__close();
                  }
                },
              });

              assert(currentScope === null);
              globalScope = null;
              scopes = null;
              options = null;

              return new ScopeManager(resultScopes);
            }

            /** @name module:escope.version */
            exports.version = '1.0.1';
            /** @name module:escope.Reference */
            exports.Reference = Reference;
            /** @name module:escope.Variable */
            exports.Variable = Variable;
            /** @name module:escope.Scope */
            exports.Scope = Scope;
            /** @name module:escope.ScopeManager */
            exports.ScopeManager = ScopeManager;
            /** @name module:escope.analyze */
            exports.analyze = analyze;
          }, this);
          /* vim: set sw=4 ts=4 et tw=80 : */
        },
        { estraverse: 2 },
      ],
      2: [
        function (_dereq_, module, exports) {
          /*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
          /*jslint vars:false, bitwise:true*/
          /*jshint indent:4*/
          /*global exports:true, define:true*/
          (function (root, factory) {
            'use strict';

            // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
            // and plain browser loading,
            if (typeof define === 'function' && define.amd) {
              define(['exports'], factory);
            } else if (typeof exports !== 'undefined') {
              factory(exports);
            } else {
              factory((root.estraverse = {}));
            }
          })(this, function (exports) {
            'use strict';

            var Syntax, isArray, VisitorOption, VisitorKeys, BREAK, SKIP;

            Syntax = {
              AssignmentExpression: 'AssignmentExpression',
              ArrayExpression: 'ArrayExpression',
              ArrayPattern: 'ArrayPattern',
              ArrowFunctionExpression: 'ArrowFunctionExpression',
              BlockStatement: 'BlockStatement',
              BinaryExpression: 'BinaryExpression',
              BreakStatement: 'BreakStatement',
              CallExpression: 'CallExpression',
              CatchClause: 'CatchClause',
              ClassBody: 'ClassBody',
              ClassDeclaration: 'ClassDeclaration',
              ClassExpression: 'ClassExpression',
              ConditionalExpression: 'ConditionalExpression',
              ContinueStatement: 'ContinueStatement',
              DebuggerStatement: 'DebuggerStatement',
              DirectiveStatement: 'DirectiveStatement',
              DoWhileStatement: 'DoWhileStatement',
              EmptyStatement: 'EmptyStatement',
              ExpressionStatement: 'ExpressionStatement',
              ForStatement: 'ForStatement',
              ForInStatement: 'ForInStatement',
              FunctionDeclaration: 'FunctionDeclaration',
              FunctionExpression: 'FunctionExpression',
              Identifier: 'Identifier',
              IfStatement: 'IfStatement',
              Literal: 'Literal',
              LabeledStatement: 'LabeledStatement',
              LogicalExpression: 'LogicalExpression',
              MemberExpression: 'MemberExpression',
              MethodDefinition: 'MethodDefinition',
              NewExpression: 'NewExpression',
              ObjectExpression: 'ObjectExpression',
              ObjectPattern: 'ObjectPattern',
              Program: 'Program',
              Property: 'Property',
              ReturnStatement: 'ReturnStatement',
              SequenceExpression: 'SequenceExpression',
              SwitchStatement: 'SwitchStatement',
              SwitchCase: 'SwitchCase',
              ThisExpression: 'ThisExpression',
              ThrowStatement: 'ThrowStatement',
              TryStatement: 'TryStatement',
              UnaryExpression: 'UnaryExpression',
              UpdateExpression: 'UpdateExpression',
              VariableDeclaration: 'VariableDeclaration',
              VariableDeclarator: 'VariableDeclarator',
              WhileStatement: 'WhileStatement',
              WithStatement: 'WithStatement',
              YieldExpression: 'YieldExpression',
            };

            function ignoreJSHintError() {}

            isArray = Array.isArray;
            if (!isArray) {
              isArray = function isArray(array) {
                return (
                  Object.prototype.toString.call(array) === '[object Array]'
                );
              };
            }

            function deepCopy(obj) {
              var ret = {},
                key,
                val;
              for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                  val = obj[key];
                  if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                  } else {
                    ret[key] = val;
                  }
                }
              }
              return ret;
            }

            function shallowCopy(obj) {
              var ret = {},
                key;
              for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                  ret[key] = obj[key];
                }
              }
              return ret;
            }
            ignoreJSHintError(shallowCopy);

            // based on LLVM libc++ upper_bound / lower_bound
            // MIT License

            function upperBound(array, func) {
              var diff, len, i, current;

              len = array.length;
              i = 0;

              while (len) {
                diff = len >>> 1;
                current = i + diff;
                if (func(array[current])) {
                  len = diff;
                } else {
                  i = current + 1;
                  len -= diff + 1;
                }
              }
              return i;
            }

            function lowerBound(array, func) {
              var diff, len, i, current;

              len = array.length;
              i = 0;

              while (len) {
                diff = len >>> 1;
                current = i + diff;
                if (func(array[current])) {
                  i = current + 1;
                  len -= diff + 1;
                } else {
                  len = diff;
                }
              }
              return i;
            }
            ignoreJSHintError(lowerBound);

            VisitorKeys = {
              AssignmentExpression: ['left', 'right'],
              ArrayExpression: ['elements'],
              ArrayPattern: ['elements'],
              ArrowFunctionExpression: ['params', 'defaults', 'rest', 'body'],
              BlockStatement: ['body'],
              BinaryExpression: ['left', 'right'],
              BreakStatement: ['label'],
              CallExpression: ['callee', 'arguments'],
              CatchClause: ['param', 'body'],
              ClassBody: ['body'],
              ClassDeclaration: ['id', 'body', 'superClass'],
              ClassExpression: ['id', 'body', 'superClass'],
              ConditionalExpression: ['test', 'consequent', 'alternate'],
              ContinueStatement: ['label'],
              DebuggerStatement: [],
              DirectiveStatement: [],
              DoWhileStatement: ['body', 'test'],
              EmptyStatement: [],
              ExpressionStatement: ['expression'],
              ForStatement: ['init', 'test', 'update', 'body'],
              ForInStatement: ['left', 'right', 'body'],
              ForOfStatement: ['left', 'right', 'body'],
              FunctionDeclaration: ['id', 'params', 'defaults', 'rest', 'body'],
              FunctionExpression: ['id', 'params', 'defaults', 'rest', 'body'],
              Identifier: [],
              IfStatement: ['test', 'consequent', 'alternate'],
              Literal: [],
              LabeledStatement: ['label', 'body'],
              LogicalExpression: ['left', 'right'],
              MemberExpression: ['object', 'property'],
              MethodDefinition: ['key', 'value'],
              NewExpression: ['callee', 'arguments'],
              ObjectExpression: ['properties'],
              ObjectPattern: ['properties'],
              Program: ['body'],
              Property: ['key', 'value'],
              ReturnStatement: ['argument'],
              SequenceExpression: ['expressions'],
              SwitchStatement: ['discriminant', 'cases'],
              SwitchCase: ['test', 'consequent'],
              ThisExpression: [],
              ThrowStatement: ['argument'],
              TryStatement: [
                'block',
                'handlers',
                'handler',
                'guardedHandlers',
                'finalizer',
              ],
              UnaryExpression: ['argument'],
              UpdateExpression: ['argument'],
              VariableDeclaration: ['declarations'],
              VariableDeclarator: ['id', 'init'],
              WhileStatement: ['test', 'body'],
              WithStatement: ['object', 'body'],
              YieldExpression: ['argument'],
            };

            // unique id
            BREAK = {};
            SKIP = {};

            VisitorOption = {
              Break: BREAK,
              Skip: SKIP,
            };

            function Reference(parent, key) {
              this.parent = parent;
              this.key = key;
            }

            Reference.prototype.replace = function replace(node) {
              this.parent[this.key] = node;
            };

            function Element(node, path, wrap, ref) {
              this.node = node;
              this.path = path;
              this.wrap = wrap;
              this.ref = ref;
            }

            function Controller() {}

            // API:
            // return property path array from root to current node
            Controller.prototype.path = function path() {
              var i, iz, j, jz, result, element;

              function addToPath(result, path) {
                if (isArray(path)) {
                  for (j = 0, jz = path.length; j < jz; ++j) {
                    result.push(path[j]);
                  }
                } else {
                  result.push(path);
                }
              }

              // root node
              if (!this.__current.path) {
                return null;
              }

              // first node is sentinel, second node is root element
              result = [];
              for (i = 2, iz = this.__leavelist.length; i < iz; ++i) {
                element = this.__leavelist[i];
                addToPath(result, element.path);
              }
              addToPath(result, this.__current.path);
              return result;
            };

            // API:
            // return array of parent elements
            Controller.prototype.parents = function parents() {
              var i, iz, result;

              // first node is sentinel
              result = [];
              for (i = 1, iz = this.__leavelist.length; i < iz; ++i) {
                result.push(this.__leavelist[i].node);
              }

              return result;
            };

            // API:
            // return current node
            Controller.prototype.current = function current() {
              return this.__current.node;
            };

            Controller.prototype.__execute = function __execute(
              callback,
              element
            ) {
              var previous, result;

              result = undefined;

              previous = this.__current;
              this.__current = element;
              this.__state = null;
              if (callback) {
                result = callback.call(
                  this,
                  element.node,
                  this.__leavelist[this.__leavelist.length - 1].node
                );
              }
              this.__current = previous;

              return result;
            };

            // API:
            // notify control skip / break
            Controller.prototype.notify = function notify(flag) {
              this.__state = flag;
            };

            // API:
            // skip child nodes of current node
            Controller.prototype.skip = function () {
              this.notify(SKIP);
            };

            // API:
            // break traversals
            Controller.prototype['break'] = function () {
              this.notify(BREAK);
            };

            Controller.prototype.__initialize = function (root, visitor) {
              this.visitor = visitor;
              this.root = root;
              this.__worklist = [];
              this.__leavelist = [];
              this.__current = null;
              this.__state = null;
            };

            Controller.prototype.traverse = function traverse(root, visitor) {
              var worklist,
                leavelist,
                element,
                node,
                nodeType,
                ret,
                key,
                current,
                current2,
                candidates,
                candidate,
                sentinel;

              this.__initialize(root, visitor);

              sentinel = {};

              // reference
              worklist = this.__worklist;
              leavelist = this.__leavelist;

              // initialize
              worklist.push(new Element(root, null, null, null));
              leavelist.push(new Element(null, null, null, null));

              while (worklist.length) {
                element = worklist.pop();

                if (element === sentinel) {
                  element = leavelist.pop();

                  ret = this.__execute(visitor.leave, element);

                  if (this.__state === BREAK || ret === BREAK) {
                    return;
                  }
                  continue;
                }

                if (element.node) {
                  ret = this.__execute(visitor.enter, element);

                  if (this.__state === BREAK || ret === BREAK) {
                    return;
                  }

                  worklist.push(sentinel);
                  leavelist.push(element);

                  if (this.__state === SKIP || ret === SKIP) {
                    continue;
                  }

                  node = element.node;
                  nodeType = element.wrap || node.type;
                  candidates = VisitorKeys[nodeType];

                  current = candidates.length;
                  while ((current -= 1) >= 0) {
                    key = candidates[current];
                    candidate = node[key];
                    if (!candidate) {
                      continue;
                    }

                    if (!isArray(candidate)) {
                      worklist.push(new Element(candidate, key, null, null));
                      continue;
                    }

                    current2 = candidate.length;
                    while ((current2 -= 1) >= 0) {
                      if (!candidate[current2]) {
                        continue;
                      }
                      if (
                        (nodeType === Syntax.ObjectExpression ||
                          nodeType === Syntax.ObjectPattern) &&
                        'properties' === candidates[current]
                      ) {
                        element = new Element(
                          candidate[current2],
                          [key, current2],
                          'Property',
                          null
                        );
                      } else {
                        element = new Element(
                          candidate[current2],
                          [key, current2],
                          null,
                          null
                        );
                      }
                      worklist.push(element);
                    }
                  }
                }
              }
            };

            Controller.prototype.replace = function replace(root, visitor) {
              var worklist,
                leavelist,
                node,
                nodeType,
                target,
                element,
                current,
                current2,
                candidates,
                candidate,
                sentinel,
                outer,
                key;

              this.__initialize(root, visitor);

              sentinel = {};

              // reference
              worklist = this.__worklist;
              leavelist = this.__leavelist;

              // initialize
              outer = {
                root: root,
              };
              element = new Element(
                root,
                null,
                null,
                new Reference(outer, 'root')
              );
              worklist.push(element);
              leavelist.push(element);

              while (worklist.length) {
                element = worklist.pop();

                if (element === sentinel) {
                  element = leavelist.pop();

                  target = this.__execute(visitor.leave, element);

                  // node may be replaced with null,
                  // so distinguish between undefined and null in this place
                  if (
                    target !== undefined &&
                    target !== BREAK &&
                    target !== SKIP
                  ) {
                    // replace
                    element.ref.replace(target);
                  }

                  if (this.__state === BREAK || target === BREAK) {
                    return outer.root;
                  }
                  continue;
                }

                target = this.__execute(visitor.enter, element);

                // node may be replaced with null,
                // so distinguish between undefined and null in this place
                if (
                  target !== undefined &&
                  target !== BREAK &&
                  target !== SKIP
                ) {
                  // replace
                  element.ref.replace(target);
                  element.node = target;
                }

                if (this.__state === BREAK || target === BREAK) {
                  return outer.root;
                }

                // node may be null
                node = element.node;
                if (!node) {
                  continue;
                }

                worklist.push(sentinel);
                leavelist.push(element);

                if (this.__state === SKIP || target === SKIP) {
                  continue;
                }

                nodeType = element.wrap || node.type;
                candidates = VisitorKeys[nodeType];

                current = candidates.length;
                while ((current -= 1) >= 0) {
                  key = candidates[current];
                  candidate = node[key];
                  if (!candidate) {
                    continue;
                  }

                  if (!isArray(candidate)) {
                    worklist.push(
                      new Element(
                        candidate,
                        key,
                        null,
                        new Reference(node, key)
                      )
                    );
                    continue;
                  }

                  current2 = candidate.length;
                  while ((current2 -= 1) >= 0) {
                    if (!candidate[current2]) {
                      continue;
                    }
                    if (
                      nodeType === Syntax.ObjectExpression &&
                      'properties' === candidates[current]
                    ) {
                      element = new Element(
                        candidate[current2],
                        [key, current2],
                        'Property',
                        new Reference(candidate, current2)
                      );
                    } else {
                      element = new Element(
                        candidate[current2],
                        [key, current2],
                        null,
                        new Reference(candidate, current2)
                      );
                    }
                    worklist.push(element);
                  }
                }
              }

              return outer.root;
            };

            function traverse(root, visitor) {
              var controller = new Controller();
              return controller.traverse(root, visitor);
            }

            function replace(root, visitor) {
              var controller = new Controller();
              return controller.replace(root, visitor);
            }

            function extendCommentRange(comment, tokens) {
              var target;

              target = upperBound(tokens, function search(token) {
                return token.range[0] > comment.range[0];
              });

              comment.extendedRange = [comment.range[0], comment.range[1]];

              if (target !== tokens.length) {
                comment.extendedRange[1] = tokens[target].range[0];
              }

              target -= 1;
              if (target >= 0) {
                comment.extendedRange[0] = tokens[target].range[1];
              }

              return comment;
            }

            function attachComments(tree, providedComments, tokens) {
              // At first, we should calculate extended comment ranges.
              var comments = [],
                comment,
                len,
                i,
                cursor;

              if (!tree.range) {
                throw new Error('attachComments needs range information');
              }

              // tokens array is empty, we attach comments to tree as 'leadingComments'
              if (!tokens.length) {
                if (providedComments.length) {
                  for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                  }
                  tree.leadingComments = comments;
                }
                return tree;
              }

              for (i = 0, len = providedComments.length; i < len; i += 1) {
                comments.push(
                  extendCommentRange(deepCopy(providedComments[i]), tokens)
                );
              }

              // This is based on John Freeman's implementation.
              cursor = 0;
              traverse(tree, {
                enter: function (node) {
                  var comment;

                  while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                      break;
                    }

                    if (comment.extendedRange[1] === node.range[0]) {
                      if (!node.leadingComments) {
                        node.leadingComments = [];
                      }
                      node.leadingComments.push(comment);
                      comments.splice(cursor, 1);
                    } else {
                      cursor += 1;
                    }
                  }

                  // already out of owned node
                  if (cursor === comments.length) {
                    return VisitorOption.Break;
                  }

                  if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                  }
                },
              });

              cursor = 0;
              traverse(tree, {
                leave: function (node) {
                  var comment;

                  while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                      break;
                    }

                    if (node.range[1] === comment.extendedRange[0]) {
                      if (!node.trailingComments) {
                        node.trailingComments = [];
                      }
                      node.trailingComments.push(comment);
                      comments.splice(cursor, 1);
                    } else {
                      cursor += 1;
                    }
                  }

                  // already out of owned node
                  if (cursor === comments.length) {
                    return VisitorOption.Break;
                  }

                  if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                  }
                },
              });

              return tree;
            }

            exports.version = '1.5.1-dev';
            exports.Syntax = Syntax;
            exports.traverse = traverse;
            exports.replace = replace;
            exports.attachComments = attachComments;
            exports.VisitorKeys = VisitorKeys;
            exports.VisitorOption = VisitorOption;
            exports.Controller = Controller;
          });
          /* vim: set sw=4 ts=4 et tw=80 : */
        },
        {},
      ],
      3: [
        function (_dereq_, module, exports) {
          /*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

          /*jslint bitwise:true plusplus:true */
          /*global esprima:true, define:true, exports:true, window: true,
throwError: true, createLiteral: true, generateStatement: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseLeftHandSideExpression: true,
parseStatement: true, parseSourceElement: true */

          (function (root, factory) {
            'use strict';

            // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
            // Rhino, and plain browser loading.
            if (typeof define === 'function' && define.amd) {
              define(['exports'], factory);
            } else if (typeof exports !== 'undefined') {
              factory(exports);
            } else {
              factory((root.esprima = {}));
            }
          })(this, function (exports) {
            'use strict';

            var Token,
              TokenName,
              Syntax,
              PropertyKind,
              Messages,
              Regex,
              source,
              strict,
              index,
              lineNumber,
              lineStart,
              length,
              buffer,
              state,
              extra;

            Token = {
              BooleanLiteral: 1,
              EOF: 2,
              Identifier: 3,
              Keyword: 4,
              NullLiteral: 5,
              NumericLiteral: 6,
              Punctuator: 7,
              StringLiteral: 8,
            };

            TokenName = {};
            TokenName[Token.BooleanLiteral] = 'Boolean';
            TokenName[Token.EOF] = '<end>';
            TokenName[Token.Identifier] = 'Identifier';
            TokenName[Token.Keyword] = 'Keyword';
            TokenName[Token.NullLiteral] = 'Null';
            TokenName[Token.NumericLiteral] = 'Numeric';
            TokenName[Token.Punctuator] = 'Punctuator';
            TokenName[Token.StringLiteral] = 'String';

            Syntax = {
              AssignmentExpression: 'AssignmentExpression',
              ArrayExpression: 'ArrayExpression',
              BlockStatement: 'BlockStatement',
              BinaryExpression: 'BinaryExpression',
              BreakStatement: 'BreakStatement',
              CallExpression: 'CallExpression',
              CatchClause: 'CatchClause',
              ConditionalExpression: 'ConditionalExpression',
              ContinueStatement: 'ContinueStatement',
              DoWhileStatement: 'DoWhileStatement',
              DebuggerStatement: 'DebuggerStatement',
              EmptyStatement: 'EmptyStatement',
              ExpressionStatement: 'ExpressionStatement',
              ForStatement: 'ForStatement',
              ForInStatement: 'ForInStatement',
              FunctionDeclaration: 'FunctionDeclaration',
              FunctionExpression: 'FunctionExpression',
              Identifier: 'Identifier',
              IfStatement: 'IfStatement',
              Literal: 'Literal',
              LabeledStatement: 'LabeledStatement',
              LogicalExpression: 'LogicalExpression',
              MemberExpression: 'MemberExpression',
              NewExpression: 'NewExpression',
              ObjectExpression: 'ObjectExpression',
              Program: 'Program',
              Property: 'Property',
              ReturnStatement: 'ReturnStatement',
              SequenceExpression: 'SequenceExpression',
              SwitchStatement: 'SwitchStatement',
              SwitchCase: 'SwitchCase',
              ThisExpression: 'ThisExpression',
              ThrowStatement: 'ThrowStatement',
              TryStatement: 'TryStatement',
              UnaryExpression: 'UnaryExpression',
              UpdateExpression: 'UpdateExpression',
              VariableDeclaration: 'VariableDeclaration',
              VariableDeclarator: 'VariableDeclarator',
              WhileStatement: 'WhileStatement',
              WithStatement: 'WithStatement',
            };

            PropertyKind = {
              Data: 1,
              Get: 2,
              Set: 4,
            };

            // Error messages should be identical to V8.
            Messages = {
              UnexpectedToken: 'Unexpected token %0',
              UnexpectedNumber: 'Unexpected number',
              UnexpectedString: 'Unexpected string',
              UnexpectedIdentifier: 'Unexpected identifier',
              UnexpectedReserved: 'Unexpected reserved word',
              UnexpectedEOS: 'Unexpected end of input',
              NewlineAfterThrow: 'Illegal newline after throw',
              InvalidRegExp: 'Invalid regular expression',
              UnterminatedRegExp: 'Invalid regular expression: missing /',
              InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
              InvalidLHSInForIn: 'Invalid left-hand side in for-in',
              MultipleDefaultsInSwitch:
                'More than one default clause in switch statement',
              NoCatchOrFinally: 'Missing catch or finally after try',
              UnknownLabel: "Undefined label '%0'",
              Redeclaration: "%0 '%1' has already been declared",
              IllegalContinue: 'Illegal continue statement',
              IllegalBreak: 'Illegal break statement',
              IllegalReturn: 'Illegal return statement',
              StrictModeWith:
                'Strict mode code may not include a with statement',
              StrictCatchVariable:
                'Catch variable may not be eval or arguments in strict mode',
              StrictVarName:
                'Variable name may not be eval or arguments in strict mode',
              StrictParamName:
                'Parameter name eval or arguments is not allowed in strict mode',
              StrictParamDupe:
                'Strict mode function may not have duplicate parameter names',
              StrictFunctionName:
                'Function name may not be eval or arguments in strict mode',
              StrictOctalLiteral:
                'Octal literals are not allowed in strict mode.',
              StrictDelete:
                'Delete of an unqualified identifier in strict mode.',
              StrictDuplicateProperty:
                'Duplicate data property in object literal not allowed in strict mode',
              AccessorDataProperty:
                'Object literal may not have data and accessor property with the same name',
              AccessorGetSet:
                'Object literal may not have multiple get/set accessors with the same name',
              StrictLHSAssignment:
                'Assignment to eval or arguments is not allowed in strict mode',
              StrictLHSPostfix:
                'Postfix increment/decrement may not have eval or arguments operand in strict mode',
              StrictLHSPrefix:
                'Prefix increment/decrement may not have eval or arguments operand in strict mode',
              StrictReservedWord: 'Use of future reserved word in strict mode',
            };

            // See also tools/generate-unicode-regex.py.
            Regex = {
              NonAsciiIdentifierStart: new RegExp(
                '[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'
              ),
              NonAsciiIdentifierPart: new RegExp(
                '[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]'
              ),
            };

            // Ensure the condition is true, otherwise throw an error.
            // This is only to have a better contract semantic, i.e. another safety net
            // to catch a logic error. The condition shall be fulfilled in normal case.
            // Do NOT use this to enforce a certain condition on any user input.

            function assert(condition, message) {
              if (!condition) {
                throw new Error('ASSERT: ' + message);
              }
            }

            function sliceSource(from, to) {
              return source.slice(from, to);
            }

            if (typeof 'esprima'[0] === 'undefined') {
              sliceSource = function sliceArraySource(from, to) {
                return source.slice(from, to).join('');
              };
            }

            function isDecimalDigit(ch) {
              return '0123456789'.indexOf(ch) >= 0;
            }

            function isHexDigit(ch) {
              return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
            }

            function isOctalDigit(ch) {
              return '01234567'.indexOf(ch) >= 0;
            }

            // 7.2 White Space

            function isWhiteSpace(ch) {
              return (
                ch === ' ' ||
                ch === '\u0009' ||
                ch === '\u000B' ||
                ch === '\u000C' ||
                ch === '\u00A0' ||
                (ch.charCodeAt(0) >= 0x1680 &&
                  '\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFF'.indexOf(
                    ch
                  ) >= 0)
              );
            }

            // 7.3 Line Terminators

            function isLineTerminator(ch) {
              return (
                ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029'
              );
            }

            // 7.6 Identifier Names and Identifiers

            function isIdentifierStart(ch) {
              return (
                ch === '$' ||
                ch === '_' ||
                ch === '\\' ||
                (ch >= 'a' && ch <= 'z') ||
                (ch >= 'A' && ch <= 'Z') ||
                (ch.charCodeAt(0) >= 0x80 &&
                  Regex.NonAsciiIdentifierStart.test(ch))
              );
            }

            function isIdentifierPart(ch) {
              return (
                ch === '$' ||
                ch === '_' ||
                ch === '\\' ||
                (ch >= 'a' && ch <= 'z') ||
                (ch >= 'A' && ch <= 'Z') ||
                (ch >= '0' && ch <= '9') ||
                (ch.charCodeAt(0) >= 0x80 &&
                  Regex.NonAsciiIdentifierPart.test(ch))
              );
            }

            // 7.6.1.2 Future Reserved Words

            function isFutureReservedWord(id) {
              switch (id) {
                // Future reserved words.
                case 'class':
                case 'enum':
                case 'export':
                case 'extends':
                case 'import':
                case 'super':
                  return true;
              }

              return false;
            }

            function isStrictModeReservedWord(id) {
              switch (id) {
                // Strict Mode reserved words.
                case 'implements':
                case 'interface':
                case 'package':
                case 'private':
                case 'protected':
                case 'public':
                case 'static':
                case 'yield':
                case 'let':
                  return true;
              }

              return false;
            }

            function isRestrictedWord(id) {
              return id === 'eval' || id === 'arguments';
            }

            // 7.6.1.1 Keywords

            function isKeyword(id) {
              var keyword = false;
              switch (id.length) {
                case 2:
                  keyword = id === 'if' || id === 'in' || id === 'do';
                  break;
                case 3:
                  keyword =
                    id === 'var' ||
                    id === 'for' ||
                    id === 'new' ||
                    id === 'try';
                  break;
                case 4:
                  keyword =
                    id === 'this' ||
                    id === 'else' ||
                    id === 'case' ||
                    id === 'void' ||
                    id === 'with';
                  break;
                case 5:
                  keyword =
                    id === 'while' ||
                    id === 'break' ||
                    id === 'catch' ||
                    id === 'throw';
                  break;
                case 6:
                  keyword =
                    id === 'return' ||
                    id === 'typeof' ||
                    id === 'delete' ||
                    id === 'switch';
                  break;
                case 7:
                  keyword = id === 'default' || id === 'finally';
                  break;
                case 8:
                  keyword =
                    id === 'function' || id === 'continue' || id === 'debugger';
                  break;
                case 10:
                  keyword = id === 'instanceof';
                  break;
              }

              if (keyword) {
                return true;
              }

              switch (id) {
                // Future reserved words.
                // 'const' is specialized as Keyword in V8.
                case 'const':
                  return true;

                // For compatiblity to SpiderMonkey and ES.next
                case 'yield':
                case 'let':
                  return true;
              }

              if (strict && isStrictModeReservedWord(id)) {
                return true;
              }

              return isFutureReservedWord(id);
            }

            // 7.4 Comments

            function skipComment() {
              var ch, blockComment, lineComment;

              blockComment = false;
              lineComment = false;

              while (index < length) {
                ch = source[index];

                if (lineComment) {
                  ch = source[index++];
                  if (isLineTerminator(ch)) {
                    lineComment = false;
                    if (ch === '\r' && source[index] === '\n') {
                      ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                  }
                } else if (blockComment) {
                  if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                      ++index;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  } else {
                    ch = source[index++];
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    if (ch === '*') {
                      ch = source[index];
                      if (ch === '/') {
                        ++index;
                        blockComment = false;
                      }
                    }
                  }
                } else if (ch === '/') {
                  ch = source[index + 1];
                  if (ch === '/') {
                    index += 2;
                    lineComment = true;
                  } else if (ch === '*') {
                    index += 2;
                    blockComment = true;
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  } else {
                    break;
                  }
                } else if (isWhiteSpace(ch)) {
                  ++index;
                } else if (isLineTerminator(ch)) {
                  ++index;
                  if (ch === '\r' && source[index] === '\n') {
                    ++index;
                  }
                  ++lineNumber;
                  lineStart = index;
                } else {
                  break;
                }
              }
            }

            function scanHexEscape(prefix) {
              var i,
                len,
                ch,
                code = 0;

              len = prefix === 'u' ? 4 : 2;
              for (i = 0; i < len; ++i) {
                if (index < length && isHexDigit(source[index])) {
                  ch = source[index++];
                  code =
                    code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
                } else {
                  return '';
                }
              }
              return String.fromCharCode(code);
            }

            function scanIdentifier() {
              var ch, start, id, restore;

              ch = source[index];
              if (!isIdentifierStart(ch)) {
                return;
              }

              start = index;
              if (ch === '\\') {
                ++index;
                if (source[index] !== 'u') {
                  return;
                }
                ++index;
                restore = index;
                ch = scanHexEscape('u');
                if (ch) {
                  if (ch === '\\' || !isIdentifierStart(ch)) {
                    return;
                  }
                  id = ch;
                } else {
                  index = restore;
                  id = 'u';
                }
              } else {
                id = source[index++];
              }

              while (index < length) {
                ch = source[index];
                if (!isIdentifierPart(ch)) {
                  break;
                }
                if (ch === '\\') {
                  ++index;
                  if (source[index] !== 'u') {
                    return;
                  }
                  ++index;
                  restore = index;
                  ch = scanHexEscape('u');
                  if (ch) {
                    if (ch === '\\' || !isIdentifierPart(ch)) {
                      return;
                    }
                    id += ch;
                  } else {
                    index = restore;
                    id += 'u';
                  }
                } else {
                  id += source[index++];
                }
              }

              // There is no keyword or literal with only one character.
              // Thus, it must be an identifier.
              if (id.length === 1) {
                return {
                  type: Token.Identifier,
                  value: id,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              if (isKeyword(id)) {
                return {
                  type: Token.Keyword,
                  value: id,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              // 7.8.1 Null Literals

              if (id === 'null') {
                return {
                  type: Token.NullLiteral,
                  value: id,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              // 7.8.2 Boolean Literals

              if (id === 'true' || id === 'false') {
                return {
                  type: Token.BooleanLiteral,
                  value: id,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              return {
                type: Token.Identifier,
                value: id,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index],
              };
            }

            // 7.7 Punctuators

            function scanPunctuator() {
              var start = index,
                ch1 = source[index],
                ch2,
                ch3,
                ch4;

              // Check for most common single-character punctuators.

              if (ch1 === ';' || ch1 === '{' || ch1 === '}') {
                ++index;
                return {
                  type: Token.Punctuator,
                  value: ch1,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              if (ch1 === ',' || ch1 === '(' || ch1 === ')') {
                ++index;
                return {
                  type: Token.Punctuator,
                  value: ch1,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              // Dot (.) can also start a floating-point number, hence the need
              // to check the next character.

              ch2 = source[index + 1];
              if (ch1 === '.' && !isDecimalDigit(ch2)) {
                return {
                  type: Token.Punctuator,
                  value: source[index++],
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              // Peek more characters.

              ch3 = source[index + 2];
              ch4 = source[index + 3];

              // 4-character punctuator: >>>=

              if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
                if (ch4 === '=') {
                  index += 4;
                  return {
                    type: Token.Punctuator,
                    value: '>>>=',
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index],
                  };
                }
              }

              // 3-character punctuators: === !== >>> <<= >>=

              if (ch1 === '=' && ch2 === '=' && ch3 === '=') {
                index += 3;
                return {
                  type: Token.Punctuator,
                  value: '===',
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              if (ch1 === '!' && ch2 === '=' && ch3 === '=') {
                index += 3;
                return {
                  type: Token.Punctuator,
                  value: '!==',
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
                index += 3;
                return {
                  type: Token.Punctuator,
                  value: '>>>',
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
                index += 3;
                return {
                  type: Token.Punctuator,
                  value: '<<=',
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
                index += 3;
                return {
                  type: Token.Punctuator,
                  value: '>>=',
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }

              // 2-character punctuators: <= >= == != ++ -- << >> && ||
              // += -= *= %= &= |= ^= /=

              if (ch2 === '=') {
                if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
                  index += 2;
                  return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index],
                  };
                }
              }

              if (ch1 === ch2 && '+-<>&|'.indexOf(ch1) >= 0) {
                if ('+-<>&|'.indexOf(ch2) >= 0) {
                  index += 2;
                  return {
                    type: Token.Punctuator,
                    value: ch1 + ch2,
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    range: [start, index],
                  };
                }
              }

              // The remaining 1-character punctuators.

              if ('[]<>+-*%&|^!~?:=/'.indexOf(ch1) >= 0) {
                return {
                  type: Token.Punctuator,
                  value: source[index++],
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [start, index],
                };
              }
            }

            // 7.8.3 Numeric Literals

            function scanNumericLiteral() {
              var number, start, ch;

              ch = source[index];
              assert(
                isDecimalDigit(ch) || ch === '.',
                'Numeric literal must start with a decimal digit or a decimal point'
              );

              start = index;
              number = '';
              if (ch !== '.') {
                number = source[index++];
                ch = source[index];

                // Hex number starts with '0x'.
                // Octal number starts with '0'.
                if (number === '0') {
                  if (ch === 'x' || ch === 'X') {
                    number += source[index++];
                    while (index < length) {
                      ch = source[index];
                      if (!isHexDigit(ch)) {
                        break;
                      }
                      number += source[index++];
                    }

                    if (number.length <= 2) {
                      // only 0x
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }

                    if (index < length) {
                      ch = source[index];
                      if (isIdentifierStart(ch)) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                      }
                    }
                    return {
                      type: Token.NumericLiteral,
                      value: parseInt(number, 16),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      range: [start, index],
                    };
                  } else if (isOctalDigit(ch)) {
                    number += source[index++];
                    while (index < length) {
                      ch = source[index];
                      if (!isOctalDigit(ch)) {
                        break;
                      }
                      number += source[index++];
                    }

                    if (index < length) {
                      ch = source[index];
                      if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                      }
                    }
                    return {
                      type: Token.NumericLiteral,
                      value: parseInt(number, 8),
                      octal: true,
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      range: [start, index],
                    };
                  }

                  // decimal number starts with '0' such as '09' is illegal.
                  if (isDecimalDigit(ch)) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                  }
                }

                while (index < length) {
                  ch = source[index];
                  if (!isDecimalDigit(ch)) {
                    break;
                  }
                  number += source[index++];
                }
              }

              if (ch === '.') {
                number += source[index++];
                while (index < length) {
                  ch = source[index];
                  if (!isDecimalDigit(ch)) {
                    break;
                  }
                  number += source[index++];
                }
              }

              if (ch === 'e' || ch === 'E') {
                number += source[index++];

                ch = source[index];
                if (ch === '+' || ch === '-') {
                  number += source[index++];
                }

                ch = source[index];
                if (isDecimalDigit(ch)) {
                  number += source[index++];
                  while (index < length) {
                    ch = source[index];
                    if (!isDecimalDigit(ch)) {
                      break;
                    }
                    number += source[index++];
                  }
                } else {
                  ch = 'character ' + ch;
                  if (index >= length) {
                    ch = '<end>';
                  }
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
              }

              if (index < length) {
                ch = source[index];
                if (isIdentifierStart(ch)) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
              }

              return {
                type: Token.NumericLiteral,
                value: parseFloat(number),
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index],
              };
            }

            // 7.8.4 String Literals

            function scanStringLiteral() {
              var str = '',
                quote,
                start,
                ch,
                code,
                unescaped,
                restore,
                octal = false;

              quote = source[index];
              assert(
                quote === "'" || quote === '"',
                'String literal must starts with a quote'
              );

              start = index;
              ++index;

              while (index < length) {
                ch = source[index++];

                if (ch === quote) {
                  quote = '';
                  break;
                } else if (ch === '\\') {
                  ch = source[index++];
                  if (!isLineTerminator(ch)) {
                    switch (ch) {
                      case 'n':
                        str += '\n';
                        break;
                      case 'r':
                        str += '\r';
                        break;
                      case 't':
                        str += '\t';
                        break;
                      case 'u':
                      case 'x':
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                          str += unescaped;
                        } else {
                          index = restore;
                          str += ch;
                        }
                        break;
                      case 'b':
                        str += '\b';
                        break;
                      case 'f':
                        str += '\f';
                        break;
                      case 'v':
                        str += '\x0B';
                        break;

                      default:
                        if (isOctalDigit(ch)) {
                          code = '01234567'.indexOf(ch);

                          // \0 is not octal escape sequence
                          if (code !== 0) {
                            octal = true;
                          }

                          if (index < length && isOctalDigit(source[index])) {
                            octal = true;
                            code =
                              code * 8 + '01234567'.indexOf(source[index++]);

                            // 3 digits are only allowed when string starts
                            // with 0, 1, 2, 3
                            if (
                              '0123'.indexOf(ch) >= 0 &&
                              index < length &&
                              isOctalDigit(source[index])
                            ) {
                              code =
                                code * 8 + '01234567'.indexOf(source[index++]);
                            }
                          }
                          str += String.fromCharCode(code);
                        } else {
                          str += ch;
                        }
                        break;
                    }
                  } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                      ++index;
                    }
                  }
                } else if (isLineTerminator(ch)) {
                  break;
                } else {
                  str += ch;
                }
              }

              if (quote !== '') {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }

              return {
                type: Token.StringLiteral,
                value: str,
                octal: octal,
                lineNumber: lineNumber,
                lineStart: lineStart,
                range: [start, index],
              };
            }

            function scanRegExp() {
              var str,
                ch,
                start,
                pattern,
                flags,
                value,
                classMarker = false,
                restore,
                terminated = false;

              buffer = null;
              skipComment();

              start = index;
              ch = source[index];
              assert(
                ch === '/',
                'Regular expression literal must start with a slash'
              );
              str = source[index++];

              while (index < length) {
                ch = source[index++];
                str += ch;
                if (ch === '\\') {
                  ch = source[index++];
                  // ECMA-262 7.8.5
                  if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                  }
                  str += ch;
                } else if (classMarker) {
                  if (ch === ']') {
                    classMarker = false;
                  }
                } else {
                  if (ch === '/') {
                    terminated = true;
                    break;
                  } else if (ch === '[') {
                    classMarker = true;
                  } else if (isLineTerminator(ch)) {
                    throwError({}, Messages.UnterminatedRegExp);
                  }
                }
              }

              if (!terminated) {
                throwError({}, Messages.UnterminatedRegExp);
              }

              // Exclude leading and trailing slash.
              pattern = str.substr(1, str.length - 2);

              flags = '';
              while (index < length) {
                ch = source[index];
                if (!isIdentifierPart(ch)) {
                  break;
                }

                ++index;
                if (ch === '\\' && index < length) {
                  ch = source[index];
                  if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                      flags += ch;
                      str += '\\u';
                      for (; restore < index; ++restore) {
                        str += source[restore];
                      }
                    } else {
                      index = restore;
                      flags += 'u';
                      str += '\\u';
                    }
                  } else {
                    str += '\\';
                  }
                } else {
                  flags += ch;
                  str += ch;
                }
              }

              try {
                value = new RegExp(pattern, flags);
              } catch (e) {
                throwError({}, Messages.InvalidRegExp);
              }

              return {
                literal: str,
                value: value,
                range: [start, index],
              };
            }

            function isIdentifierName(token) {
              return (
                token.type === Token.Identifier ||
                token.type === Token.Keyword ||
                token.type === Token.BooleanLiteral ||
                token.type === Token.NullLiteral
              );
            }

            function advance() {
              var ch, token;

              skipComment();

              if (index >= length) {
                return {
                  type: Token.EOF,
                  lineNumber: lineNumber,
                  lineStart: lineStart,
                  range: [index, index],
                };
              }

              token = scanPunctuator();
              if (typeof token !== 'undefined') {
                return token;
              }

              ch = source[index];

              if (ch === "'" || ch === '"') {
                return scanStringLiteral();
              }

              if (ch === '.' || isDecimalDigit(ch)) {
                return scanNumericLiteral();
              }

              token = scanIdentifier();
              if (typeof token !== 'undefined') {
                return token;
              }

              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }

            function lex() {
              var token;

              if (buffer) {
                index = buffer.range[1];
                lineNumber = buffer.lineNumber;
                lineStart = buffer.lineStart;
                token = buffer;
                buffer = null;
                return token;
              }

              buffer = null;
              return advance();
            }

            function lookahead() {
              var pos, line, start;

              if (buffer !== null) {
                return buffer;
              }

              pos = index;
              line = lineNumber;
              start = lineStart;
              buffer = advance();
              index = pos;
              lineNumber = line;
              lineStart = start;

              return buffer;
            }

            // Return true if there is a line terminator before the next token.

            function peekLineTerminator() {
              var pos, line, start, found;

              pos = index;
              line = lineNumber;
              start = lineStart;
              skipComment();
              found = lineNumber !== line;
              index = pos;
              lineNumber = line;
              lineStart = start;

              return found;
            }

            // Throw an exception

            function throwError(token, messageFormat) {
              var error,
                args = Array.prototype.slice.call(arguments, 2),
                msg = messageFormat.replace(/%(\d)/g, function (whole, index) {
                  return args[index] || '';
                });

              if (typeof token.lineNumber === 'number') {
                error = new Error('Line ' + token.lineNumber + ': ' + msg);
                error.index = token.range[0];
                error.lineNumber = token.lineNumber;
                error.column = token.range[0] - lineStart + 1;
              } else {
                error = new Error('Line ' + lineNumber + ': ' + msg);
                error.index = index;
                error.lineNumber = lineNumber;
                error.column = index - lineStart + 1;
              }

              throw error;
            }

            function throwErrorTolerant() {
              try {
                throwError.apply(null, arguments);
              } catch (e) {
                if (extra.errors) {
                  extra.errors.push(e);
                } else {
                  throw e;
                }
              }
            }

            // Throw an exception because of the token.

            function throwUnexpected(token) {
              if (token.type === Token.EOF) {
                throwError(token, Messages.UnexpectedEOS);
              }

              if (token.type === Token.NumericLiteral) {
                throwError(token, Messages.UnexpectedNumber);
              }

              if (token.type === Token.StringLiteral) {
                throwError(token, Messages.UnexpectedString);
              }

              if (token.type === Token.Identifier) {
                throwError(token, Messages.UnexpectedIdentifier);
              }

              if (token.type === Token.Keyword) {
                if (isFutureReservedWord(token.value)) {
                  throwError(token, Messages.UnexpectedReserved);
                } else if (strict && isStrictModeReservedWord(token.value)) {
                  throwErrorTolerant(token, Messages.StrictReservedWord);
                  return;
                }
                throwError(token, Messages.UnexpectedToken, token.value);
              }

              // BooleanLiteral, NullLiteral, or Punctuator.
              throwError(token, Messages.UnexpectedToken, token.value);
            }

            // Expect the next token to match the specified punctuator.
            // If not, an exception will be thrown.

            function expect(value) {
              var token = lex();
              if (token.type !== Token.Punctuator || token.value !== value) {
                throwUnexpected(token);
              }
            }

            // Expect the next token to match the specified keyword.
            // If not, an exception will be thrown.

            function expectKeyword(keyword) {
              var token = lex();
              if (token.type !== Token.Keyword || token.value !== keyword) {
                throwUnexpected(token);
              }
            }

            // Return true if the next token matches the specified punctuator.

            function match(value) {
              var token = lookahead();
              return token.type === Token.Punctuator && token.value === value;
            }

            // Return true if the next token matches the specified keyword

            function matchKeyword(keyword) {
              var token = lookahead();
              return token.type === Token.Keyword && token.value === keyword;
            }

            // Return true if the next token is an assignment operator

            function matchAssign() {
              var token = lookahead(),
                op = token.value;

              if (token.type !== Token.Punctuator) {
                return false;
              }
              return (
                op === '=' ||
                op === '*=' ||
                op === '/=' ||
                op === '%=' ||
                op === '+=' ||
                op === '-=' ||
                op === '<<=' ||
                op === '>>=' ||
                op === '>>>=' ||
                op === '&=' ||
                op === '^=' ||
                op === '|='
              );
            }

            function consumeSemicolon() {
              var token, line;

              // Catch the very common case first.
              if (source[index] === ';') {
                lex();
                return;
              }

              line = lineNumber;
              skipComment();
              if (lineNumber !== line) {
                return;
              }

              if (match(';')) {
                lex();
                return;
              }

              token = lookahead();
              if (token.type !== Token.EOF && !match('}')) {
                throwUnexpected(token);
              }
            }

            // Return true if provided expression is LeftHandSideExpression

            function isLeftHandSide(expr) {
              return (
                expr.type === Syntax.Identifier ||
                expr.type === Syntax.MemberExpression
              );
            }

            // 11.1.4 Array Initialiser

            function parseArrayInitialiser() {
              var elements = [];

              expect('[');

              while (!match(']')) {
                if (match(',')) {
                  lex();
                  elements.push(null);
                } else {
                  elements.push(parseAssignmentExpression());

                  if (!match(']')) {
                    expect(',');
                  }
                }
              }

              expect(']');

              return {
                type: Syntax.ArrayExpression,
                elements: elements,
              };
            }

            // 11.1.5 Object Initialiser

            function parsePropertyFunction(param, first) {
              var previousStrict, body;

              previousStrict = strict;
              body = parseFunctionSourceElements();
              if (first && strict && isRestrictedWord(param[0].name)) {
                throwErrorTolerant(first, Messages.StrictParamName);
              }
              strict = previousStrict;

              return {
                type: Syntax.FunctionExpression,
                id: null,
                params: param,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false,
              };
            }

            function parseObjectPropertyKey() {
              var token = lex();

              // Note: This function is called only from parseObjectProperty(), where
              // EOF and Punctuator tokens are already filtered out.

              if (
                token.type === Token.StringLiteral ||
                token.type === Token.NumericLiteral
              ) {
                if (strict && token.octal) {
                  throwErrorTolerant(token, Messages.StrictOctalLiteral);
                }
                return createLiteral(token);
              }

              return {
                type: Syntax.Identifier,
                name: token.value,
              };
            }

            function parseObjectProperty() {
              var token, key, id, param;

              token = lookahead();

              if (token.type === Token.Identifier) {
                id = parseObjectPropertyKey();

                // Property Assignment: Getter and Setter.

                if (token.value === 'get' && !match(':')) {
                  key = parseObjectPropertyKey();
                  expect('(');
                  expect(')');
                  return {
                    type: Syntax.Property,
                    key: key,
                    value: parsePropertyFunction([]),
                    kind: 'get',
                  };
                } else if (token.value === 'set' && !match(':')) {
                  key = parseObjectPropertyKey();
                  expect('(');
                  token = lookahead();
                  if (token.type !== Token.Identifier) {
                    expect(')');
                    throwErrorTolerant(
                      token,
                      Messages.UnexpectedToken,
                      token.value
                    );
                    return {
                      type: Syntax.Property,
                      key: key,
                      value: parsePropertyFunction([]),
                      kind: 'set',
                    };
                  } else {
                    param = [parseVariableIdentifier()];
                    expect(')');
                    return {
                      type: Syntax.Property,
                      key: key,
                      value: parsePropertyFunction(param, token),
                      kind: 'set',
                    };
                  }
                } else {
                  expect(':');
                  return {
                    type: Syntax.Property,
                    key: id,
                    value: parseAssignmentExpression(),
                    kind: 'init',
                  };
                }
              } else if (
                token.type === Token.EOF ||
                token.type === Token.Punctuator
              ) {
                throwUnexpected(token);
              } else {
                key = parseObjectPropertyKey();
                expect(':');
                return {
                  type: Syntax.Property,
                  key: key,
                  value: parseAssignmentExpression(),
                  kind: 'init',
                };
              }
            }

            function parseObjectInitialiser() {
              var properties = [],
                property,
                name,
                kind,
                map = {},
                toString = String;

              expect('{');

              while (!match('}')) {
                property = parseObjectProperty();

                if (property.key.type === Syntax.Identifier) {
                  name = property.key.name;
                } else {
                  name = toString(property.key.value);
                }
                kind =
                  property.kind === 'init'
                    ? PropertyKind.Data
                    : property.kind === 'get'
                    ? PropertyKind.Get
                    : PropertyKind.Set;
                if (Object.prototype.hasOwnProperty.call(map, name)) {
                  if (map[name] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                  } else {
                    if (kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[name] & kind) {
                      throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                  }
                  map[name] |= kind;
                } else {
                  map[name] = kind;
                }

                properties.push(property);

                if (!match('}')) {
                  expect(',');
                }
              }

              expect('}');

              return {
                type: Syntax.ObjectExpression,
                properties: properties,
              };
            }

            // 11.1.6 The Grouping Operator

            function parseGroupExpression() {
              var expr;

              expect('(');

              expr = parseExpression();

              expect(')');

              return expr;
            }

            // 11.1 Primary Expressions

            function parsePrimaryExpression() {
              var token = lookahead(),
                type = token.type;

              if (type === Token.Identifier) {
                return {
                  type: Syntax.Identifier,
                  name: lex().value,
                };
              }

              if (
                type === Token.StringLiteral ||
                type === Token.NumericLiteral
              ) {
                if (strict && token.octal) {
                  throwErrorTolerant(token, Messages.StrictOctalLiteral);
                }
                return createLiteral(lex());
              }

              if (type === Token.Keyword) {
                if (matchKeyword('this')) {
                  lex();
                  return {
                    type: Syntax.ThisExpression,
                  };
                }

                if (matchKeyword('function')) {
                  return parseFunctionExpression();
                }
              }

              if (type === Token.BooleanLiteral) {
                lex();
                token.value = token.value === 'true';
                return createLiteral(token);
              }

              if (type === Token.NullLiteral) {
                lex();
                token.value = null;
                return createLiteral(token);
              }

              if (match('[')) {
                return parseArrayInitialiser();
              }

              if (match('{')) {
                return parseObjectInitialiser();
              }

              if (match('(')) {
                return parseGroupExpression();
              }

              if (match('/') || match('/=')) {
                return createLiteral(scanRegExp());
              }

              return throwUnexpected(lex());
            }

            // 11.2 Left-Hand-Side Expressions

            function parseArguments() {
              var args = [];

              expect('(');

              if (!match(')')) {
                while (index < length) {
                  args.push(parseAssignmentExpression());
                  if (match(')')) {
                    break;
                  }
                  expect(',');
                }
              }

              expect(')');

              return args;
            }

            function parseNonComputedProperty() {
              var token = lex();

              if (!isIdentifierName(token)) {
                throwUnexpected(token);
              }

              return {
                type: Syntax.Identifier,
                name: token.value,
              };
            }

            function parseNonComputedMember() {
              expect('.');

              return parseNonComputedProperty();
            }

            function parseComputedMember() {
              var expr;

              expect('[');

              expr = parseExpression();

              expect(']');

              return expr;
            }

            function parseNewExpression() {
              var expr;

              expectKeyword('new');

              expr = {
                type: Syntax.NewExpression,
                callee: parseLeftHandSideExpression(),
                arguments: [],
              };

              if (match('(')) {
                expr['arguments'] = parseArguments();
              }

              return expr;
            }

            function parseLeftHandSideExpressionAllowCall() {
              var expr;

              expr = matchKeyword('new')
                ? parseNewExpression()
                : parsePrimaryExpression();

              while (match('.') || match('[') || match('(')) {
                if (match('(')) {
                  expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    arguments: parseArguments(),
                  };
                } else if (match('[')) {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember(),
                  };
                } else {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember(),
                  };
                }
              }

              return expr;
            }

            function parseLeftHandSideExpression() {
              var expr;

              expr = matchKeyword('new')
                ? parseNewExpression()
                : parsePrimaryExpression();

              while (match('.') || match('[')) {
                if (match('[')) {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember(),
                  };
                } else {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember(),
                  };
                }
              }

              return expr;
            }

            // 11.3 Postfix Expressions

            function parsePostfixExpression() {
              var expr = parseLeftHandSideExpressionAllowCall(),
                token;

              token = lookahead();
              if (token.type !== Token.Punctuator) {
                return expr;
              }

              if ((match('++') || match('--')) && !peekLineTerminator()) {
                // 11.3.1, 11.3.2
                if (
                  strict &&
                  expr.type === Syntax.Identifier &&
                  isRestrictedWord(expr.name)
                ) {
                  throwErrorTolerant({}, Messages.StrictLHSPostfix);
                }
                if (!isLeftHandSide(expr)) {
                  throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
                }

                expr = {
                  type: Syntax.UpdateExpression,
                  operator: lex().value,
                  argument: expr,
                  prefix: false,
                };
              }

              return expr;
            }

            // 11.4 Unary Operators

            function parseUnaryExpression() {
              var token, expr;

              token = lookahead();
              if (
                token.type !== Token.Punctuator &&
                token.type !== Token.Keyword
              ) {
                return parsePostfixExpression();
              }

              if (match('++') || match('--')) {
                token = lex();
                expr = parseUnaryExpression();
                // 11.4.4, 11.4.5
                if (
                  strict &&
                  expr.type === Syntax.Identifier &&
                  isRestrictedWord(expr.name)
                ) {
                  throwErrorTolerant({}, Messages.StrictLHSPrefix);
                }

                if (!isLeftHandSide(expr)) {
                  throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
                }

                expr = {
                  type: Syntax.UpdateExpression,
                  operator: token.value,
                  argument: expr,
                  prefix: true,
                };
                return expr;
              }

              if (match('+') || match('-') || match('~') || match('!')) {
                expr = {
                  type: Syntax.UnaryExpression,
                  operator: lex().value,
                  argument: parseUnaryExpression(),
                  prefix: true,
                };
                return expr;
              }

              if (
                matchKeyword('delete') ||
                matchKeyword('void') ||
                matchKeyword('typeof')
              ) {
                expr = {
                  type: Syntax.UnaryExpression,
                  operator: lex().value,
                  argument: parseUnaryExpression(),
                  prefix: true,
                };
                if (
                  strict &&
                  expr.operator === 'delete' &&
                  expr.argument.type === Syntax.Identifier
                ) {
                  throwErrorTolerant({}, Messages.StrictDelete);
                }
                return expr;
              }

              return parsePostfixExpression();
            }

            // 11.5 Multiplicative Operators

            function parseMultiplicativeExpression() {
              var expr = parseUnaryExpression();

              while (match('*') || match('/') || match('%')) {
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: lex().value,
                  left: expr,
                  right: parseUnaryExpression(),
                };
              }

              return expr;
            }

            // 11.6 Additive Operators

            function parseAdditiveExpression() {
              var expr = parseMultiplicativeExpression();

              while (match('+') || match('-')) {
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: lex().value,
                  left: expr,
                  right: parseMultiplicativeExpression(),
                };
              }

              return expr;
            }

            // 11.7 Bitwise Shift Operators

            function parseShiftExpression() {
              var expr = parseAdditiveExpression();

              while (match('<<') || match('>>') || match('>>>')) {
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: lex().value,
                  left: expr,
                  right: parseAdditiveExpression(),
                };
              }

              return expr;
            }
            // 11.8 Relational Operators

            function parseRelationalExpression() {
              var expr, previousAllowIn;

              previousAllowIn = state.allowIn;
              state.allowIn = true;

              expr = parseShiftExpression();

              while (
                match('<') ||
                match('>') ||
                match('<=') ||
                match('>=') ||
                (previousAllowIn && matchKeyword('in')) ||
                matchKeyword('instanceof')
              ) {
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: lex().value,
                  left: expr,
                  right: parseShiftExpression(),
                };
              }

              state.allowIn = previousAllowIn;
              return expr;
            }

            // 11.9 Equality Operators

            function parseEqualityExpression() {
              var expr = parseRelationalExpression();

              while (
                match('==') ||
                match('!=') ||
                match('===') ||
                match('!==')
              ) {
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: lex().value,
                  left: expr,
                  right: parseRelationalExpression(),
                };
              }

              return expr;
            }

            // 11.10 Binary Bitwise Operators

            function parseBitwiseANDExpression() {
              var expr = parseEqualityExpression();

              while (match('&')) {
                lex();
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: '&',
                  left: expr,
                  right: parseEqualityExpression(),
                };
              }

              return expr;
            }

            function parseBitwiseXORExpression() {
              var expr = parseBitwiseANDExpression();

              while (match('^')) {
                lex();
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: '^',
                  left: expr,
                  right: parseBitwiseANDExpression(),
                };
              }

              return expr;
            }

            function parseBitwiseORExpression() {
              var expr = parseBitwiseXORExpression();

              while (match('|')) {
                lex();
                expr = {
                  type: Syntax.BinaryExpression,
                  operator: '|',
                  left: expr,
                  right: parseBitwiseXORExpression(),
                };
              }

              return expr;
            }

            // 11.11 Binary Logical Operators

            function parseLogicalANDExpression() {
              var expr = parseBitwiseORExpression();

              while (match('&&')) {
                lex();
                expr = {
                  type: Syntax.LogicalExpression,
                  operator: '&&',
                  left: expr,
                  right: parseBitwiseORExpression(),
                };
              }

              return expr;
            }

            function parseLogicalORExpression() {
              var expr = parseLogicalANDExpression();

              while (match('||')) {
                lex();
                expr = {
                  type: Syntax.LogicalExpression,
                  operator: '||',
                  left: expr,
                  right: parseLogicalANDExpression(),
                };
              }

              return expr;
            }

            // 11.12 Conditional Operator

            function parseConditionalExpression() {
              var expr, previousAllowIn, consequent;

              expr = parseLogicalORExpression();

              if (match('?')) {
                lex();
                previousAllowIn = state.allowIn;
                state.allowIn = true;
                consequent = parseAssignmentExpression();
                state.allowIn = previousAllowIn;
                expect(':');

                expr = {
                  type: Syntax.ConditionalExpression,
                  test: expr,
                  consequent: consequent,
                  alternate: parseAssignmentExpression(),
                };
              }

              return expr;
            }

            // 11.13 Assignment Operators

            function parseAssignmentExpression() {
              var token, expr;

              token = lookahead();
              expr = parseConditionalExpression();

              if (matchAssign()) {
                // LeftHandSideExpression
                if (!isLeftHandSide(expr)) {
                  throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
                }

                // 11.13.1
                if (
                  strict &&
                  expr.type === Syntax.Identifier &&
                  isRestrictedWord(expr.name)
                ) {
                  throwErrorTolerant(token, Messages.StrictLHSAssignment);
                }

                expr = {
                  type: Syntax.AssignmentExpression,
                  operator: lex().value,
                  left: expr,
                  right: parseAssignmentExpression(),
                };
              }

              return expr;
            }

            // 11.14 Comma Operator

            function parseExpression() {
              var expr = parseAssignmentExpression();

              if (match(',')) {
                expr = {
                  type: Syntax.SequenceExpression,
                  expressions: [expr],
                };

                while (index < length) {
                  if (!match(',')) {
                    break;
                  }
                  lex();
                  expr.expressions.push(parseAssignmentExpression());
                }
              }
              return expr;
            }

            // 12.1 Block

            function parseStatementList() {
              var list = [],
                statement;

              while (index < length) {
                if (match('}')) {
                  break;
                }
                statement = parseSourceElement();
                if (typeof statement === 'undefined') {
                  break;
                }
                list.push(statement);
              }

              return list;
            }

            function parseBlock() {
              var block;

              expect('{');

              block = parseStatementList();

              expect('}');

              return {
                type: Syntax.BlockStatement,
                body: block,
              };
            }

            // 12.2 Variable Statement

            function parseVariableIdentifier() {
              var token = lex();

              if (token.type !== Token.Identifier) {
                throwUnexpected(token);
              }

              return {
                type: Syntax.Identifier,
                name: token.value,
              };
            }

            function parseVariableDeclaration(kind) {
              var id = parseVariableIdentifier(),
                init = null;

              // 12.2.1
              if (strict && isRestrictedWord(id.name)) {
                throwErrorTolerant({}, Messages.StrictVarName);
              }

              if (kind === 'const') {
                expect('=');
                init = parseAssignmentExpression();
              } else if (match('=')) {
                lex();
                init = parseAssignmentExpression();
              }

              return {
                type: Syntax.VariableDeclarator,
                id: id,
                init: init,
              };
            }

            function parseVariableDeclarationList(kind) {
              var list = [];

              do {
                list.push(parseVariableDeclaration(kind));
                if (!match(',')) {
                  break;
                }
                lex();
              } while (index < length);

              return list;
            }

            function parseVariableStatement() {
              var declarations;

              expectKeyword('var');

              declarations = parseVariableDeclarationList();

              consumeSemicolon();

              return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: 'var',
              };
            }

            // kind may be `const` or `let`
            // Both are experimental and not in the specification yet.
            // see http://wiki.ecmascript.org/doku.php?id=harmony:const
            // and http://wiki.ecmascript.org/doku.php?id=harmony:let
            function parseConstLetDeclaration(kind) {
              var declarations;

              expectKeyword(kind);

              declarations = parseVariableDeclarationList(kind);

              consumeSemicolon();

              return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: kind,
              };
            }

            // 12.3 Empty Statement

            function parseEmptyStatement() {
              expect(';');

              return {
                type: Syntax.EmptyStatement,
              };
            }

            // 12.4 Expression Statement

            function parseExpressionStatement() {
              var expr = parseExpression();

              consumeSemicolon();

              return {
                type: Syntax.ExpressionStatement,
                expression: expr,
              };
            }

            // 12.5 If statement

            function parseIfStatement() {
              var test, consequent, alternate;

              expectKeyword('if');

              expect('(');

              test = parseExpression();

              expect(')');

              consequent = parseStatement();

              if (matchKeyword('else')) {
                lex();
                alternate = parseStatement();
              } else {
                alternate = null;
              }

              return {
                type: Syntax.IfStatement,
                test: test,
                consequent: consequent,
                alternate: alternate,
              };
            }

            // 12.6 Iteration Statements

            function parseDoWhileStatement() {
              var body, test, oldInIteration;

              expectKeyword('do');

              oldInIteration = state.inIteration;
              state.inIteration = true;

              body = parseStatement();

              state.inIteration = oldInIteration;

              expectKeyword('while');

              expect('(');

              test = parseExpression();

              expect(')');

              if (match(';')) {
                lex();
              }

              return {
                type: Syntax.DoWhileStatement,
                body: body,
                test: test,
              };
            }

            function parseWhileStatement() {
              var test, body, oldInIteration;

              expectKeyword('while');

              expect('(');

              test = parseExpression();

              expect(')');

              oldInIteration = state.inIteration;
              state.inIteration = true;

              body = parseStatement();

              state.inIteration = oldInIteration;

              return {
                type: Syntax.WhileStatement,
                test: test,
                body: body,
              };
            }

            function parseForVariableDeclaration() {
              var token = lex();

              return {
                type: Syntax.VariableDeclaration,
                declarations: parseVariableDeclarationList(),
                kind: token.value,
              };
            }

            function parseForStatement() {
              var init, test, update, left, right, body, oldInIteration;

              init = test = update = null;

              expectKeyword('for');

              expect('(');

              if (match(';')) {
                lex();
              } else {
                if (matchKeyword('var') || matchKeyword('let')) {
                  state.allowIn = false;
                  init = parseForVariableDeclaration();
                  state.allowIn = true;

                  if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                  }
                } else {
                  state.allowIn = false;
                  init = parseExpression();
                  state.allowIn = true;

                  if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                      throwErrorTolerant({}, Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                  }
                }

                if (typeof left === 'undefined') {
                  expect(';');
                }
              }

              if (typeof left === 'undefined') {
                if (!match(';')) {
                  test = parseExpression();
                }
                expect(';');

                if (!match(')')) {
                  update = parseExpression();
                }
              }

              expect(')');

              oldInIteration = state.inIteration;
              state.inIteration = true;

              body = parseStatement();

              state.inIteration = oldInIteration;

              if (typeof left === 'undefined') {
                return {
                  type: Syntax.ForStatement,
                  init: init,
                  test: test,
                  update: update,
                  body: body,
                };
              }

              return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false,
              };
            }

            // 12.7 The continue statement

            function parseContinueStatement() {
              var token,
                label = null;

              expectKeyword('continue');

              // Optimize the most common form: 'continue;'.
              if (source[index] === ';') {
                lex();

                if (!state.inIteration) {
                  throwError({}, Messages.IllegalContinue);
                }

                return {
                  type: Syntax.ContinueStatement,
                  label: null,
                };
              }

              if (peekLineTerminator()) {
                if (!state.inIteration) {
                  throwError({}, Messages.IllegalContinue);
                }

                return {
                  type: Syntax.ContinueStatement,
                  label: null,
                };
              }

              token = lookahead();
              if (token.type === Token.Identifier) {
                label = parseVariableIdentifier();

                if (
                  !Object.prototype.hasOwnProperty.call(
                    state.labelSet,
                    label.name
                  )
                ) {
                  throwError({}, Messages.UnknownLabel, label.name);
                }
              }

              consumeSemicolon();

              if (label === null && !state.inIteration) {
                throwError({}, Messages.IllegalContinue);
              }

              return {
                type: Syntax.ContinueStatement,
                label: label,
              };
            }

            // 12.8 The break statement

            function parseBreakStatement() {
              var token,
                label = null;

              expectKeyword('break');

              // Optimize the most common form: 'break;'.
              if (source[index] === ';') {
                lex();

                if (!(state.inIteration || state.inSwitch)) {
                  throwError({}, Messages.IllegalBreak);
                }

                return {
                  type: Syntax.BreakStatement,
                  label: null,
                };
              }

              if (peekLineTerminator()) {
                if (!(state.inIteration || state.inSwitch)) {
                  throwError({}, Messages.IllegalBreak);
                }

                return {
                  type: Syntax.BreakStatement,
                  label: null,
                };
              }

              token = lookahead();
              if (token.type === Token.Identifier) {
                label = parseVariableIdentifier();

                if (
                  !Object.prototype.hasOwnProperty.call(
                    state.labelSet,
                    label.name
                  )
                ) {
                  throwError({}, Messages.UnknownLabel, label.name);
                }
              }

              consumeSemicolon();

              if (label === null && !(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
              }

              return {
                type: Syntax.BreakStatement,
                label: label,
              };
            }

            // 12.9 The return statement

            function parseReturnStatement() {
              var token,
                argument = null;

              expectKeyword('return');

              if (!state.inFunctionBody) {
                throwErrorTolerant({}, Messages.IllegalReturn);
              }

              // 'return' followed by a space and an identifier is very common.
              if (source[index] === ' ') {
                if (isIdentifierStart(source[index + 1])) {
                  argument = parseExpression();
                  consumeSemicolon();
                  return {
                    type: Syntax.ReturnStatement,
                    argument: argument,
                  };
                }
              }

              if (peekLineTerminator()) {
                return {
                  type: Syntax.ReturnStatement,
                  argument: null,
                };
              }

              if (!match(';')) {
                token = lookahead();
                if (!match('}') && token.type !== Token.EOF) {
                  argument = parseExpression();
                }
              }

              consumeSemicolon();

              return {
                type: Syntax.ReturnStatement,
                argument: argument,
              };
            }

            // 12.10 The with statement

            function parseWithStatement() {
              var object, body;

              if (strict) {
                throwErrorTolerant({}, Messages.StrictModeWith);
              }

              expectKeyword('with');

              expect('(');

              object = parseExpression();

              expect(')');

              body = parseStatement();

              return {
                type: Syntax.WithStatement,
                object: object,
                body: body,
              };
            }

            // 12.10 The swith statement

            function parseSwitchCase() {
              var test,
                consequent = [],
                statement;

              if (matchKeyword('default')) {
                lex();
                test = null;
              } else {
                expectKeyword('case');
                test = parseExpression();
              }
              expect(':');

              while (index < length) {
                if (
                  match('}') ||
                  matchKeyword('default') ||
                  matchKeyword('case')
                ) {
                  break;
                }
                statement = parseStatement();
                if (typeof statement === 'undefined') {
                  break;
                }
                consequent.push(statement);
              }

              return {
                type: Syntax.SwitchCase,
                test: test,
                consequent: consequent,
              };
            }

            function parseSwitchStatement() {
              var discriminant, cases, clause, oldInSwitch, defaultFound;

              expectKeyword('switch');

              expect('(');

              discriminant = parseExpression();

              expect(')');

              expect('{');

              cases = [];

              if (match('}')) {
                lex();
                return {
                  type: Syntax.SwitchStatement,
                  discriminant: discriminant,
                  cases: cases,
                };
              }

              oldInSwitch = state.inSwitch;
              state.inSwitch = true;
              defaultFound = false;

              while (index < length) {
                if (match('}')) {
                  break;
                }
                clause = parseSwitchCase();
                if (clause.test === null) {
                  if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                  }
                  defaultFound = true;
                }
                cases.push(clause);
              }

              state.inSwitch = oldInSwitch;

              expect('}');

              return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases,
              };
            }

            // 12.13 The throw statement

            function parseThrowStatement() {
              var argument;

              expectKeyword('throw');

              if (peekLineTerminator()) {
                throwError({}, Messages.NewlineAfterThrow);
              }

              argument = parseExpression();

              consumeSemicolon();

              return {
                type: Syntax.ThrowStatement,
                argument: argument,
              };
            }

            // 12.14 The try statement

            function parseCatchClause() {
              var param;

              expectKeyword('catch');

              expect('(');
              if (match(')')) {
                throwUnexpected(lookahead());
              }

              param = parseVariableIdentifier();
              // 12.14.1
              if (strict && isRestrictedWord(param.name)) {
                throwErrorTolerant({}, Messages.StrictCatchVariable);
              }

              expect(')');

              return {
                type: Syntax.CatchClause,
                param: param,
                body: parseBlock(),
              };
            }

            function parseTryStatement() {
              var block,
                handlers = [],
                finalizer = null;

              expectKeyword('try');

              block = parseBlock();

              if (matchKeyword('catch')) {
                handlers.push(parseCatchClause());
              }

              if (matchKeyword('finally')) {
                lex();
                finalizer = parseBlock();
              }

              if (handlers.length === 0 && !finalizer) {
                throwError({}, Messages.NoCatchOrFinally);
              }

              return {
                type: Syntax.TryStatement,
                block: block,
                guardedHandlers: [],
                handlers: handlers,
                finalizer: finalizer,
              };
            }

            // 12.15 The debugger statement

            function parseDebuggerStatement() {
              expectKeyword('debugger');

              consumeSemicolon();

              return {
                type: Syntax.DebuggerStatement,
              };
            }

            // 12 Statements

            function parseStatement() {
              var token = lookahead(),
                expr,
                labeledBody;

              if (token.type === Token.EOF) {
                throwUnexpected(token);
              }

              if (token.type === Token.Punctuator) {
                switch (token.value) {
                  case ';':
                    return parseEmptyStatement();
                  case '{':
                    return parseBlock();
                  case '(':
                    return parseExpressionStatement();
                  default:
                    break;
                }
              }

              if (token.type === Token.Keyword) {
                switch (token.value) {
                  case 'break':
                    return parseBreakStatement();
                  case 'continue':
                    return parseContinueStatement();
                  case 'debugger':
                    return parseDebuggerStatement();
                  case 'do':
                    return parseDoWhileStatement();
                  case 'for':
                    return parseForStatement();
                  case 'function':
                    return parseFunctionDeclaration();
                  case 'if':
                    return parseIfStatement();
                  case 'return':
                    return parseReturnStatement();
                  case 'switch':
                    return parseSwitchStatement();
                  case 'throw':
                    return parseThrowStatement();
                  case 'try':
                    return parseTryStatement();
                  case 'var':
                    return parseVariableStatement();
                  case 'while':
                    return parseWhileStatement();
                  case 'with':
                    return parseWithStatement();
                  default:
                    break;
                }
              }

              expr = parseExpression();

              // 12.12 Labelled Statements
              if (expr.type === Syntax.Identifier && match(':')) {
                lex();

                if (
                  Object.prototype.hasOwnProperty.call(
                    state.labelSet,
                    expr.name
                  )
                ) {
                  throwError({}, Messages.Redeclaration, 'Label', expr.name);
                }

                state.labelSet[expr.name] = true;
                labeledBody = parseStatement();
                delete state.labelSet[expr.name];

                return {
                  type: Syntax.LabeledStatement,
                  label: expr,
                  body: labeledBody,
                };
              }

              consumeSemicolon();

              return {
                type: Syntax.ExpressionStatement,
                expression: expr,
              };
            }

            // 13 Function Definition

            function parseFunctionSourceElements() {
              var sourceElement,
                sourceElements = [],
                token,
                directive,
                firstRestricted,
                oldLabelSet,
                oldInIteration,
                oldInSwitch,
                oldInFunctionBody;

              expect('{');

              while (index < length) {
                token = lookahead();
                if (token.type !== Token.StringLiteral) {
                  break;
                }

                sourceElement = parseSourceElement();
                sourceElements.push(sourceElement);
                if (sourceElement.expression.type !== Syntax.Literal) {
                  // this is not directive
                  break;
                }
                directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
                if (directive === 'use strict') {
                  strict = true;
                  if (firstRestricted) {
                    throwErrorTolerant(
                      firstRestricted,
                      Messages.StrictOctalLiteral
                    );
                  }
                } else {
                  if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                  }
                }
              }

              oldLabelSet = state.labelSet;
              oldInIteration = state.inIteration;
              oldInSwitch = state.inSwitch;
              oldInFunctionBody = state.inFunctionBody;

              state.labelSet = {};
              state.inIteration = false;
              state.inSwitch = false;
              state.inFunctionBody = true;

              while (index < length) {
                if (match('}')) {
                  break;
                }
                sourceElement = parseSourceElement();
                if (typeof sourceElement === 'undefined') {
                  break;
                }
                sourceElements.push(sourceElement);
              }

              expect('}');

              state.labelSet = oldLabelSet;
              state.inIteration = oldInIteration;
              state.inSwitch = oldInSwitch;
              state.inFunctionBody = oldInFunctionBody;

              return {
                type: Syntax.BlockStatement,
                body: sourceElements,
              };
            }

            function parseFunctionDeclaration() {
              var id,
                param,
                params = [],
                body,
                token,
                stricted,
                firstRestricted,
                message,
                previousStrict,
                paramSet;

              expectKeyword('function');
              token = lookahead();
              id = parseVariableIdentifier();
              if (strict) {
                if (isRestrictedWord(token.value)) {
                  throwErrorTolerant(token, Messages.StrictFunctionName);
                }
              } else {
                if (isRestrictedWord(token.value)) {
                  firstRestricted = token;
                  message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                  firstRestricted = token;
                  message = Messages.StrictReservedWord;
                }
              }

              expect('(');

              if (!match(')')) {
                paramSet = {};
                while (index < length) {
                  token = lookahead();
                  param = parseVariableIdentifier();
                  if (strict) {
                    if (isRestrictedWord(token.value)) {
                      stricted = token;
                      message = Messages.StrictParamName;
                    }
                    if (
                      Object.prototype.hasOwnProperty.call(
                        paramSet,
                        token.value
                      )
                    ) {
                      stricted = token;
                      message = Messages.StrictParamDupe;
                    }
                  } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                      firstRestricted = token;
                      message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                      firstRestricted = token;
                      message = Messages.StrictReservedWord;
                    } else if (
                      Object.prototype.hasOwnProperty.call(
                        paramSet,
                        token.value
                      )
                    ) {
                      firstRestricted = token;
                      message = Messages.StrictParamDupe;
                    }
                  }
                  params.push(param);
                  paramSet[param.name] = true;
                  if (match(')')) {
                    break;
                  }
                  expect(',');
                }
              }

              expect(')');

              previousStrict = strict;
              body = parseFunctionSourceElements();
              if (strict && firstRestricted) {
                throwError(firstRestricted, message);
              }
              if (strict && stricted) {
                throwErrorTolerant(stricted, message);
              }
              strict = previousStrict;

              return {
                type: Syntax.FunctionDeclaration,
                id: id,
                params: params,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false,
              };
            }

            function parseFunctionExpression() {
              var token,
                id = null,
                stricted,
                firstRestricted,
                message,
                param,
                params = [],
                body,
                previousStrict,
                paramSet;

              expectKeyword('function');

              if (!match('(')) {
                token = lookahead();
                id = parseVariableIdentifier();
                if (strict) {
                  if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                  }
                } else {
                  if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                  } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                  }
                }
              }

              expect('(');

              if (!match(')')) {
                paramSet = {};
                while (index < length) {
                  token = lookahead();
                  param = parseVariableIdentifier();
                  if (strict) {
                    if (isRestrictedWord(token.value)) {
                      stricted = token;
                      message = Messages.StrictParamName;
                    }
                    if (
                      Object.prototype.hasOwnProperty.call(
                        paramSet,
                        token.value
                      )
                    ) {
                      stricted = token;
                      message = Messages.StrictParamDupe;
                    }
                  } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                      firstRestricted = token;
                      message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                      firstRestricted = token;
                      message = Messages.StrictReservedWord;
                    } else if (
                      Object.prototype.hasOwnProperty.call(
                        paramSet,
                        token.value
                      )
                    ) {
                      firstRestricted = token;
                      message = Messages.StrictParamDupe;
                    }
                  }
                  params.push(param);
                  paramSet[param.name] = true;
                  if (match(')')) {
                    break;
                  }
                  expect(',');
                }
              }

              expect(')');

              previousStrict = strict;
              body = parseFunctionSourceElements();
              if (strict && firstRestricted) {
                throwError(firstRestricted, message);
              }
              if (strict && stricted) {
                throwErrorTolerant(stricted, message);
              }
              strict = previousStrict;

              return {
                type: Syntax.FunctionExpression,
                id: id,
                params: params,
                defaults: [],
                body: body,
                rest: null,
                generator: false,
                expression: false,
              };
            }

            // 14 Program

            function parseSourceElement() {
              var token = lookahead();

              if (token.type === Token.Keyword) {
                switch (token.value) {
                  case 'const':
                  case 'let':
                    return parseConstLetDeclaration(token.value);
                  case 'function':
                    return parseFunctionDeclaration();
                  default:
                    return parseStatement();
                }
              }

              if (token.type !== Token.EOF) {
                return parseStatement();
              }
            }

            function parseSourceElements() {
              var sourceElement,
                sourceElements = [],
                token,
                directive,
                firstRestricted;

              while (index < length) {
                token = lookahead();
                if (token.type !== Token.StringLiteral) {
                  break;
                }

                sourceElement = parseSourceElement();
                sourceElements.push(sourceElement);
                if (sourceElement.expression.type !== Syntax.Literal) {
                  // this is not directive
                  break;
                }
                directive = sliceSource(token.range[0] + 1, token.range[1] - 1);
                if (directive === 'use strict') {
                  strict = true;
                  if (firstRestricted) {
                    throwErrorTolerant(
                      firstRestricted,
                      Messages.StrictOctalLiteral
                    );
                  }
                } else {
                  if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                  }
                }
              }

              while (index < length) {
                sourceElement = parseSourceElement();
                if (typeof sourceElement === 'undefined') {
                  break;
                }
                sourceElements.push(sourceElement);
              }
              return sourceElements;
            }

            function parseProgram() {
              var program;
              strict = false;
              program = {
                type: Syntax.Program,
                body: parseSourceElements(),
              };
              return program;
            }

            // The following functions are needed only when the option to preserve
            // the comments is active.

            function addComment(type, value, start, end, loc) {
              assert(
                typeof start === 'number',
                'Comment must have valid position'
              );

              // Because the way the actual token is scanned, often the comments
              // (if any) are skipped twice during the lexical analysis.
              // Thus, we need to skip adding a comment if the comment array already
              // handled it.
              if (extra.comments.length > 0) {
                if (
                  extra.comments[extra.comments.length - 1].range[1] > start
                ) {
                  return;
                }
              }

              extra.comments.push({
                type: type,
                value: value,
                range: [start, end],
                loc: loc,
              });
            }

            function scanComment() {
              var comment, ch, loc, start, blockComment, lineComment;

              comment = '';
              blockComment = false;
              lineComment = false;

              while (index < length) {
                ch = source[index];

                if (lineComment) {
                  ch = source[index++];
                  if (isLineTerminator(ch)) {
                    loc.end = {
                      line: lineNumber,
                      column: index - lineStart - 1,
                    };
                    lineComment = false;
                    addComment('Line', comment, start, index - 1, loc);
                    if (ch === '\r' && source[index] === '\n') {
                      ++index;
                    }
                    ++lineNumber;
                    lineStart = index;
                    comment = '';
                  } else if (index >= length) {
                    lineComment = false;
                    comment += ch;
                    loc.end = {
                      line: lineNumber,
                      column: length - lineStart,
                    };
                    addComment('Line', comment, start, length, loc);
                  } else {
                    comment += ch;
                  }
                } else if (blockComment) {
                  if (isLineTerminator(ch)) {
                    if (ch === '\r' && source[index + 1] === '\n') {
                      ++index;
                      comment += '\r\n';
                    } else {
                      comment += ch;
                    }
                    ++lineNumber;
                    ++index;
                    lineStart = index;
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  } else {
                    ch = source[index++];
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                    comment += ch;
                    if (ch === '*') {
                      ch = source[index];
                      if (ch === '/') {
                        comment = comment.substr(0, comment.length - 1);
                        blockComment = false;
                        ++index;
                        loc.end = {
                          line: lineNumber,
                          column: index - lineStart,
                        };
                        addComment('Block', comment, start, index, loc);
                        comment = '';
                      }
                    }
                  }
                } else if (ch === '/') {
                  ch = source[index + 1];
                  if (ch === '/') {
                    loc = {
                      start: {
                        line: lineNumber,
                        column: index - lineStart,
                      },
                    };
                    start = index;
                    index += 2;
                    lineComment = true;
                    if (index >= length) {
                      loc.end = {
                        line: lineNumber,
                        column: index - lineStart,
                      };
                      lineComment = false;
                      addComment('Line', comment, start, index, loc);
                    }
                  } else if (ch === '*') {
                    start = index;
                    index += 2;
                    blockComment = true;
                    loc = {
                      start: {
                        line: lineNumber,
                        column: index - lineStart - 2,
                      },
                    };
                    if (index >= length) {
                      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                    }
                  } else {
                    break;
                  }
                } else if (isWhiteSpace(ch)) {
                  ++index;
                } else if (isLineTerminator(ch)) {
                  ++index;
                  if (ch === '\r' && source[index] === '\n') {
                    ++index;
                  }
                  ++lineNumber;
                  lineStart = index;
                } else {
                  break;
                }
              }
            }

            function filterCommentLocation() {
              var i,
                entry,
                comment,
                comments = [];

              for (i = 0; i < extra.comments.length; ++i) {
                entry = extra.comments[i];
                comment = {
                  type: entry.type,
                  value: entry.value,
                };
                if (extra.range) {
                  comment.range = entry.range;
                }
                if (extra.loc) {
                  comment.loc = entry.loc;
                }
                comments.push(comment);
              }

              extra.comments = comments;
            }

            function collectToken() {
              var start, loc, token, range, value;

              skipComment();
              start = index;
              loc = {
                start: {
                  line: lineNumber,
                  column: index - lineStart,
                },
              };

              token = extra.advance();
              loc.end = {
                line: lineNumber,
                column: index - lineStart,
              };

              if (token.type !== Token.EOF) {
                range = [token.range[0], token.range[1]];
                value = sliceSource(token.range[0], token.range[1]);
                extra.tokens.push({
                  type: TokenName[token.type],
                  value: value,
                  range: range,
                  loc: loc,
                });
              }

              return token;
            }

            function collectRegex() {
              var pos, loc, regex, token;

              skipComment();

              pos = index;
              loc = {
                start: {
                  line: lineNumber,
                  column: index - lineStart,
                },
              };

              regex = extra.scanRegExp();
              loc.end = {
                line: lineNumber,
                column: index - lineStart,
              };

              // Pop the previous token, which is likely '/' or '/='
              if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                  if (token.value === '/' || token.value === '/=') {
                    extra.tokens.pop();
                  }
                }
              }

              extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                range: [pos, index],
                loc: loc,
              });

              return regex;
            }

            function filterTokenLocation() {
              var i,
                entry,
                token,
                tokens = [];

              for (i = 0; i < extra.tokens.length; ++i) {
                entry = extra.tokens[i];
                token = {
                  type: entry.type,
                  value: entry.value,
                };
                if (extra.range) {
                  token.range = entry.range;
                }
                if (extra.loc) {
                  token.loc = entry.loc;
                }
                tokens.push(token);
              }

              extra.tokens = tokens;
            }

            function createLiteral(token) {
              return {
                type: Syntax.Literal,
                value: token.value,
              };
            }

            function createRawLiteral(token) {
              return {
                type: Syntax.Literal,
                value: token.value,
                raw: sliceSource(token.range[0], token.range[1]),
              };
            }

            function createLocationMarker() {
              var marker = {};

              marker.range = [index, index];
              marker.loc = {
                start: {
                  line: lineNumber,
                  column: index - lineStart,
                },
                end: {
                  line: lineNumber,
                  column: index - lineStart,
                },
              };

              marker.end = function () {
                this.range[1] = index;
                this.loc.end.line = lineNumber;
                this.loc.end.column = index - lineStart;
              };

              marker.applyGroup = function (node) {
                if (extra.range) {
                  node.groupRange = [this.range[0], this.range[1]];
                }
                if (extra.loc) {
                  node.groupLoc = {
                    start: {
                      line: this.loc.start.line,
                      column: this.loc.start.column,
                    },
                    end: {
                      line: this.loc.end.line,
                      column: this.loc.end.column,
                    },
                  };
                }
              };

              marker.apply = function (node) {
                if (extra.range) {
                  node.range = [this.range[0], this.range[1]];
                }
                if (extra.loc) {
                  node.loc = {
                    start: {
                      line: this.loc.start.line,
                      column: this.loc.start.column,
                    },
                    end: {
                      line: this.loc.end.line,
                      column: this.loc.end.column,
                    },
                  };
                }
              };

              return marker;
            }

            function trackGroupExpression() {
              var marker, expr;

              skipComment();
              marker = createLocationMarker();
              expect('(');

              expr = parseExpression();

              expect(')');

              marker.end();
              marker.applyGroup(expr);

              return expr;
            }

            function trackLeftHandSideExpression() {
              var marker, expr;

              skipComment();
              marker = createLocationMarker();

              expr = matchKeyword('new')
                ? parseNewExpression()
                : parsePrimaryExpression();

              while (match('.') || match('[')) {
                if (match('[')) {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember(),
                  };
                  marker.end();
                  marker.apply(expr);
                } else {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember(),
                  };
                  marker.end();
                  marker.apply(expr);
                }
              }

              return expr;
            }

            function trackLeftHandSideExpressionAllowCall() {
              var marker, expr;

              skipComment();
              marker = createLocationMarker();

              expr = matchKeyword('new')
                ? parseNewExpression()
                : parsePrimaryExpression();

              while (match('.') || match('[') || match('(')) {
                if (match('(')) {
                  expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    arguments: parseArguments(),
                  };
                  marker.end();
                  marker.apply(expr);
                } else if (match('[')) {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: parseComputedMember(),
                  };
                  marker.end();
                  marker.apply(expr);
                } else {
                  expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: parseNonComputedMember(),
                  };
                  marker.end();
                  marker.apply(expr);
                }
              }

              return expr;
            }

            function filterGroup(node) {
              var n, i, entry;

              n =
                Object.prototype.toString.apply(node) === '[object Array]'
                  ? []
                  : {};
              for (i in node) {
                if (
                  node.hasOwnProperty(i) &&
                  i !== 'groupRange' &&
                  i !== 'groupLoc'
                ) {
                  entry = node[i];
                  if (
                    entry === null ||
                    typeof entry !== 'object' ||
                    entry instanceof RegExp
                  ) {
                    n[i] = entry;
                  } else {
                    n[i] = filterGroup(entry);
                  }
                }
              }
              return n;
            }

            function wrapTrackingFunction(range, loc) {
              return function (parseFunction) {
                function isBinary(node) {
                  return (
                    node.type === Syntax.LogicalExpression ||
                    node.type === Syntax.BinaryExpression
                  );
                }

                function visit(node) {
                  var start, end;

                  if (isBinary(node.left)) {
                    visit(node.left);
                  }
                  if (isBinary(node.right)) {
                    visit(node.right);
                  }

                  if (range) {
                    if (node.left.groupRange || node.right.groupRange) {
                      start = node.left.groupRange
                        ? node.left.groupRange[0]
                        : node.left.range[0];
                      end = node.right.groupRange
                        ? node.right.groupRange[1]
                        : node.right.range[1];
                      node.range = [start, end];
                    } else if (typeof node.range === 'undefined') {
                      start = node.left.range[0];
                      end = node.right.range[1];
                      node.range = [start, end];
                    }
                  }
                  if (loc) {
                    if (node.left.groupLoc || node.right.groupLoc) {
                      start = node.left.groupLoc
                        ? node.left.groupLoc.start
                        : node.left.loc.start;
                      end = node.right.groupLoc
                        ? node.right.groupLoc.end
                        : node.right.loc.end;
                      node.loc = {
                        start: start,
                        end: end,
                      };
                    } else if (typeof node.loc === 'undefined') {
                      node.loc = {
                        start: node.left.loc.start,
                        end: node.right.loc.end,
                      };
                    }
                  }
                }

                return function () {
                  var marker, node;

                  skipComment();

                  marker = createLocationMarker();
                  node = parseFunction.apply(null, arguments);
                  marker.end();

                  if (range && typeof node.range === 'undefined') {
                    marker.apply(node);
                  }

                  if (loc && typeof node.loc === 'undefined') {
                    marker.apply(node);
                  }

                  if (isBinary(node)) {
                    visit(node);
                  }

                  return node;
                };
              };
            }

            function patch() {
              var wrapTracking;

              if (extra.comments) {
                extra.skipComment = skipComment;
                skipComment = scanComment;
              }

              if (extra.raw) {
                extra.createLiteral = createLiteral;
                createLiteral = createRawLiteral;
              }

              if (extra.range || extra.loc) {
                extra.parseGroupExpression = parseGroupExpression;
                extra.parseLeftHandSideExpression = parseLeftHandSideExpression;
                extra.parseLeftHandSideExpressionAllowCall =
                  parseLeftHandSideExpressionAllowCall;
                parseGroupExpression = trackGroupExpression;
                parseLeftHandSideExpression = trackLeftHandSideExpression;
                parseLeftHandSideExpressionAllowCall =
                  trackLeftHandSideExpressionAllowCall;

                wrapTracking = wrapTrackingFunction(extra.range, extra.loc);

                extra.parseAdditiveExpression = parseAdditiveExpression;
                extra.parseAssignmentExpression = parseAssignmentExpression;
                extra.parseBitwiseANDExpression = parseBitwiseANDExpression;
                extra.parseBitwiseORExpression = parseBitwiseORExpression;
                extra.parseBitwiseXORExpression = parseBitwiseXORExpression;
                extra.parseBlock = parseBlock;
                extra.parseFunctionSourceElements = parseFunctionSourceElements;
                extra.parseCatchClause = parseCatchClause;
                extra.parseComputedMember = parseComputedMember;
                extra.parseConditionalExpression = parseConditionalExpression;
                extra.parseConstLetDeclaration = parseConstLetDeclaration;
                extra.parseEqualityExpression = parseEqualityExpression;
                extra.parseExpression = parseExpression;
                extra.parseForVariableDeclaration = parseForVariableDeclaration;
                extra.parseFunctionDeclaration = parseFunctionDeclaration;
                extra.parseFunctionExpression = parseFunctionExpression;
                extra.parseLogicalANDExpression = parseLogicalANDExpression;
                extra.parseLogicalORExpression = parseLogicalORExpression;
                extra.parseMultiplicativeExpression =
                  parseMultiplicativeExpression;
                extra.parseNewExpression = parseNewExpression;
                extra.parseNonComputedProperty = parseNonComputedProperty;
                extra.parseObjectProperty = parseObjectProperty;
                extra.parseObjectPropertyKey = parseObjectPropertyKey;
                extra.parsePostfixExpression = parsePostfixExpression;
                extra.parsePrimaryExpression = parsePrimaryExpression;
                extra.parseProgram = parseProgram;
                extra.parsePropertyFunction = parsePropertyFunction;
                extra.parseRelationalExpression = parseRelationalExpression;
                extra.parseStatement = parseStatement;
                extra.parseShiftExpression = parseShiftExpression;
                extra.parseSwitchCase = parseSwitchCase;
                extra.parseUnaryExpression = parseUnaryExpression;
                extra.parseVariableDeclaration = parseVariableDeclaration;
                extra.parseVariableIdentifier = parseVariableIdentifier;

                parseAdditiveExpression = wrapTracking(
                  extra.parseAdditiveExpression
                );
                parseAssignmentExpression = wrapTracking(
                  extra.parseAssignmentExpression
                );
                parseBitwiseANDExpression = wrapTracking(
                  extra.parseBitwiseANDExpression
                );
                parseBitwiseORExpression = wrapTracking(
                  extra.parseBitwiseORExpression
                );
                parseBitwiseXORExpression = wrapTracking(
                  extra.parseBitwiseXORExpression
                );
                parseBlock = wrapTracking(extra.parseBlock);
                parseFunctionSourceElements = wrapTracking(
                  extra.parseFunctionSourceElements
                );
                parseCatchClause = wrapTracking(extra.parseCatchClause);
                parseComputedMember = wrapTracking(extra.parseComputedMember);
                parseConditionalExpression = wrapTracking(
                  extra.parseConditionalExpression
                );
                parseConstLetDeclaration = wrapTracking(
                  extra.parseConstLetDeclaration
                );
                parseEqualityExpression = wrapTracking(
                  extra.parseEqualityExpression
                );
                parseExpression = wrapTracking(extra.parseExpression);
                parseForVariableDeclaration = wrapTracking(
                  extra.parseForVariableDeclaration
                );
                parseFunctionDeclaration = wrapTracking(
                  extra.parseFunctionDeclaration
                );
                parseFunctionExpression = wrapTracking(
                  extra.parseFunctionExpression
                );
                parseLeftHandSideExpression = wrapTracking(
                  parseLeftHandSideExpression
                );
                parseLogicalANDExpression = wrapTracking(
                  extra.parseLogicalANDExpression
                );
                parseLogicalORExpression = wrapTracking(
                  extra.parseLogicalORExpression
                );
                parseMultiplicativeExpression = wrapTracking(
                  extra.parseMultiplicativeExpression
                );
                parseNewExpression = wrapTracking(extra.parseNewExpression);
                parseNonComputedProperty = wrapTracking(
                  extra.parseNonComputedProperty
                );
                parseObjectProperty = wrapTracking(extra.parseObjectProperty);
                parseObjectPropertyKey = wrapTracking(
                  extra.parseObjectPropertyKey
                );
                parsePostfixExpression = wrapTracking(
                  extra.parsePostfixExpression
                );
                parsePrimaryExpression = wrapTracking(
                  extra.parsePrimaryExpression
                );
                parseProgram = wrapTracking(extra.parseProgram);
                parsePropertyFunction = wrapTracking(
                  extra.parsePropertyFunction
                );
                parseRelationalExpression = wrapTracking(
                  extra.parseRelationalExpression
                );
                parseStatement = wrapTracking(extra.parseStatement);
                parseShiftExpression = wrapTracking(extra.parseShiftExpression);
                parseSwitchCase = wrapTracking(extra.parseSwitchCase);
                parseUnaryExpression = wrapTracking(extra.parseUnaryExpression);
                parseVariableDeclaration = wrapTracking(
                  extra.parseVariableDeclaration
                );
                parseVariableIdentifier = wrapTracking(
                  extra.parseVariableIdentifier
                );
              }

              if (typeof extra.tokens !== 'undefined') {
                extra.advance = advance;
                extra.scanRegExp = scanRegExp;

                advance = collectToken;
                scanRegExp = collectRegex;
              }
            }

            function unpatch() {
              if (typeof extra.skipComment === 'function') {
                skipComment = extra.skipComment;
              }

              if (extra.raw) {
                createLiteral = extra.createLiteral;
              }

              if (extra.range || extra.loc) {
                parseAdditiveExpression = extra.parseAdditiveExpression;
                parseAssignmentExpression = extra.parseAssignmentExpression;
                parseBitwiseANDExpression = extra.parseBitwiseANDExpression;
                parseBitwiseORExpression = extra.parseBitwiseORExpression;
                parseBitwiseXORExpression = extra.parseBitwiseXORExpression;
                parseBlock = extra.parseBlock;
                parseFunctionSourceElements = extra.parseFunctionSourceElements;
                parseCatchClause = extra.parseCatchClause;
                parseComputedMember = extra.parseComputedMember;
                parseConditionalExpression = extra.parseConditionalExpression;
                parseConstLetDeclaration = extra.parseConstLetDeclaration;
                parseEqualityExpression = extra.parseEqualityExpression;
                parseExpression = extra.parseExpression;
                parseForVariableDeclaration = extra.parseForVariableDeclaration;
                parseFunctionDeclaration = extra.parseFunctionDeclaration;
                parseFunctionExpression = extra.parseFunctionExpression;
                parseGroupExpression = extra.parseGroupExpression;
                parseLeftHandSideExpression = extra.parseLeftHandSideExpression;
                parseLeftHandSideExpressionAllowCall =
                  extra.parseLeftHandSideExpressionAllowCall;
                parseLogicalANDExpression = extra.parseLogicalANDExpression;
                parseLogicalORExpression = extra.parseLogicalORExpression;
                parseMultiplicativeExpression =
                  extra.parseMultiplicativeExpression;
                parseNewExpression = extra.parseNewExpression;
                parseNonComputedProperty = extra.parseNonComputedProperty;
                parseObjectProperty = extra.parseObjectProperty;
                parseObjectPropertyKey = extra.parseObjectPropertyKey;
                parsePrimaryExpression = extra.parsePrimaryExpression;
                parsePostfixExpression = extra.parsePostfixExpression;
                parseProgram = extra.parseProgram;
                parsePropertyFunction = extra.parsePropertyFunction;
                parseRelationalExpression = extra.parseRelationalExpression;
                parseStatement = extra.parseStatement;
                parseShiftExpression = extra.parseShiftExpression;
                parseSwitchCase = extra.parseSwitchCase;
                parseUnaryExpression = extra.parseUnaryExpression;
                parseVariableDeclaration = extra.parseVariableDeclaration;
                parseVariableIdentifier = extra.parseVariableIdentifier;
              }

              if (typeof extra.scanRegExp === 'function') {
                advance = extra.advance;
                scanRegExp = extra.scanRegExp;
              }
            }

            function stringToArray(str) {
              var length = str.length,
                result = [],
                i;
              for (i = 0; i < length; ++i) {
                result[i] = str.charAt(i);
              }
              return result;
            }

            function parse(code, options) {
              var program, toString;

              toString = String;
              if (typeof code !== 'string' && !(code instanceof String)) {
                code = toString(code);
              }

              source = code;
              index = 0;
              lineNumber = source.length > 0 ? 1 : 0;
              lineStart = 0;
              length = source.length;
              buffer = null;
              state = {
                allowIn: true,
                labelSet: {},
                inFunctionBody: false,
                inIteration: false,
                inSwitch: false,
              };

              extra = {};
              if (typeof options !== 'undefined') {
                extra.range =
                  typeof options.range === 'boolean' && options.range;
                extra.loc = typeof options.loc === 'boolean' && options.loc;
                extra.raw = typeof options.raw === 'boolean' && options.raw;
                if (typeof options.tokens === 'boolean' && options.tokens) {
                  extra.tokens = [];
                }
                if (typeof options.comment === 'boolean' && options.comment) {
                  extra.comments = [];
                }
                if (typeof options.tolerant === 'boolean' && options.tolerant) {
                  extra.errors = [];
                }
              }

              if (length > 0) {
                if (typeof source[0] === 'undefined') {
                  // Try first to convert to a string. This is good as fast path
                  // for old IE which understands string indexing for string
                  // literals only and not for string object.
                  if (code instanceof String) {
                    source = code.valueOf();
                  }

                  // Force accessing the characters via an array.
                  if (typeof source[0] === 'undefined') {
                    source = stringToArray(code);
                  }
                }
              }

              patch();
              try {
                program = parseProgram();
                if (typeof extra.comments !== 'undefined') {
                  filterCommentLocation();
                  program.comments = extra.comments;
                }
                if (typeof extra.tokens !== 'undefined') {
                  filterTokenLocation();
                  program.tokens = extra.tokens;
                }
                if (typeof extra.errors !== 'undefined') {
                  program.errors = extra.errors;
                }
                if (extra.range || extra.loc) {
                  program.body = filterGroup(program.body);
                }
              } catch (e) {
                throw e;
              } finally {
                unpatch();
                extra = {};
              }

              return program;
            }

            // Sync with package.json.
            exports.version = '1.0.4';

            exports.parse = parse;

            // Deep copy.
            exports.Syntax = (function () {
              var name,
                types = {};

              if (typeof Object.create === 'function') {
                types = Object.create(null);
              }

              for (name in Syntax) {
                if (Syntax.hasOwnProperty(name)) {
                  types[name] = Syntax[name];
                }
              }

              if (typeof Object.freeze === 'function') {
                Object.freeze(types);
              }

              return types;
            })();
          });
          /* vim: set sw=4 ts=4 et tw=80 : */
        },
        {},
      ],
      4: [
        function (_dereq_, module, exports) {
          /*jshint node:true */
          'use strict';

          var esprima = _dereq_('esprima');

          // ---

          // we expose the flags so other tools can tweak the values (#8)
          exports.BYPASS_RECURSION = {
            root: true,
            comments: true,
            tokens: true,

            loc: true,
            range: true,

            parent: true,
            next: true,
            prev: true,

            // IMPORTANT! "value" can't be bypassed since it is used by object
            // expression
            type: true,
            raw: true,

            startToken: true,
            endToken: true,
          };

          // ---

          var _addLocInfo;

          // ---

          // parse string and return an augmented AST
          exports.parse = function parse(source, opts) {
            _addLocInfo = opts && opts.loc;
            source = source.toString();

            var ast = esprima.parse(source, {
              loc: _addLocInfo,
              range: true,
              tokens: true,
              comment: true,
            });

            // we augment just root node since program is "empty"
            // can't check `ast.body.length` because it might contain just comments
            if (!ast.tokens.length && !ast.comments.length) {
              ast.depth = 0;
              ast.startToken = ast.endToken = null;
              ast.toString = _nodeProto.toString;
              return ast;
            }

            instrumentTokens(ast, source);

            // update program range since it doesn't include white spaces and comments
            // before/after the program body by default
            var lastToken = ast.tokens[ast.tokens.length - 1];
            ast.range[0] = ast.tokens[0].range[0];
            ast.range[1] = lastToken.range[1];
            if (_addLocInfo) {
              ast.loc.start.line = 0;
              ast.loc.start.column = 0;
              ast.loc.end.line = lastToken.loc.end.line;
              ast.loc.end.column = lastToken.loc.end.column;
            }

            var toString = _nodeProto.toString;
            var instrumentNodes = function (node, parent, prev, next) {
              node.parent = parent;
              node.prev = prev;
              node.next = next;
              node.depth = parent ? parent.depth + 1 : 0; // used later for moonwalk

              node.toString = toString;

              // we do not add nextToken and prevToken to avoid updating even more
              // references during each remove/before/after you can grab the
              // prev/next token by simply accesing the startToken.prev and
              // endToken.next
              var prevToken = prev
                ? prev.endToken
                : parent
                ? parent.startToken
                : null;
              var nextToken = parent ? parent.endToken : null;
              node.startToken = prevToken
                ? getNodeStartToken(prevToken, node.range)
                : ast.tokens[0];
              node.endToken = nextToken
                ? getNodeEndToken(nextToken, node.range)
                : ast.tokens[ast.tokens.length - 1];
            };
            recursiveWalk(ast, instrumentNodes);

            return ast;
          };

          var _nodeProto = {};

          // get the node string
          _nodeProto.toString = function () {
            var str = '';
            var token = this.startToken;
            if (!token) return str;
            do {
              str += 'raw' in token ? token.raw : token.value;
              token = token.next;
            } while (token && token !== this.endToken.next);
            return str;
          };

          function getNodeStartToken(token, range) {
            var startRange = range[0];
            while (token) {
              if (token.range[0] >= startRange) {
                return token;
              }
              token = token.next;
            }
          }

          function getNodeEndToken(token, range) {
            var endRange = range[1];
            while (token) {
              if (token.range[1] <= endRange) {
                return token;
              }
              token = token.prev;
            }
          }

          function getPrevToken(tokens, range) {
            var result,
              token,
              startRange = range[0],
              n = tokens.length;
            while (n--) {
              token = tokens[n];
              if (token.range[1] <= startRange) {
                result = token;
                break;
              }
            }
            return result;
          }

          function instrumentTokens(ast, source) {
            var tokens = ast.tokens;

            // --- inject comments into tokens list
            var comments = ast.comments;
            var comment,
              q = -1,
              nComments = comments.length;

            while (++q < nComments) {
              comment = comments[q];
              // we edit it in place since it is faster, will also affect
              comment.raw =
                comment.type === 'Block'
                  ? '/*' + comment.value + '*/'
                  : '//' + comment.value;
              comment.type += 'Comment';

              var prevToken = getPrevToken(tokens, comment.range);
              var prevIndex = prevToken ? tokens.indexOf(prevToken) : -1;
              tokens.splice(prevIndex + 1, 0, comment);
            }

            // --- inject white spaces and line breaks

            // we create a new array since it's simpler than using splice, it will
            // also avoid mistakes
            var result = [];

            // insert white spaces before start of program
            var wsTokens;
            var firstToken = ast.tokens[0];
            var raw;
            if (firstToken.range[0]) {
              raw = source.substring(0, firstToken.range[0]);
              result = result.concat(getWhiteSpaceTokens(raw, null));
            }

            // insert white spaces between regular tokens
            // faster than forEach and reduce lookups
            var i = -1,
              nTokens = tokens.length,
              token,
              prev;
            var k, nWs;
            while (++i < nTokens) {
              token = tokens[i];
              if (i) {
                if (prev.range[1] < token.range[0]) {
                  wsTokens = getWhiteSpaceTokens(
                    source.substring(prev.range[1], token.range[0]),
                    prev
                  );
                  // faster than concat or push.apply
                  k = -1;
                  nWs = wsTokens.length;
                  while (++k < nWs) {
                    result.push(wsTokens[k]);
                  }
                }
              }
              result.push(token);
              prev = token;
            }

            // insert white spaces after end of program
            var lastToken = ast.tokens[ast.tokens.length - 1];
            if (lastToken.range[1] < source.length) {
              wsTokens = getWhiteSpaceTokens(
                source.substring(lastToken.range[1], source.length),
                lastToken
              );
              k = -1;
              nWs = wsTokens.length;
              while (++k < nWs) {
                result.push(wsTokens[k]);
              }
            }

            // --- instrument tokens

            // need to come afterwards since we add line breaks and comments
            var n;
            for (i = 0, n = result.length, token; i < n; i++) {
              token = result[i];
              token.prev = i ? result[i - 1] : undefined;
              token.next = result[i + 1];
              token.root = ast; // used internally
              // original indent is very important for block comments since some
              // transformations require manipulation of raw comment value
              if (
                token.type === 'BlockComment' &&
                token.prev &&
                token.prev.type === 'WhiteSpace' &&
                (!token.prev.prev || token.prev.prev.type === 'LineBreak')
              ) {
                token.originalIndent = token.prev.value;
              }
            }

            ast.tokens = result;
          }

          function getWhiteSpaceTokens(raw, prev) {
            var whiteSpaces = getWhiteSpaces(raw);

            var startRange = prev ? prev.range[1] : 0;
            // line starts at 1 !!!
            var startLine, startColumn;
            if (_addLocInfo) {
              startLine = prev ? prev.loc.end.line : 1;
              startColumn = prev ? prev.loc.end.column : 0;
            }

            var tokens = [];
            for (var i = 0, n = whiteSpaces.length, value; i < n; i++) {
              value = whiteSpaces[i];

              var wsToken = { value: value };
              var isBr = '\r\n'.indexOf(value) >= 0;
              wsToken.type = isBr ? 'LineBreak' : 'WhiteSpace';
              wsToken.range = [startRange, startRange + value.length];

              if (_addLocInfo) {
                wsToken.loc = {
                  start: {
                    line: startLine,
                    column: startColumn,
                  },
                  end: {
                    line: startLine, // yes, br starts and end on same line
                    column: startColumn + value.length,
                  },
                };

                if (isBr) {
                  // next token after a <br> always starts at zero and on next line
                  startLine = wsToken.loc.end.line + 1;
                  startColumn = 0;
                } else {
                  startLine = wsToken.loc.end.line;
                  startColumn = wsToken.loc.end.column;
                }
              }

              startRange += value.length;
              tokens.push(wsToken);
            }

            return tokens;
          }

          function getWhiteSpaces(source) {
            var result = [];
            var whiteSpaces = source.split('');
            var buf = '';
            for (
              var value, i = 0, nSpaces = whiteSpaces.length;
              i < nSpaces;
              i++
            ) {
              value = whiteSpaces[i];
              switch (value) {
                case '\n':
                  if (buf === '\r') {
                    // DOS line break
                    result.push(buf + value);
                  } else {
                    if (buf) {
                      result.push(buf);
                    }
                    // unix break
                    result.push(value);
                  }
                  buf = '';
                  break;
                case '\r':
                  // might be multiple consecutive Mac breaks
                  if (buf) {
                    result.push(buf);
                  }
                  buf = value;
                  break;
                default:
                  if (buf === '\r') {
                    result.push(buf);
                    buf = value;
                  } else {
                    // group multiple white spaces into same token
                    buf += value;
                  }
              }
            }
            if (buf) {
              result.push(buf);
            }
            return result;
          }

          exports.recursive = recursiveWalk;

          // heavily inspired by node-falafel
          // walk nodes recursively starting from root
          function recursiveWalk(node, fn, parent, prev, next) {
            // sparse arrays might have `null` elements, so we skip those for now
            // see issue #15
            if (!node || fn(node, parent, prev, next) === false) {
              return; // stop recursion
            }

            // faster than for in
            var keys = Object.keys(node),
              child,
              key;

            for (var i = 0, nKeys = keys.length; i < nKeys; i++) {
              key = keys[i];
              child = node[key];

              // only need to recurse real nodes and arrays
              // ps: typeof null == 'object'
              if (
                !child ||
                typeof child !== 'object' ||
                exports.BYPASS_RECURSION[key]
              ) {
                continue;
              }

              // inception
              if (typeof child.type === 'string') {
                // faster than boolean coercion
                recursiveWalk(child, fn, node);
              } else if (typeof child.length === 'number') {
                // faster than Array.isArray and boolean coercion
                // faster than forEach
                for (var k = 0, nChilds = child.length; k < nChilds; k++) {
                  recursiveWalk(
                    child[k],
                    fn,
                    node,
                    k ? child[k - 1] : undefined,
                    child[k + 1]
                  );
                }
              }
            }
          }

          // walk AST starting from leaf nodes
          exports.moonwalk = function moonwalk(ast, fn) {
            if (typeof ast === 'string') {
              ast = exports.parse(ast);
            }

            // we create a separate array for each depth and than we flatten it to
            // boost performance, way faster than doing an insertion sort
            var swap = [];
            recursiveWalk(ast, function (node) {
              if (!swap[node.depth]) {
                swap[node.depth] = [];
              }
              swap[node.depth].push(node);
            });

            var nodes = [];
            var nDepths = swap.length,
              cur;
            while ((cur = swap[--nDepths])) {
              for (var i = 0, n = cur.length; i < n; i++) {
                nodes.push(cur[i]);
              }
            }

            nodes.forEach(fn);
            return ast;
          };
        },
        { esprima: 3 },
      ],
      5: [
        function (_dereq_, module, exports) {
          (function () {
            var util = _dereq_('util');
            var utils = _dereq_('./utils');

            var toString = Object.prototype.toString;
            var hasOwnProperty = Object.prototype.hasOwnProperty;

            var PRECEDENCE = {
              SEQUENCE: 0,
              YIELD: 1,
              ASSIGNMENT: 1,
              CONDITIONAL: 2,
              ARROW_FUNCTION: 2,
              LOGICAL_OR: 3,
              LOGICAL_AND: 4,
              BITWISE_OR: 5,
              BITWISE_XOR: 6,
              BITWISE_AND: 7,
              EQUALITY: 8,
              RELATIONAL: 9,
              BITWISE_SHIFT: 10,
              ADDITIVE: 11,
              MULTIPLICATIVE: 12,
              UNARY: 13,
              POSTFIX: 14,
              CALL: 15,
              NEW: 16,
              TAGGED_TEMPLATE: 17,
              MEMBER: 18,
              PRIMARY: 19,
            };

            var BINARY_PRECEDENCE = {
              '||': PRECEDENCE.LOGICAL_OR,
              '&&': PRECEDENCE.LOGICAL_AND,
              '|': PRECEDENCE.BITWISE_OR,
              '^': PRECEDENCE.BITWISE_XOR,
              '&': PRECEDENCE.BITWISE_AND,
              '==': PRECEDENCE.EQUALITY,
              '!=': PRECEDENCE.EQUALITY,
              '===': PRECEDENCE.EQUALITY,
              '!==': PRECEDENCE.EQUALITY,
              '<': PRECEDENCE.RELATIONAL,
              '>': PRECEDENCE.RELATIONAL,
              '<=': PRECEDENCE.RELATIONAL,
              '>=': PRECEDENCE.RELATIONAL,
              in: PRECEDENCE.RELATIONAL,
              instanceof: PRECEDENCE.RELATIONAL,
              '<<': PRECEDENCE.BITWISE_SHIFT,
              '>>': PRECEDENCE.BITWISE_SHIFT,
              '>>>': PRECEDENCE.BITWISE_SHIFT,
              '+': PRECEDENCE.ADDITIVE,
              '-': PRECEDENCE.ADDITIVE,
              '*': PRECEDENCE.MULTIPLICATIVE,
              '%': PRECEDENCE.MULTIPLICATIVE,
              '/': PRECEDENCE.MULTIPLICATIVE,
            };

            //these operators expect numbers
            var UNARY_NUM_OPS = {
              '-': '_negate',
              '+': 'to_number',
              '~': '~', //bitwise not
            };

            //these operators expect numbers
            var BINARY_NUM_OPS = {
              // `+` is not in this list because it's a special case
              '-': '-',
              '%': '%',
              '*': '*',
              '/': '_divide',
              // let's assume these comparison operators are only used on numbers
              //'<': '<', '<=': '<=',
              //'>': '>', '>=': '>=',
              '&': '&', //bitwise and
              '|': '|', //bitwise or
              '^': '^', //bitwise xor
              '<<': '<<', //bitwise left shift
              '>>': '>>', //bitwise sign-propagating right shift
              '>>>': '_bitwise_zfrs', //bitwise zero-fill right shift
            };

            //these operators will always return true/false
            var BOOL_SAFE_OPS = {
              '===': 1,
              '!==': 1,
              '==': 1,
              '!=': 1,
              '<': 1,
              '<=': 1,
              '>': 1,
              '>=': 1,
              in: 1,
              instanceof: 1,
            };

            //these operators will always return numbers
            var NUM_SAFE_UNARY_OPS = {
              '-': 1,
              '+': 1,
              '~': 1,
            };
            var NUM_SAFE_BINARY_OPS = {
              // `+` is not in this list because it's a special case
              '-': 1,
              '%': 1,
              '*': 1,
              '/': 1,
              '&': 1,
              '|': 1,
              '^': 1,
              '<<': 1,
              '>>': 1,
              '>>>': 1,
            };

            //built-in globals (should not be re-assigned)
            var GLOBALS = {
              Array: 1,
              Boolean: 1,
              Buffer: 1,
              Date: 1,
              Error: 1,
              RangeError: 1,
              ReferenceError: 1,
              SyntaxError: 1,
              TypeError: 1,
              Function: 1,
              Infinity: 1,
              JSON: 1,
              Math: 1,
              NaN: 1,
              Number: 1,
              Object: 1,
              RegExp: 1,
              String: 1,
              console: 1,
              decodeURI: 1,
              decodeURIComponent: 1,
              encodeURI: 1,
              encodeURIComponent: 1,
              escape: 1,
              eval: 1,
              isFinite: 1,
              isNaN: 1,
              parseFloat: 1,
              parseInt: 1,
              undefined: 1,
              unescape: 1,
            };

            function Generator(opts) {
              this.opts = Object.create(opts || {});
            }

            Generator.prototype = {
              //accepts a BlockStatement or an ExpressionStatement (turns to block)
              // assumes the `{}` have already been generated
              toBlock: function (node) {
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
              Body: function (node) {
                var opts = this.opts;
                var scopeNode =
                  node.type === 'BlockStatement' ? node.parent : node;
                var scopeIndex = scopeNode.scopeIndex || Object.create(null);
                var results = [];
                opts.indentLevel += 1;
                if (scopeIndex.thisFound) {
                  if (node.type === 'Program') {
                    results.push(this.indent() + '$this_ = $global;\n');
                  } else {
                    results.push(
                      this.indent() + '$this_ = Func::getContext();\n'
                    );
                  }
                }
                if (scopeIndex.argumentsFound && node.type !== 'Program') {
                  results.push(
                    this.indent() + '$arguments = Func::getArguments();\n'
                  );
                }
                if (node.vars && opts.initVars) {
                  var declarations = [];
                  Object.keys(node.vars).forEach(function (name) {
                    declarations.push(encodeVarName(name) + ' = null;');
                  });
                  if (declarations.length) {
                    results.push(this.indent() + declarations.join(' ') + '\n');
                  }
                }
                var funcDeclarations = node.funcs;
                if (funcDeclarations) {
                  Object.keys(funcDeclarations).forEach(function (name) {
                    var func = this.FunctionExpression(funcDeclarations[name]);
                    results.push(
                      this.indent() + encodeVarName(name) + ' = ' + func + ';\n'
                    );
                  }, this);
                }

                node.body.forEach(function (node) {
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

              BlockStatement: function (node) {
                var results = ['{\n'];
                results.push(this.Body(node));
                results.push(this.indent() + '}');
                return results.join('') + '\n';
              },

              VariableDeclaration: function (node) {
                var results = [];
                node.declarations.forEach(function (node) {
                  if (node.init) {
                    results.push(
                      encodeVar(node.id) + ' = ' + this.generate(node.init)
                    );
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

              IfStatement: function (node) {
                var results = ['if ('];
                results.push(this.truthyWrap(node.test));
                results.push(') {\n');
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

              SwitchStatement: function (node) {
                var opts = this.opts;
                var results = ['switch ('];
                results.push(this.generate(node.discriminant));
                results.push(') {\n');
                opts.indentLevel += 1;
                node.cases.forEach(function (node) {
                  results.push(this.indent());
                  if (node.test === null) {
                    results.push('default:\n');
                  } else {
                    results.push('case ' + this.generate(node.test) + ':\n');
                  }
                  opts.indentLevel += 1;
                  node.consequent.forEach(function (node) {
                    results.push(this.indent() + this.generate(node));
                  }, this);
                  opts.indentLevel -= 1;
                }, this);
                opts.indentLevel -= 1;
                results.push(this.indent() + '}');
                return results.join('') + '\n';
              },

              ConditionalExpression: function (node) {
                //PHP has "non-obvious" ternary operator precedence according to the docs
                // these are safe: Literal, Identifier, ThisExpression,
                // FunctionExpression, CallExpression, MemberExpression, NewExpression,
                // ArrayExpression, ObjectExpression, SequenceExpression, UnaryExpression
                var alternate = this.generate(node.alternate);
                switch (node.alternate.type) {
                  case 'AssignmentExpression':
                  case 'BinaryExpression':
                  case 'LogicalExpression':
                  case 'UpdateExpression':
                  case 'ConditionalExpression':
                    alternate = '(' + alternate + ')';
                    break;
                }
                return (
                  this.truthyWrap(node.test) +
                  ' ? ' +
                  this.generate(node.consequent) +
                  ' : ' +
                  alternate
                );
              },

              ForStatement: function (node) {
                var results = ['for ('];
                results.push(this.generate(node.init) + '; ');
                results.push(this.truthyWrap(node.test) + '; ');
                results.push(this.generate(node.update));
                results.push(') {\n');
                results.push(this.toBlock(node.body));
                results.push(this.indent() + '}');
                return results.join('') + '\n';
              },

              ForInStatement: function (node) {
                var results = [];
                if (node.left.type === 'VariableDeclaration') {
                  var identifier = node.left.declarations[0].id;
                } else if (node.left.type === 'Identifier') {
                  identifier = node.left;
                } else {
                  throw new Error(
                    'Unknown left part of for..in `' + node.left.type + '`'
                  );
                }
                results.push('foreach (keys(');
                results.push(
                  this.generate(node.right) +
                    ') as ' +
                    encodeVar(identifier) +
                    ') {\n'
                );
                results.push(this.toBlock(node.body));
                results.push(this.indent() + '}');
                return results.join('') + '\n';
              },

              WhileStatement: function (node) {
                var results = ['while ('];
                results.push(this.truthyWrap(node.test));
                results.push(') {\n');
                results.push(this.toBlock(node.body));
                results.push(this.indent() + '}');
                return results.join('') + '\n';
              },

              DoWhileStatement: function (node) {
                var results = ['do {\n'];
                results.push(this.toBlock(node.body));
                results.push(
                  this.indent() +
                    '} while (' +
                    this.truthyWrap(node.test) +
                    ');'
                );
                return results.join('') + '\n';
              },

              TryStatement: function (node) {
                var catchClause = node.handlers[0];
                var param = catchClause.param;
                var results = ['try {\n'];
                results.push(this.Body(node.block));
                results.push(
                  this.indent() +
                    '} catch(Exception ' +
                    encodeVar(param) +
                    ') {\n'
                );
                results.push(
                  this.indent(1) +
                    'if (' +
                    encodeVar(param) +
                    ' instanceof Ex) ' +
                    encodeVar(param) +
                    ' = ' +
                    encodeVar(param) +
                    '->value;\n'
                );
                results.push(this.Body(catchClause.body));
                results.push(this.indent() + '}');
                return results.join('') + '\n';
              },

              ThrowStatement: function (node) {
                return 'throw new Ex(' + this.generate(node.argument) + ');\n';
              },

              FunctionExpression: function (node) {
                var meta = [];
                var opts = this.opts;
                var parentIsStrict = opts.isStrict;
                opts.isStrict =
                  parentIsStrict || isStrictDirective(node.body.body[0]);
                if (node.useStrict === false) {
                  opts.isStrict = false;
                }
                if (opts.isStrict) {
                  meta.push('"strict" => true');
                }
                var results = ['new Func('];
                if (node.id) {
                  results.push(encodeString(node.id.name) + ', ');
                }
                var params = node.params.map(function (param) {
                  return encodeVar(param) + ' = null';
                });
                var scopeIndex = node.scopeIndex || Object.create(null);
                var functionName = node.id ? node.id.name : '';
                if (scopeIndex.unresolved[functionName]) {
                  delete scopeIndex.unresolved[functionName];
                }
                var unresolvedRefs = Object.keys(scopeIndex.unresolved).map(
                  function (name) {
                    return encodeVarName(name);
                  }
                );
                var useClause = unresolvedRefs.length
                  ? 'use (&' + unresolvedRefs.join(', &') + ') '
                  : '';
                results.push(
                  'function(' + params.join(', ') + ') ' + useClause + '{\n'
                );
                if (scopeIndex.referenced[functionName]) {
                  results.push(
                    this.indent(1) +
                      encodeVarName(functionName) +
                      ' = Func::getCurrent();\n'
                  );
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

              ArrayExpression: function (node) {
                var items = node.elements.map(function (el) {
                  return el === null ? 'Arr::$empty' : this.generate(el);
                }, this);
                return 'new Arr(' + items.join(', ') + ')';
              },

              ObjectExpression: function (node) {
                var items = [];
                node.properties.forEach(function (node) {
                  var key = node.key;
                  //key can be a literal or an identifier (quoted or not)
                  var keyName =
                    key.type === 'Identifier' ? key.name : String(key.value);
                  items.push(encodeString(keyName));
                  items.push(this.generate(node.value));
                }, this);
                return 'new ObjectClass(' + items.join(', ') + ')';
              },

              CallExpression: function (node) {
                var args = node.arguments.map(function (arg) {
                  return this.generate(arg);
                }, this);
                if (node.callee.type === 'MemberExpression') {
                  return (
                    'call_method(' +
                    this.generate(node.callee.object) +
                    ', ' +
                    this.encodeProp(node.callee) +
                    (args.length ? ', ' + args.join(', ') : '') +
                    ')'
                  );
                } else {
                  return (
                    'call(' +
                    this.generate(node.callee) +
                    (args.length ? ', ' + args.join(', ') : '') +
                    ')'
                  );
                }
              },

              MemberExpression: function (node) {
                return (
                  'get(' +
                  this.generate(node.object) +
                  ', ' +
                  this.encodeProp(node) +
                  ')'
                );
              },

              NewExpression: function (node) {
                var args = node.arguments.map(function (arg) {
                  return this.generate(arg);
                }, this);
                return (
                  '_new(' +
                  this.generate(node.callee) +
                  (args.length ? ', ' + args.join(', ') : '') +
                  ')'
                );
              },

              AssignmentExpression: function (node) {
                if (node.left.type === 'MemberExpression') {
                  //`a.b = 1` -> `set(a, "b", 1)` but `a.b += 1` -> `set(a, "b", 1, "+=")`
                  if (node.operator === '=') {
                    return (
                      'set(' +
                      this.generate(node.left.object) +
                      ', ' +
                      this.encodeProp(node.left) +
                      ', ' +
                      this.generate(node.right) +
                      ')'
                    );
                  } else {
                    return (
                      'set(' +
                      this.generate(node.left.object) +
                      ', ' +
                      this.encodeProp(node.left) +
                      ', ' +
                      this.generate(node.right) +
                      ', "' +
                      node.operator +
                      '")'
                    );
                  }
                }
                if (hasOwnProperty.call(GLOBALS, node.left.name)) {
                  var scope = utils.getParentScope(node);
                  if (scope.type === 'Program') {
                    node.left.appendSuffix = '_';
                  }
                }
                //special case += since plus can be either add or concatenate
                if (node.operator === '+=') {
                  var ident = this.generate(node.left);
                  return (
                    ident +
                    ' = _plus(' +
                    ident +
                    ', ' +
                    this.generate(node.right) +
                    ')'
                  );
                }
                return (
                  encodeVar(node.left) +
                  ' ' +
                  node.operator +
                  ' ' +
                  this.generate(node.right)
                );
              },

              UpdateExpression: function (node) {
                if (node.argument.type === 'MemberExpression') {
                  //convert `++a` to `a += 1`
                  var operator = node.operator === '++' ? '+=' : '-=';
                  // ++i returns the new (updated) value; i++ returns the old value
                  var returnOld = node.prefix ? false : true;
                  return (
                    'set(' +
                    this.generate(node.argument.object) +
                    ', ' +
                    this.encodeProp(node.argument) +
                    ', 1, "' +
                    operator +
                    '", ' +
                    returnOld +
                    ')'
                  );
                }
                //special case (i++ and ++i) assume type is number
                if (node.prefix) {
                  return node.operator + this.generate(node.argument);
                } else {
                  return this.generate(node.argument) + node.operator;
                }
              },

              LogicalExpression: function (node) {
                var op = node.operator;
                if (isBooleanExpr(node)) {
                  var result =
                    this.generate(node.left) +
                    ' ' +
                    op +
                    ' ' +
                    this.generate(node.right);
                  if (opPrecedence(op) < opPrecedence(node.parent.operator)) {
                    result = '(' + result + ')';
                  }
                  return result;
                }
                if (op === '&&') {
                  return this.genAnd(node);
                }
                if (op === '||') {
                  return this.genOr(node);
                }
              },

              genAnd: function (node) {
                var opts = this.opts;
                opts.andDepth = opts.andDepth == null ? 0 : opts.andDepth + 1;
                var name =
                  opts.andDepth === 0 ? '$and_' : '$and' + opts.andDepth + '_';
                var test = '(' + name + ' = ' + this.generate(node.left) + ')';
                if (!isBooleanExpr(node.left)) {
                  test = 'is' + test;
                }
                var result =
                  '(' +
                  test +
                  ' ? ' +
                  this.generate(node.right) +
                  ' : ' +
                  name +
                  ')';
                opts.andDepth = opts.andDepth === 0 ? null : opts.andDepth - 1;
                return result;
              },

              genOr: function (node) {
                var opts = this.opts;
                opts.orDepth = opts.orDepth == null ? 0 : opts.orDepth + 1;
                var name =
                  opts.orDepth === 0 ? '$or_' : '$or' + opts.orDepth + '_';
                var test = '(' + name + ' = ' + this.generate(node.left) + ')';
                if (!isBooleanExpr(node.left)) {
                  test = 'is' + test;
                }
                var result =
                  '(' +
                  test +
                  ' ? ' +
                  name +
                  ' : ' +
                  this.generate(node.right) +
                  ')';
                opts.orDepth = opts.orDepth === 0 ? null : opts.orDepth - 1;
                return result;
              },

              BinaryExpression: function (node) {
                var op = node.operator;
                if (op === '+') {
                  var terms = node.terms.map(this.generate, this);
                  if (node.isConcat) {
                    return '_concat(' + terms.join(', ') + ')';
                  } else {
                    return '_plus(' + terms.join(', ') + ')';
                  }
                }
                if (op === '==') {
                  return (
                    'eq(' +
                    this.generate(node.left) +
                    ', ' +
                    this.generate(node.right) +
                    ')'
                  );
                }
                if (op === '!=') {
                  return (
                    '!eq(' +
                    this.generate(node.left) +
                    ', ' +
                    this.generate(node.right) +
                    ')'
                  );
                }
                if (['<', '>', '<=', '>='].indexOf(op) > -1) {
                  return (
                      'cmp(' +
                      this.generate(node.left) +
                      ', \'' + op + '\', ' +
                      this.generate(node.right) +
                      ')'
                  );
                }
                // some ops will return int in which case we need to cast result
                if (op === '%') {
                  var castFloat = true;
                }
                var toNumber = false;
                if (op in BINARY_NUM_OPS) {
                  op = BINARY_NUM_OPS[op];
                  toNumber = true;
                } else if (isWord(op)) {
                  //in, instanceof
                  op = '_' + op;
                }
                var leftExpr = this.generate(node.left);
                var rightExpr = this.generate(node.right);
                if (isWord(op)) {
                  return op + '(' + leftExpr + ', ' + rightExpr + ')';
                } else if (toNumber) {
                  if (!isNumericExpr(node.left)) {
                    leftExpr = 'to_number(' + leftExpr + ')';
                  }
                  if (!isNumericExpr(node.right)) {
                    rightExpr = 'to_number(' + rightExpr + ')';
                  }
                }
                var result = leftExpr + ' ' + op + ' ' + rightExpr;
                if (castFloat) {
                  result = '(float)(' + result + ')';
                } else if (
                  opPrecedence(node.operator) <
                  opPrecedence(node.parent.operator)
                ) {
                  return '(' + result + ')';
                }
                return result;
              },

              UnaryExpression: function (node) {
                var op = node.operator;
                if (op === '!') {
                  return isBooleanExpr(node.argument)
                    ? '!' + this.generate(node.argument)
                    : 'not(' + this.generate(node.argument) + ')';
                }
                //special case here: -3 is just a number literal, not negate(3)
                if (
                  op === '-' &&
                  node.argument.type === 'Literal' &&
                  typeof node.argument.value === 'number'
                ) {
                  return '-' + encodeLiteral(node.argument.value);
                }
                //special case here: `typeof a` can be called on a non-declared variable
                if (op === 'typeof' && node.argument.type === 'Identifier') {
                  //isset($a) ? _typeof($a) : "undefined"
                  return (
                    '(isset(' +
                    this.generate(node.argument) +
                    ') ? _typeof(' +
                    this.generate(node.argument) +
                    ') : "undefined")'
                  );
                }
                //special case here: `delete a.b.c` needs to compute a.b and then delete c
                if (
                  op === 'delete' &&
                  node.argument.type === 'MemberExpression'
                ) {
                  return (
                    '_delete(' +
                    this.generate(node.argument.object) +
                    ', ' +
                    this.encodeProp(node.argument) +
                    ')'
                  );
                }
                var toNumber = false;
                if (op in UNARY_NUM_OPS) {
                  op = UNARY_NUM_OPS[op];
                  toNumber = true;
                } else if (isWord(op)) {
                  //delete, typeof, void
                  op = '_' + op;
                }
                var result = this.generate(node.argument);
                if (isWord(op)) {
                  result = '(' + result + ')';
                } else if (toNumber) {
                  if (
                    node.argument.type !== 'Literal' ||
                    typeof node.argument.value !== 'number'
                  ) {
                    result = 'to_number(' + result + ')';
                  }
                }
                return op + result;
              },

              SequenceExpression: function (node) {
                var expressions = node.expressions.map(function (node) {
                  return this.generate(node);
                }, this);
                //allow sequence expression only in the init of a for loop
                if (
                  node.parent.type === 'ForStatement' &&
                  node.parent.init === node
                ) {
                  return expressions.join(', ');
                } else {
                  return '_seq(' + expressions.join(', ') + ')';
                }
              },

              // used from if/for/while and ternary to determine truthiness
              truthyWrap: function (node) {
                //node can be null, for instance: `for (;;) {}`
                if (!node) return '';
                var op = node.operator;
                var type = node.type;
                if (type === 'LogicalExpression') {
                  if (op === '&&' || op === '||') {
                    var result =
                      this.truthyWrap(node.left) +
                      ' ' +
                      op +
                      ' ' +
                      this.truthyWrap(node.right);
                    if (opPrecedence(op) < opPrecedence(node.parent.operator)) {
                      result = '(' + result + ')';
                    }
                    return result;
                  }
                }
                if (isBooleanExpr(node)) {
                  //prevent is($a === $b) and is(_in($a, $b)) and is(not($a))
                  return this.generate(node);
                } else {
                  return 'is(' + this.generate(node) + ')';
                }
              },

              generate: function (node) {
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
                    result = isStrictDirective(node)
                      ? ''
                      : this.generate(node.expression) + ';\n';
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

              encodeProp: function (node) {
                if (node.computed) {
                  //a[0] or a[b] or a[b + 1]
                  return this.generate(node.property);
                } else {
                  //a.b
                  return encodeLiteral(node.property.name);
                }
              },

              indent: function (count) {
                var indentLevel = this.opts.indentLevel + (count || 0);
                return repeat('  ', indentLevel);
              },
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

            function isBooleanExpr(node) {
              if (node.type === 'LogicalExpression') {
                //prevent unnecessary (is($and_ = $a === $b) ? $c === $d : $and_)
                return isBooleanExpr(node.left) && isBooleanExpr(node.right);
              }
              if (node.type === 'Literal' && typeof node.value === 'boolean') {
                //prevent is(true)
                return true;
              }
              if (
                node.type === 'BinaryExpression' &&
                node.operator in BOOL_SAFE_OPS
              ) {
                //prevent is($a === $b) and is(_in($a, $b))
                return true;
              }
              if (node.type === 'UnaryExpression' && node.operator === '!') {
                //prevent is(not($thing))
                return true;
              }
              return false;
            }

            // used to determine when we can omit to_number() so as to prevent stuff
            //  like: to_number(5.0 - 2.0) - 1.0;
            function isNumericExpr(node) {
              if (node.type === 'Literal' && typeof node.value === 'number') {
                return true;
              }
              if (
                node.type === 'UnaryExpression' &&
                node.operator in NUM_SAFE_UNARY_OPS
              ) {
                return true;
              }
              if (
                node.type === 'BinaryExpression' &&
                node.operator in NUM_SAFE_BINARY_OPS
              ) {
                return true;
              }
            }

            function encodeLiteral(value) {
              var type = value === null ? 'null' : typeof value;
              if (type === 'undefined') {
                return 'null';
              }
              if (type === 'null') {
                return 'ObjectClass::$null';
              }
              if (type === 'string') {
                return encodeString(value);
              }
              if (type === 'boolean') {
                return value.toString();
              }
              if (type === 'number') {
                value = value.toString();
                return ~value.indexOf('.') || ~value.indexOf('e')
                  ? value
                  : value + '.0';
              }
              if (toString.call(value) === '[object RegExp]') {
                return encodeRegExp(value);
              }
              throw new Error(
                'No handler for literal of type: ' +
                  type +
                  ': ' +
                  util.inspect(value)
              );
            }

            function encodeRegExp(value) {
              var flags = '';
              if (value.global) flags += 'g';
              if (value.ignoreCase) flags += 'i';
              if (value.multiline) flags += 'm';
              //normalize source to ensure no forward slashes are "escaped"
              var source = value.source.replace(/\\./g, function (s) {
                return s === '\\/' ? '/' : s;
              });
              return (
                'new RegExp(' +
                encodeString(source) +
                ', ' +
                encodeString(flags) +
                ')'
              );
            }

            function encodeString(value) {
              return utils.encodeString(value);
            }

            function encodeVar(identifier) {
              var name = identifier.name;
              return encodeVarName(name, identifier.appendSuffix);
            }

            function encodeVarName(name, suffix) {
              return utils.encodeVarName(name, suffix);
            }

            function repeat(str, count) {
              return new Array(count + 1).join(str);
            }

            function isWord(str) {
              return str.match(/^[a-z_]+$/) ? true : false;
            }

            function opPrecedence(op) {
              return BINARY_PRECEDENCE[op];
            }

            exports.generate = function (ast, opts) {
              var generator = new Generator(opts);
              return generator.generate(ast);
            };
          })();
        },
        { './utils': 7, util: 13 },
      ],
      6: [
        function (_dereq_, module, exports) {
          (function (__dirname) {
            /*global module, require, exports*/
            (function () {
              var fs = _dereq_('fs');
              var path = _dereq_('path');
              var util = _dereq_('util');
              var utils = _dereq_('./utils');

              var rocambole = _dereq_('rocambole');
              var escope = _dereq_('escope');

              var codegen = _dereq_('./codegen');

              var COMMENT_OR_STRING =
                /'(\\.|[^'\n])*'|"(\\.|[^"\n])*"|\/\*([\s\S]*?)\*\/|\/\/.*?\n/g;

              /**
               * opts.source - JS source code to transform
               * opts.initVars - initialize all variables in PHP (default: true)
               */
              module.exports = function (opts) {
                var transformer = new Transformer();
                return transformer.process(opts);
              };

              module.exports.Transformer = Transformer;
              module.exports.buildRuntime = buildRuntime;

              var nodeHandlers = {
                NewExpression: function (node) {
                  if (
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'Function'
                  ) {
                    var args = node.arguments.slice(0);
                    //ensure all arguments are string literals
                    for (var i = 0, len = args.length; i < len; i++) {
                      var arg = args[i];
                      if (
                        arg.type !== 'Literal' ||
                        typeof arg.value !== 'string'
                      ) {
                        throw new Error(
                          'Parse Error: new Function() not supported except with string literal'
                        );
                      }
                    }
                    args = args.map(function (arg) {
                      return arg.value;
                    });
                    var body = args.pop();
                    var code =
                      '(function(' + args.join(', ') + ') {' + body + '})';
                    var ast = this.parse(code);
                    var newNode = ast.body[0].expression;
                    this.replaceNode(node, newNode);
                    setHidden(newNode, 'useStrict', false);
                  }
                },
                VariableDeclaration: function (node) {
                  var scope = utils.getParentScope(node);
                  var varNames = scope.vars || setHidden(scope, 'vars', {});
                  node.declarations.forEach(function (decl) {
                    varNames[decl.id.name] = true;
                  });
                },
                FunctionDeclaration: function (node) {
                  var name = node.id.name;
                  var scope = utils.getParentScope(node);
                  var funcDeclarations =
                    scope.funcs || setHidden(scope, 'funcs', {});
                  funcDeclarations[name] = node;
                },
                BinaryExpression: function (node) {
                  if (node.operator === '+') {
                    var terms = getTerms(node, '+');
                    var isConcat = terms.some(function (node) {
                      return (
                        node.type === 'Literal' &&
                        typeof node.value === 'string'
                      );
                    });
                    setHidden(node, 'terms', terms);
                    setHidden(node, 'isConcat', isConcat);
                  }
                },
              };

              function getTerms(node, op) {
                var terms = [];
                if (
                  node.left.type === 'BinaryExpression' &&
                  node.left.operator === op
                ) {
                  terms = terms.concat(getTerms(node.left, op));
                } else {
                  terms.push(node.left);
                }
                if (
                  node.right.type === 'BinaryExpression' &&
                  node.right.operator === op
                ) {
                  terms = terms.concat(getTerms(node.right, op));
                } else {
                  terms.push(node.right);
                }
                return terms;
              }

              function Transformer() {
                return this instanceof Transformer ? this : new Transformer();
              }

              Transformer.prototype.process = function (opts) {
                opts = Object.create(opts || {});
                opts.initVars = opts.initVars !== false;
                this.opts = opts;
                var ast = this.parse(opts.source);
                return codegen.generate(ast, opts);
              };

              Transformer.prototype.parse = function (source) {
                source = source.trim();
                var ast = rocambole.parse(source);
                this.transform(ast);
                return ast;
              };

              Transformer.prototype.transform = function (ast) {
                var self = this;
                //walk tree and let handlers manipulate specific nodes (by type)
                rocambole.recursive(ast, function (node) {
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
                scopes.forEach(function (scope) {
                  if (scope.type === 'catch') {
                    var param = scope.variables[0];
                    //todo: rename only if parent scope has any references with same name
                    var identifiers = [param.identifiers[0]];
                    param.references.forEach(function (ref) {
                      identifiers.push(ref.identifier);
                    });
                    var suffix = '_' + ++count + '_';
                    identifiers.forEach(function (identifier) {
                      identifier.appendSuffix = suffix;
                    });
                  }
                });
              };

              Transformer.prototype.replaceNode = function (oldNode, newNode) {
                var parent = oldNode.parent;
                Object.keys(parent).forEach(function (key) {
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
                scope.variables.forEach(function (variable) {
                  defined[variable.name] = true;
                });
                //get all variable names referenced and unresolved ones
                var referenced = Object.create(null);
                var unresolved = Object.create(null);
                scope.references.forEach(function (ref) {
                  var name = ref.identifier.name;
                  referenced[name] = true;
                  if (!ref.resolved || ref.resolved.scope !== scope) {
                    unresolved[name] = true;
                  }
                });
                //get descendant references not defined locally
                var childScopes = scope.childScopes || [];
                childScopes.forEach(function (childScope) {
                  var index = indexScope(childScope);
                  Object.keys(index.unresolved).forEach(function (name) {
                    referenced[name] = true;
                    if (!defined[name]) {
                      unresolved[name] = true;
                    }
                  });
                });
                var firstVar = scope.variables[0];
                var argumentsFound =
                  firstVar &&
                  firstVar.name === 'arguments' &&
                  firstVar.references.length;
                var scopeIndex = {
                  defined: defined,
                  referenced: referenced,
                  unresolved: unresolved,
                  thisFound: scope.thisFound,
                  argumentsFound: !!argumentsFound,
                };
                setHidden(scope.block, 'scopeIndex', scopeIndex);
                return scopeIndex;
              }

              function buildRuntime(opts) {
                opts = opts || {};
                if (!opts.includeAllModules) {
                  var includeModules = opts.includeModules || [];
                  includeModules = includeModules.reduce(function (
                    includeModules,
                    name
                  ) {
                    includeModules[name] = true;
                    return includeModules;
                  },
                  {});
                }
                var source = fs.readFileSync(
                  path.join(__dirname, '../runtime.php'),
                  'utf8'
                );
                var fileList = [];
                var totalModules = 0;
                source.replace(/require_once\('(.+?)'\)/g, function (_, file) {
                  var name = file.split('/').pop().split('.')[0];
                  if (includeModules && file.indexOf('php/modules/') === 0) {
                    if (!includeModules.hasOwnProperty(name)) {
                      return;
                    }
                    totalModules += 1;
                  }
                  if (name === 'Debug' && !opts.includeDebug) {
                    return;
                  }
                  if (name === 'Test' && !opts.includeTest) {
                    return;
                  }
                  fileList.push(file);
                });
                var output = fileList.map(function (file) {
                  var name = file.split('/').pop().split('.')[0];
                  //if no modules were included, remove the Module reference
                  if (
                    includeModules &&
                    totalModules === 0 &&
                    name === 'Module'
                  ) {
                    return;
                  }
                  if (opts.log) {
                    opts.log('Adding runtime file: ' + file);
                  }
                  var source = fs.readFileSync(
                    path.join(__dirname, '..', file),
                    'utf8'
                  );
                  source = source.replace(/^<\?php/, '');
                  source = source.replace(/^\n+|\n+$/g, '');
                  return source;
                });
                output.unshift('mb_internal_encoding("UTF-8");\n');
                //todo: let's be smart here about detection; regions like "America/Los_Angeles" use PST/PDT depending on DST
                //var timezone = new Date().toString().slice(-4, -1);
                //output.unshift('define("LOCAL_TZ", "' + timezone + '");\n');
                output = output.join('\n');
                output = removeComments(output);
                output = removeEmptyLines(output);
                return output;
              }

              function removeComments(code) {
                //primitive method of removing comments from PHP; it might choke on some
                // edge cases, but it's OK because we don't have anything too funky in our
                // runtime code
                return code.replace(COMMENT_OR_STRING, function (match) {
                  var ch = match.charAt(0);
                  if (ch === '"' || ch === "'") {
                    return match;
                  }
                  return match.slice(0, 2) === '//' ? '\n' : '';
                });
              }

              function removeEmptyLines(code) {
                return code.replace(/\n([ \t]*\n)+/g, '\n');
              }

              function setHidden(object, name, value) {
                Object.defineProperty(object, name, {
                  value: value,
                  enumerable: false,
                  writable: true,
                  configurable: true,
                });
                return value;
              }
            })();
          }.call(this, '/'));
        },
        {
          './codegen': 5,
          './utils': 7,
          escope: 1,
          fs: 8,
          path: 10,
          rocambole: 4,
          util: 13,
        },
      ],
      7: [
        function (_dereq_, module, exports) {
          /*global module, exports*/
          (function () {
            var hasOwnProperty = Object.prototype.hasOwnProperty;

            //these constructs contain variable scope (technically, there's catch scope and ES6 let)
            var SCOPE_TYPES = {
              FunctionDeclaration: 1,
              FunctionExpression: 1,
              Program: 1,
            };

            //these have special meaning in PHP so we escape variables with these names
            var SUPER_GLOBALS = {
              GLOBALS: 1,
              _SERVER: 1,
              _GET: 1,
              _POST: 1,
              _FILES: 1,
              _COOKIE: 1,
              _SESSION: 1,
              _REQUEST: 1,
              _ENV: 1,
            };

            // table of character substitutions
            var ESC_CHARS = {
              '\t': '\\t',
              '\n': '\\n',
              '\f': '\\f',
              '\r': '\\r',
              '"': '\\"',
              $: '\\$',
              '\\': '\\\\',
            };

            function toHex(code, prefix) {
              var hex = code.toString(16).toUpperCase();
              if (hex.length === 1) {
                hex = '0' + hex;
              }
              if (prefix) {
                hex = prefix + hex;
              }
              return hex;
            }

            function toOctet(codePoint, shift, prefix) {
              return toHex(((codePoint >> shift) & 0x3f) | 0x80, prefix);
            }

            //encode unicode character to a set of escaped octets like \xC2\xA9
            function encodeChar(ch, prefix) {
              var code = ch.charCodeAt(0);
              if ((code & 0xffffff80) == 0) {
                // 1-byte sequence
                return toHex(code, prefix);
              }
              var result = '';
              if ((code & 0xfffff800) == 0) {
                // 2-byte sequence
                result = toHex(((code >> 6) & 0x1f) | 0xc0, prefix);
              } else if ((code & 0xffff0000) == 0) {
                // 3-byte sequence
                result = toHex(((code >> 12) & 0x0f) | 0xe0, prefix);
                result += toOctet(code, 6, prefix);
              } else if ((code & 0xffe00000) == 0) {
                // 4-byte sequence
                result = toHex(((code >> 18) & 0x07) | 0xf0, prefix);
                result += toOctet(code, 12, prefix);
                result += toOctet(code, 6, prefix);
              }
              result += toHex((code & 0x3f) | 0x80, prefix);
              return result;
            }

            function encodeString(string) {
              string = string.replace(
                /[\\"\$\x00-\x1F\u007F-\uFFFF]/g,
                function (ch) {
                  return ch in ESC_CHARS
                    ? ESC_CHARS[ch]
                    : encodeChar(ch, '\\x');
                }
              );
              return '"' + string + '"';
            }

            function encodeVarName(name, suffix) {
              suffix = suffix || '';
              if (!suffix && hasOwnProperty.call(SUPER_GLOBALS, name)) {
                suffix = '_';
              }
              if (!suffix && name.slice(-1) === '_') {
                suffix = '_';
              }
              name = name.replace(/[^a-z0-9_]/gi, function (ch) {
                return '«' + encodeChar(ch).toLowerCase() + '»';
              });
              return '$' + name + suffix;
            }

            function getParentScope(node) {
              var parent = node.parent;
              while (!(parent.type in SCOPE_TYPES)) {
                parent = parent.parent;
              }
              return parent.type === 'Program' ? parent : parent.body;
            }

            exports.encodeString = encodeString;
            exports.encodeVarName = encodeVarName;
            exports.getParentScope = getParentScope;
          })();
        },
        {},
      ],
      8: [function (_dereq_, module, exports) {}, {}],
      9: [
        function (_dereq_, module, exports) {
          if (typeof Object.create === 'function') {
            // implementation from standard node.js 'util' module
            module.exports = function inherits(ctor, superCtor) {
              ctor.super_ = superCtor;
              ctor.prototype = Object.create(superCtor.prototype, {
                constructor: {
                  value: ctor,
                  enumerable: false,
                  writable: true,
                  configurable: true,
                },
              });
            };
          } else {
            // old school shim for old browsers
            module.exports = function inherits(ctor, superCtor) {
              ctor.super_ = superCtor;
              var TempCtor = function () {};
              TempCtor.prototype = superCtor.prototype;
              ctor.prototype = new TempCtor();
              ctor.prototype.constructor = ctor;
            };
          }
        },
        {},
      ],
      10: [
        function (_dereq_, module, exports) {
          (function (process) {
            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.

            // resolves . and .. elements in a path array with directory names there
            // must be no slashes, empty elements, or device names (c:\) in the array
            // (so also no leading and trailing slashes - it does not distinguish
            // relative and absolute paths)
            function normalizeArray(parts, allowAboveRoot) {
              // if the path tries to go above the root, `up` ends up > 0
              var up = 0;
              for (var i = parts.length - 1; i >= 0; i--) {
                var last = parts[i];
                if (last === '.') {
                  parts.splice(i, 1);
                } else if (last === '..') {
                  parts.splice(i, 1);
                  up++;
                } else if (up) {
                  parts.splice(i, 1);
                  up--;
                }
              }

              // if the path is allowed to go above the root, restore leading ..s
              if (allowAboveRoot) {
                for (; up--; up) {
                  parts.unshift('..');
                }
              }

              return parts;
            }

            // Split a filename into [root, dir, basename, ext], unix version
            // 'root' is just a slash, or nothing.
            var splitPathRe =
              /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
            var splitPath = function (filename) {
              return splitPathRe.exec(filename).slice(1);
            };

            // path.resolve([from ...], to)
            // posix version
            exports.resolve = function () {
              var resolvedPath = '',
                resolvedAbsolute = false;

              for (
                var i = arguments.length - 1;
                i >= -1 && !resolvedAbsolute;
                i--
              ) {
                var path = i >= 0 ? arguments[i] : process.cwd();

                // Skip empty and invalid entries
                if (typeof path !== 'string') {
                  throw new TypeError(
                    'Arguments to path.resolve must be strings'
                  );
                } else if (!path) {
                  continue;
                }

                resolvedPath = path + '/' + resolvedPath;
                resolvedAbsolute = path.charAt(0) === '/';
              }

              // At this point the path should be resolved to a full absolute path, but
              // handle relative paths to be safe (might happen when process.cwd() fails)

              // Normalize the path
              resolvedPath = normalizeArray(
                filter(resolvedPath.split('/'), function (p) {
                  return !!p;
                }),
                !resolvedAbsolute
              ).join('/');

              return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
            };

            // path.normalize(path)
            // posix version
            exports.normalize = function (path) {
              var isAbsolute = exports.isAbsolute(path),
                trailingSlash = substr(path, -1) === '/';

              // Normalize the path
              path = normalizeArray(
                filter(path.split('/'), function (p) {
                  return !!p;
                }),
                !isAbsolute
              ).join('/');

              if (!path && !isAbsolute) {
                path = '.';
              }
              if (path && trailingSlash) {
                path += '/';
              }

              return (isAbsolute ? '/' : '') + path;
            };

            // posix version
            exports.isAbsolute = function (path) {
              return path.charAt(0) === '/';
            };

            // posix version
            exports.join = function () {
              var paths = Array.prototype.slice.call(arguments, 0);
              return exports.normalize(
                filter(paths, function (p, index) {
                  if (typeof p !== 'string') {
                    throw new TypeError(
                      'Arguments to path.join must be strings'
                    );
                  }
                  return p;
                }).join('/')
              );
            };

            // path.relative(from, to)
            // posix version
            exports.relative = function (from, to) {
              from = exports.resolve(from).substr(1);
              to = exports.resolve(to).substr(1);

              function trim(arr) {
                var start = 0;
                for (; start < arr.length; start++) {
                  if (arr[start] !== '') break;
                }

                var end = arr.length - 1;
                for (; end >= 0; end--) {
                  if (arr[end] !== '') break;
                }

                if (start > end) return [];
                return arr.slice(start, end - start + 1);
              }

              var fromParts = trim(from.split('/'));
              var toParts = trim(to.split('/'));

              var length = Math.min(fromParts.length, toParts.length);
              var samePartsLength = length;
              for (var i = 0; i < length; i++) {
                if (fromParts[i] !== toParts[i]) {
                  samePartsLength = i;
                  break;
                }
              }

              var outputParts = [];
              for (var i = samePartsLength; i < fromParts.length; i++) {
                outputParts.push('..');
              }

              outputParts = outputParts.concat(toParts.slice(samePartsLength));

              return outputParts.join('/');
            };

            exports.sep = '/';
            exports.delimiter = ':';

            exports.dirname = function (path) {
              var result = splitPath(path),
                root = result[0],
                dir = result[1];

              if (!root && !dir) {
                // No dirname whatsoever
                return '.';
              }

              if (dir) {
                // It has a dirname, strip trailing slash
                dir = dir.substr(0, dir.length - 1);
              }

              return root + dir;
            };

            exports.basename = function (path, ext) {
              var f = splitPath(path)[2];
              // TODO: make this comparison case-insensitive on windows?
              if (ext && f.substr(-1 * ext.length) === ext) {
                f = f.substr(0, f.length - ext.length);
              }
              return f;
            };

            exports.extname = function (path) {
              return splitPath(path)[3];
            };

            function filter(xs, f) {
              if (xs.filter) return xs.filter(f);
              var res = [];
              for (var i = 0; i < xs.length; i++) {
                if (f(xs[i], i, xs)) res.push(xs[i]);
              }
              return res;
            }

            // String.prototype.substr - negative index don't work in IE8
            var substr =
              'ab'.substr(-1) === 'b'
                ? function (str, start, len) {
                    return str.substr(start, len);
                  }
                : function (str, start, len) {
                    if (start < 0) start = str.length + start;
                    return str.substr(start, len);
                  };
          }.call(this, _dereq_('UPikzY')));
        },
        { UPikzY: 11 },
      ],
      11: [
        function (_dereq_, module, exports) {
          // shim for using process in browser

          var process = (module.exports = {});

          process.nextTick = (function () {
            var canSetImmediate =
              typeof window !== 'undefined' && window.setImmediate;
            var canPost =
              typeof window !== 'undefined' &&
              window.postMessage &&
              window.addEventListener;
            if (canSetImmediate) {
              return function (f) {
                return window.setImmediate(f);
              };
            }

            if (canPost) {
              var queue = [];
              window.addEventListener(
                'message',
                function (ev) {
                  var source = ev.source;
                  if (
                    (source === window || source === null) &&
                    ev.data === 'process-tick'
                  ) {
                    ev.stopPropagation();
                    if (queue.length > 0) {
                      var fn = queue.shift();
                      fn();
                    }
                  }
                },
                true
              );

              return function nextTick(fn) {
                queue.push(fn);
                window.postMessage('process-tick', '*');
              };
            }

            return function nextTick(fn) {
              setTimeout(fn, 0);
            };
          })();

          process.title = 'browser';
          process.browser = true;
          process.env = {};
          process.argv = [];

          function noop() {}

          process.on = noop;
          process.addListener = noop;
          process.once = noop;
          process.off = noop;
          process.removeListener = noop;
          process.removeAllListeners = noop;
          process.emit = noop;

          process.binding = function (name) {
            throw new Error('process.binding is not supported');
          };

          // TODO(shtylman)
          process.cwd = function () {
            return '/';
          };
          process.chdir = function (dir) {
            throw new Error('process.chdir is not supported');
          };
        },
        {},
      ],
      12: [
        function (_dereq_, module, exports) {
          module.exports = function isBuffer(arg) {
            return (
              arg &&
              typeof arg === 'object' &&
              typeof arg.copy === 'function' &&
              typeof arg.fill === 'function' &&
              typeof arg.readUInt8 === 'function'
            );
          };
        },
        {},
      ],
      13: [
        function (_dereq_, module, exports) {
          (function (process, global) {
            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.

            var formatRegExp = /%[sdj%]/g;
            exports.format = function (f) {
              if (!isString(f)) {
                var objects = [];
                for (var i = 0; i < arguments.length; i++) {
                  objects.push(inspect(arguments[i]));
                }
                return objects.join(' ');
              }

              var i = 1;
              var args = arguments;
              var len = args.length;
              var str = String(f).replace(formatRegExp, function (x) {
                if (x === '%%') return '%';
                if (i >= len) return x;
                switch (x) {
                  case '%s':
                    return String(args[i++]);
                  case '%d':
                    return Number(args[i++]);
                  case '%j':
                    try {
                      return JSON.stringify(args[i++]);
                    } catch (_) {
                      return '[Circular]';
                    }
                  default:
                    return x;
                }
              });
              for (var x = args[i]; i < len; x = args[++i]) {
                if (isNull(x) || !isObject(x)) {
                  str += ' ' + x;
                } else {
                  str += ' ' + inspect(x);
                }
              }
              return str;
            };

            // Mark that a method should not be used.
            // Returns a modified function which warns once by default.
            // If --no-deprecation is set, then it is a no-op.
            exports.deprecate = function (fn, msg) {
              // Allow for deprecating things in the process of starting up.
              if (isUndefined(global.process)) {
                return function () {
                  return exports.deprecate(fn, msg).apply(this, arguments);
                };
              }

              if (process.noDeprecation === true) {
                return fn;
              }

              var warned = false;
              function deprecated() {
                if (!warned) {
                  if (process.throwDeprecation) {
                    throw new Error(msg);
                  } else if (process.traceDeprecation) {
                    console.trace(msg);
                  } else {
                    console.error(msg);
                  }
                  warned = true;
                }
                return fn.apply(this, arguments);
              }

              return deprecated;
            };

            var debugs = {};
            var debugEnviron;
            exports.debuglog = function (set) {
              if (isUndefined(debugEnviron))
                debugEnviron = process.env.NODE_DEBUG || '';
              set = set.toUpperCase();
              if (!debugs[set]) {
                if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
                  var pid = process.pid;
                  debugs[set] = function () {
                    var msg = exports.format.apply(exports, arguments);
                    console.error('%s %d: %s', set, pid, msg);
                  };
                } else {
                  debugs[set] = function () {};
                }
              }
              return debugs[set];
            };

            /**
             * Echos the value of a value. Trys to print the value out
             * in the best way possible given the different types.
             *
             * @param {Object} obj The object to print out.
             * @param {Object} opts Optional options object that alters the output.
             */
            /* legacy: obj, showHidden, depth, colors*/
            function inspect(obj, opts) {
              // default options
              var ctx = {
                seen: [],
                stylize: stylizeNoColor,
              };
              // legacy...
              if (arguments.length >= 3) ctx.depth = arguments[2];
              if (arguments.length >= 4) ctx.colors = arguments[3];
              if (isBoolean(opts)) {
                // legacy...
                ctx.showHidden = opts;
              } else if (opts) {
                // got an "options" object
                exports._extend(ctx, opts);
              }
              // set default options
              if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
              if (isUndefined(ctx.depth)) ctx.depth = 2;
              if (isUndefined(ctx.colors)) ctx.colors = false;
              if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
              if (ctx.colors) ctx.stylize = stylizeWithColor;
              return formatValue(ctx, obj, ctx.depth);
            }
            exports.inspect = inspect;

            // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
            inspect.colors = {
              bold: [1, 22],
              italic: [3, 23],
              underline: [4, 24],
              inverse: [7, 27],
              white: [37, 39],
              grey: [90, 39],
              black: [30, 39],
              blue: [34, 39],
              cyan: [36, 39],
              green: [32, 39],
              magenta: [35, 39],
              red: [31, 39],
              yellow: [33, 39],
            };

            // Don't use 'blue' not visible on cmd.exe
            inspect.styles = {
              special: 'cyan',
              number: 'yellow',
              boolean: 'yellow',
              undefined: 'grey',
              null: 'bold',
              string: 'green',
              date: 'magenta',
              // "name": intentionally not styling
              regexp: 'red',
            };

            function stylizeWithColor(str, styleType) {
              var style = inspect.styles[styleType];

              if (style) {
                return (
                  '\u001b[' +
                  inspect.colors[style][0] +
                  'm' +
                  str +
                  '\u001b[' +
                  inspect.colors[style][1] +
                  'm'
                );
              } else {
                return str;
              }
            }

            function stylizeNoColor(str, styleType) {
              return str;
            }

            function arrayToHash(array) {
              var hash = {};

              array.forEach(function (val, idx) {
                hash[val] = true;
              });

              return hash;
            }

            function formatValue(ctx, value, recurseTimes) {
              // Provide a hook for user-specified inspect functions.
              // Check that value is an object with an inspect function on it
              if (
                ctx.customInspect &&
                value &&
                isFunction(value.inspect) &&
                // Filter out the util module, it's inspect function is special
                value.inspect !== exports.inspect &&
                // Also filter out any prototype objects using the circular check.
                !(value.constructor && value.constructor.prototype === value)
              ) {
                var ret = value.inspect(recurseTimes, ctx);
                if (!isString(ret)) {
                  ret = formatValue(ctx, ret, recurseTimes);
                }
                return ret;
              }

              // Primitive types cannot have properties
              var primitive = formatPrimitive(ctx, value);
              if (primitive) {
                return primitive;
              }

              // Look up the keys of the object.
              var keys = Object.keys(value);
              var visibleKeys = arrayToHash(keys);

              if (ctx.showHidden) {
                keys = Object.getOwnPropertyNames(value);
              }

              // IE doesn't make error fields non-enumerable
              // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
              if (
                isError(value) &&
                (keys.indexOf('message') >= 0 ||
                  keys.indexOf('description') >= 0)
              ) {
                return formatError(value);
              }

              // Some type of object without properties can be shortcutted.
              if (keys.length === 0) {
                if (isFunction(value)) {
                  var name = value.name ? ': ' + value.name : '';
                  return ctx.stylize('[Function' + name + ']', 'special');
                }
                if (isRegExp(value)) {
                  return ctx.stylize(
                    RegExp.prototype.toString.call(value),
                    'regexp'
                  );
                }
                if (isDate(value)) {
                  return ctx.stylize(
                    Date.prototype.toString.call(value),
                    'date'
                  );
                }
                if (isError(value)) {
                  return formatError(value);
                }
              }

              var base = '',
                array = false,
                braces = ['{', '}'];

              // Make Array say that they are Array
              if (isArray(value)) {
                array = true;
                braces = ['[', ']'];
              }

              // Make functions say that they are functions
              if (isFunction(value)) {
                var n = value.name ? ': ' + value.name : '';
                base = ' [Function' + n + ']';
              }

              // Make RegExps say that they are RegExps
              if (isRegExp(value)) {
                base = ' ' + RegExp.prototype.toString.call(value);
              }

              // Make dates with properties first say the date
              if (isDate(value)) {
                base = ' ' + Date.prototype.toUTCString.call(value);
              }

              // Make error with message first say the error
              if (isError(value)) {
                base = ' ' + formatError(value);
              }

              if (keys.length === 0 && (!array || value.length == 0)) {
                return braces[0] + base + braces[1];
              }

              if (recurseTimes < 0) {
                if (isRegExp(value)) {
                  return ctx.stylize(
                    RegExp.prototype.toString.call(value),
                    'regexp'
                  );
                } else {
                  return ctx.stylize('[Object]', 'special');
                }
              }

              ctx.seen.push(value);

              var output;
              if (array) {
                output = formatArray(
                  ctx,
                  value,
                  recurseTimes,
                  visibleKeys,
                  keys
                );
              } else {
                output = keys.map(function (key) {
                  return formatProperty(
                    ctx,
                    value,
                    recurseTimes,
                    visibleKeys,
                    key,
                    array
                  );
                });
              }

              ctx.seen.pop();

              return reduceToSingleString(output, base, braces);
            }

            function formatPrimitive(ctx, value) {
              if (isUndefined(value))
                return ctx.stylize('undefined', 'undefined');
              if (isString(value)) {
                var simple =
                  "'" +
                  JSON.stringify(value)
                    .replace(/^"|"$/g, '')
                    .replace(/'/g, "\\'")
                    .replace(/\\"/g, '"') +
                  "'";
                return ctx.stylize(simple, 'string');
              }
              if (isNumber(value)) return ctx.stylize('' + value, 'number');
              if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
              // For some reason typeof null is "object", so special case here.
              if (isNull(value)) return ctx.stylize('null', 'null');
            }

            function formatError(value) {
              return '[' + Error.prototype.toString.call(value) + ']';
            }

            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
              var output = [];
              for (var i = 0, l = value.length; i < l; ++i) {
                if (hasOwnProperty(value, String(i))) {
                  output.push(
                    formatProperty(
                      ctx,
                      value,
                      recurseTimes,
                      visibleKeys,
                      String(i),
                      true
                    )
                  );
                } else {
                  output.push('');
                }
              }
              keys.forEach(function (key) {
                if (!key.match(/^\d+$/)) {
                  output.push(
                    formatProperty(
                      ctx,
                      value,
                      recurseTimes,
                      visibleKeys,
                      key,
                      true
                    )
                  );
                }
              });
              return output;
            }

            function formatProperty(
              ctx,
              value,
              recurseTimes,
              visibleKeys,
              key,
              array
            ) {
              var name, str, desc;
              desc = Object.getOwnPropertyDescriptor(value, key) || {
                value: value[key],
              };
              if (desc.get) {
                if (desc.set) {
                  str = ctx.stylize('[Getter/Setter]', 'special');
                } else {
                  str = ctx.stylize('[Getter]', 'special');
                }
              } else {
                if (desc.set) {
                  str = ctx.stylize('[Setter]', 'special');
                }
              }
              if (!hasOwnProperty(visibleKeys, key)) {
                name = '[' + key + ']';
              }
              if (!str) {
                if (ctx.seen.indexOf(desc.value) < 0) {
                  if (isNull(recurseTimes)) {
                    str = formatValue(ctx, desc.value, null);
                  } else {
                    str = formatValue(ctx, desc.value, recurseTimes - 1);
                  }
                  if (str.indexOf('\n') > -1) {
                    if (array) {
                      str = str
                        .split('\n')
                        .map(function (line) {
                          return '  ' + line;
                        })
                        .join('\n')
                        .substr(2);
                    } else {
                      str =
                        '\n' +
                        str
                          .split('\n')
                          .map(function (line) {
                            return '   ' + line;
                          })
                          .join('\n');
                    }
                  }
                } else {
                  str = ctx.stylize('[Circular]', 'special');
                }
              }
              if (isUndefined(name)) {
                if (array && key.match(/^\d+$/)) {
                  return str;
                }
                name = JSON.stringify('' + key);
                if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                  name = name.substr(1, name.length - 2);
                  name = ctx.stylize(name, 'name');
                } else {
                  name = name
                    .replace(/'/g, "\\'")
                    .replace(/\\"/g, '"')
                    .replace(/(^"|"$)/g, "'");
                  name = ctx.stylize(name, 'string');
                }
              }

              return name + ': ' + str;
            }

            function reduceToSingleString(output, base, braces) {
              var numLinesEst = 0;
              var length = output.reduce(function (prev, cur) {
                numLinesEst++;
                if (cur.indexOf('\n') >= 0) numLinesEst++;
                return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
              }, 0);

              if (length > 60) {
                return (
                  braces[0] +
                  (base === '' ? '' : base + '\n ') +
                  ' ' +
                  output.join(',\n  ') +
                  ' ' +
                  braces[1]
                );
              }

              return (
                braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1]
              );
            }

            // NOTE: These type checking functions intentionally don't use `instanceof`
            // because it is fragile and can be easily faked with `Object.create()`.
            function isArray(ar) {
              return Array.isArray(ar);
            }
            exports.isArray = isArray;

            function isBoolean(arg) {
              return typeof arg === 'boolean';
            }
            exports.isBoolean = isBoolean;

            function isNull(arg) {
              return arg === null;
            }
            exports.isNull = isNull;

            function isNullOrUndefined(arg) {
              return arg == null;
            }
            exports.isNullOrUndefined = isNullOrUndefined;

            function isNumber(arg) {
              return typeof arg === 'number';
            }
            exports.isNumber = isNumber;

            function isString(arg) {
              return typeof arg === 'string';
            }
            exports.isString = isString;

            function isSymbol(arg) {
              return typeof arg === 'symbol';
            }
            exports.isSymbol = isSymbol;

            function isUndefined(arg) {
              return arg === void 0;
            }
            exports.isUndefined = isUndefined;

            function isRegExp(re) {
              return isObject(re) && objectToString(re) === '[object RegExp]';
            }
            exports.isRegExp = isRegExp;

            function isObject(arg) {
              return typeof arg === 'object' && arg !== null;
            }
            exports.isObject = isObject;

            function isDate(d) {
              return isObject(d) && objectToString(d) === '[object Date]';
            }
            exports.isDate = isDate;

            function isError(e) {
              return (
                isObject(e) &&
                (objectToString(e) === '[object Error]' || e instanceof Error)
              );
            }
            exports.isError = isError;

            function isFunction(arg) {
              return typeof arg === 'function';
            }
            exports.isFunction = isFunction;

            function isPrimitive(arg) {
              return (
                arg === null ||
                typeof arg === 'boolean' ||
                typeof arg === 'number' ||
                typeof arg === 'string' ||
                typeof arg === 'symbol' || // ES6 symbol
                typeof arg === 'undefined'
              );
            }
            exports.isPrimitive = isPrimitive;

            exports.isBuffer = _dereq_('./support/isBuffer');

            function objectToString(o) {
              return Object.prototype.toString.call(o);
            }

            function pad(n) {
              return n < 10 ? '0' + n.toString(10) : n.toString(10);
            }

            var months = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];

            // 26 Feb 16:19:34
            function timestamp() {
              var d = new Date();
              var time = [
                pad(d.getHours()),
                pad(d.getMinutes()),
                pad(d.getSeconds()),
              ].join(':');
              return [d.getDate(), months[d.getMonth()], time].join(' ');
            }

            // log is just a thin wrapper to console.log that prepends a timestamp
            exports.log = function () {
              console.log(
                '%s - %s',
                timestamp(),
                exports.format.apply(exports, arguments)
              );
            };

            /**
             * Inherit the prototype methods from one constructor into another.
             *
             * The Function.prototype.inherits from lang.js rewritten as a standalone
             * function (not on Function.prototype). NOTE: If this file is to be loaded
             * during bootstrapping this function needs to be rewritten using some native
             * functions as prototype setup using normal JavaScript does not work as
             * expected during bootstrapping (see mirror.js in r114903).
             *
             * @param {function} ctor Constructor function which needs to inherit the
             *     prototype.
             * @param {function} superCtor Constructor function to inherit prototype from.
             */
            exports.inherits = _dereq_('inherits');

            exports._extend = function (origin, add) {
              // Don't do anything if add isn't an object
              if (!add || !isObject(add)) return origin;

              var keys = Object.keys(add);
              var i = keys.length;
              while (i--) {
                origin[keys[i]] = add[keys[i]];
              }
              return origin;
            };

            function hasOwnProperty(obj, prop) {
              return Object.prototype.hasOwnProperty.call(obj, prop);
            }
          }.call(
            this,
            _dereq_('UPikzY'),
            typeof self !== 'undefined'
              ? self
              : typeof window !== 'undefined'
              ? window
              : {}
          ));
        },
        { './support/isBuffer': 12, UPikzY: 11, inherits: 9 },
      ],
    },
    {},
    [6]
  )(6);
});
