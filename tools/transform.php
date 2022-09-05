<?php

call(new Func(function() use (&$require, &$module, &$Error, &$Object) {
  $fs = null; $path = null; $utils = null; $rocambole = null; $escope = null; $codegen = null; $COMMENT_OR_STRING = null; $nodeHandlers = null;
  $getTerms = new Func("getTerms", function($node = null, $op = null) {
    $getTerms = Func::getCurrent();
    $terms = null;
    $terms = new Arr();
    if (s_eq($node->left->type, Str::str("BinaryExpression")) && s_eq($node->left->operator, $op)) {
      $terms = call_method($terms, "concat", call($getTerms, $node->left, $op));
    } else {
      call_method($terms, "push", $node->left);
    }

    if (s_eq($node->right->type, Str::str("BinaryExpression")) && s_eq($node->right->operator, $op)) {
      $terms = call_method($terms, "concat", call($getTerms, $node->right, $op));
    } else {
      call_method($terms, "push", $node->right);
    }

    return $terms;
  });
  $Transformer = new Func("Transformer", function() {
    $Transformer = Func::getCurrent();
    $this_ = Func::getContext();
    return _instanceof($this_, $Transformer) ? $this_ : _new($Transformer);
  });
  $indexScope = new Func("indexScope", function($scope = null) use (&$Object, &$setHidden) {
    $indexScope = Func::getCurrent();
    $defined = null; $referenced = null; $unresolved = null; $childScopes = null; $firstVar = null; $argumentsFound = null; $scopeIndex = null;
    if (is($scope->functionExpressionScope)) {
      return call($indexScope, $scope->childScopes->get(0.0));
    }
    $defined = call_method($Object, "create", Obj::$null);
    call_method($scope->variables, "forEach", new Func(function($variable = null) use (&$defined) {
      set($defined, $variable->name, true);
    }));
    $referenced = call_method($Object, "create", Obj::$null);
    $unresolved = call_method($Object, "create", Obj::$null);
    call_method($scope->references, "forEach", new Func(function($ref = null) use (&$referenced, &$scope, &$unresolved) {
      $name = null;
      $name = $ref->identifier->name;
      set($referenced, $name, true);
      if ((not($ref->resolved) || !s_eq($ref->resolved->scope, $scope)) && !s_eq($name, Str::str("__dirname"))) {
        set($unresolved, $name, true);
      }
    }));
    $childScopes = (is($or_ = $scope->childScopes) ? $or_ : new Arr());
    call_method($childScopes, "forEach", new Func(function($childScope = null) use (&$indexScope, &$Object, &$referenced, &$defined, &$unresolved) {
      $index = null;
      $index = call($indexScope, $childScope);
      call_method(call_method($Object, "keys", $index->unresolved), "forEach", new Func(function($name = null) use (&$referenced, &$defined, &$unresolved) {
        set($referenced, $name, true);
        if (not($defined->get($name))) {
          set($unresolved, $name, true);
        }
      }));
    }));
    $firstVar = $scope->variables->get(0.0);
    $argumentsFound = (is($and_ = (is($and1_ = $firstVar) ? s_eq($firstVar->name, Str::str("arguments")) : $and1_)) ? $firstVar->references->length : $and_);
    $scopeIndex = new Obj("defined", $defined, "referenced", $referenced, "unresolved", $unresolved, "thisFound", $scope->thisFound, "argumentsFound", !not($argumentsFound));
    call($setHidden, $scope->block, Str::str("scopeIndex"), $scopeIndex);
    return $scopeIndex;
  });
  $buildRuntime = new Func("buildRuntime", function($opts = null) use (&$fs, &$path, &$removeComments, &$removeEmptyLines) {
    $includeModules = null; $source = null; $fileList = null; $totalModules = null; $output = null;
    $opts = (is($or_ = $opts) ? $or_ : new Obj());
    if (not($opts->includeAllModules)) {
      $includeModules = (is($or_ = $opts->includeModules) ? $or_ : new Arr());
      $includeModules = call_method($includeModules, "reduce", new Func(function($includeModules = null, $name = null) {
        set($includeModules, $name, true);
        return $includeModules;
      }), new Obj());
    }
    $fileList = new Arr();
    $totalModules = 0.0;
    call_method($source, "replace", new RegExp("require_once\\('(.+?)'\\)", "g"), new Func(function($__ = null, $file = null) use (&$includeModules, &$totalModules, &$opts, &$fileList) {
      $name = null;
      $name = call_method(call_method(call_method($file, "split", Str::str("/")), "pop"), "split", Str::str("."))->get(0.0);
      if (is($includeModules) && s_eq(call_method($file, "indexOf", Str::str("php/modules/")), 0.0)) {
        if (not(call_method($includeModules, "hasOwnProperty", $name))) {
          return ;
        }
        $totalModules = _plus($totalModules, 1.0);
      }
      if (s_eq($name, Str::str("Debug")) && not($opts->includeDebug)) {
        return ;
      }
      if (s_eq($name, Str::str("Test")) && not($opts->includeTest)) {
        return ;
      }
      call_method($fileList, "push", $file);
    }));
    $output = call_method($fileList, "map", new Func(function($file = null) use (&$includeModules, &$totalModules, &$opts, &$fs, &$path) {
      $name = null; $source = null;
      $name = call_method(call_method(call_method($file, "split", Str::str("/")), "pop"), "split", Str::str("."))->get(0.0);
      if (is($includeModules) && s_eq($totalModules, 0.0) && s_eq($name, Str::str("Module"))) {
        return ;
      }
      if (is($opts->log)) {
        call_method($opts, "log", _concat(Str::str("Adding runtime file: "), $file));
      }
      $source = call_method($fs, "readFileSync", call_method($path, "join", __DIR__, Str::str(".."), $file), Str::str("utf8"));
      $source = call_method($source, "replace", new RegExp("^<\\?php", ""), Str::str(""));
      $source = call_method($source, "replace", new RegExp("^\\n+|\\n+\$", "g"), Str::str(""));
      return $source;
    }));
    call_method($output, "unshift", Str::str("mb_internal_encoding(\"UTF-8\");\n"));
    $output = call_method($output, "join", Str::str("\n"));
    $output = call($removeComments, $output);
    $output = call($removeEmptyLines, $output);
    return $output;
  });
  $removeComments = new Func("removeComments", function($code = null) use (&$COMMENT_OR_STRING) {
    return call_method($code, "replace", $COMMENT_OR_STRING, new Func(function($match = null) {
      $ch = null;
      $ch = call_method($match, "charAt", 0.0);
      if (s_eq($ch, Str::str("\"")) || s_eq($ch, Str::str("'"))) {
        return $match;
      }
      return s_eq(call_method($match, "slice", 0.0, 2.0), Str::str("//")) ? Str::str("\n") : Str::str("");
    }));
  });
  $removeEmptyLines = new Func("removeEmptyLines", function($code = null) {
    return call_method($code, "replace", new RegExp("\\n([ \\t]*\\n)+", "g"), Str::str("\n"));
  });
  $setHidden = new Func("setHidden", function($object = null, $name = null, $value = null) use (&$Object) {
    call_method($Object, "defineProperty", $object, $name, new Obj("value", $value, "enumerable", false, "writable", true, "configurable", true));
    return $value;
  });
  $fs = call($require, Str::str("fs"), __DIR__);
  $path = call($require, Str::str("path"), __DIR__);
  $utils = call($require, Str::str("./utils"), __DIR__);
  $rocambole = call($require, Str::str("rocambole"), __DIR__);
  $escope = call($require, Str::str("escope"), __DIR__);
  $codegen = call($require, Str::str("./codegen"), __DIR__);
  $COMMENT_OR_STRING = new RegExp("'(\\\\.|[^'\\n])*'|\"(\\\\.|[^\"\\n])*\"|/\\*([\\s\\S]*?)\\*/|//.*?\\n", "g");
  set($module, "exports", new Func(function($opts = null) use (&$Transformer) {
    $transformer = null;
    $transformer = _new($Transformer);
    return call_method($transformer, "process", $opts);
  }));
  set($module->exports, "Transformer", $Transformer);
  set($module->exports, "buildRuntime", $buildRuntime);
  $nodeHandlers = new Obj("NewExpression", new Func(function($node = null) use (&$Error, &$setHidden) {
    $this_ = Func::getContext();
    $args = null; $i = null; $len = null; $arg = null; $body = null; $code = null; $ast = null; $newNode = null;
    if (s_eq($node->callee->type, Str::str("Identifier")) && s_eq($node->callee->name, Str::str("Function"))) {
      $args = call_method($node->arguments, "slice", 0.0);
      for ($i = 0.0, $len = $args->length; cmp($i, '<', $len); $i++) {
        $arg = $args->get($i);
        if (!s_eq($arg->type, Str::str("Literal")) || !s_eq(_typeof($arg->value), Str::str("string"))) {
          throw new Ex(_new($Error, Str::str("Parse Error: new Function() not supported except with string literal")));
        }
      }
      $args = call_method($args, "map", new Func(function($arg = null) {
        return $arg->value;
      }));
      $body = call_method($args, "pop");
      $code = _concat(Str::str("(function("), call_method($args, "join", Str::str(", ")), Str::str(") {"), $body, Str::str("})"));
      $ast = call_method($this_, "parse", $code);
      $newNode = $ast->body->get(0.0)->expression;
      call_method($this_, "replaceNode", $node, $newNode);
      call($setHidden, $newNode, Str::str("useStrict"), false);
    }
  }), "VariableDeclaration", new Func(function($node = null) use (&$utils, &$setHidden) {
    $scope = null; $varNames = null;
    $scope = call_method($utils, "getParentScope", $node);
    $varNames = (is($or_ = $scope->vars) ? $or_ : call($setHidden, $scope, Str::str("vars"), new Obj()));
    call_method($node->declarations, "forEach", new Func(function($decl = null) use (&$varNames) {
      set($varNames, $decl->id->name, true);
    }));
  }), "FunctionDeclaration", new Func(function($node = null) use (&$utils, &$setHidden) {
    $name = null; $scope = null; $funcDeclarations = null;
    $name = $node->id->name;
    $scope = call_method($utils, "getParentScope", $node);
    $funcDeclarations = (is($or_ = $scope->funcs) ? $or_ : call($setHidden, $scope, Str::str("funcs"), new Obj()));
    set($funcDeclarations, $name, $node);
  }), "BinaryExpression", new Func(function($node = null) use (&$getTerms, &$setHidden) {
    $terms = null; $isConcat = null;
    if (s_eq($node->operator, Str::str("+"))) {
      $terms = call($getTerms, $node, Str::str("+"));
      $isConcat = call_method($terms, "some", new Func(function($node = null) {
        return s_eq($node->type, Str::str("Literal")) && s_eq(_typeof($node->value), Str::str("string"));
      }));
      call($setHidden, $node, Str::str("terms"), $terms);
      call($setHidden, $node, Str::str("isConcat"), $isConcat);
    }
  }));
  set($Transformer->prototype, "process", new Func(function($opts = null) use (&$Object, &$codegen) {
    $this_ = Func::getContext();
    $ast = null;
    $opts = call_method($Object, "create", (is($or_ = $opts) ? $or_ : new Obj()));
    set($opts, "initVars", !s_eq($opts->initVars, false));
    set($this_, "opts", $opts);
    $ast = call_method($this_, "parse", $opts->source);
    return call_method($codegen, "generate", $ast, $opts);
  }));
  set($Transformer->prototype, "parse", new Func(function($source = null) use (&$rocambole) {
    $this_ = Func::getContext();
    $ast = null;
    $source = call_method($source, "trim");
    $ast = call_method($rocambole, "parse", $source);
    call_method($this_, "transform", $ast);
    return $ast;
  }));
  set($Transformer->prototype, "transform", new Func(function($ast = null) use (&$rocambole, &$escope, &$indexScope, &$nodeHandlers) {
    $this_ = Func::getContext();
    $self = null; $scopes = null; $count = null;
    $self = $this_;
    call_method($rocambole, "recursive", $ast, new Func(function($node = null) use (&$nodeHandlers, &$self) {
      $type = null;
      $type = $node->type;
      if (_in($type, $nodeHandlers)) {
        call_method($nodeHandlers->get($type), "call", $self, $node);
      }
    }));
    $scopes = call_method($escope, "analyze", $ast)->scopes;
    call($indexScope, $scopes->get(0.0));
    $count = 0.0;
    call_method($scopes, "forEach", new Func(function($scope = null) use (&$count) {
      $param = null; $identifiers = null; $suffix = null;
      if (s_eq($scope->type, Str::str("catch"))) {
        $param = $scope->variables->get(0.0);
        $identifiers = new Arr($param->identifiers->get(0.0));
        call_method($param->references, "forEach", new Func(function($ref = null) use (&$identifiers) {
          call_method($identifiers, "push", $ref->identifier);
        }));
        $suffix = _concat(Str::str("_"), ++$count, Str::str("_"));
        call_method($identifiers, "forEach", new Func(function($identifier = null) use (&$suffix) {
          set($identifier, "appendSuffix", $suffix);
        }));
      }
    }));
  }));
  set($Transformer->prototype, "replaceNode", new Func(function($oldNode = null, $newNode = null) use (&$Object) {
    $parent = null;
    $parent = $oldNode->parent;
    call_method(call_method($Object, "keys", $parent), "forEach", new Func(function($key = null) use (&$oldNode, &$parent, &$newNode) {
      if (s_eq($parent->get($key), $oldNode)) {
        set($parent, $key, $newNode);
      }
    }));
    set($newNode, "parent", $parent);
  }));
}));
