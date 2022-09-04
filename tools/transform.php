<?php

call(new Func(function() use (&$require, &$module, &$Error, &$Object) {
  $fs = null; $path = null; $utils = null; $rocambole = null; $escope = null; $codegen = null; $COMMENT_OR_STRING = null; $nodeHandlers = null;
  $getTerms = new Func("getTerms", function($node = null, $op = null) {
    $getTerms = Func::getCurrent();
    $terms = null;
    $terms = new Arr();
    if (get(get($node, "left"), "type") === "BinaryExpression" && get(get($node, "left"), "operator") === $op) {
      $terms = call_method($terms, "concat", call($getTerms, get($node, "left"), $op));
    } else {
      call_method($terms, "push", get($node, "left"));
    }

    if (get(get($node, "right"), "type") === "BinaryExpression" && get(get($node, "right"), "operator") === $op) {
      $terms = call_method($terms, "concat", call($getTerms, get($node, "right"), $op));
    } else {
      call_method($terms, "push", get($node, "right"));
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
    if (is(get($scope, "functionExpressionScope"))) {
      return call($indexScope, get(get($scope, "childScopes"), 0.0));
    }
    $defined = call_method($Object, "create", Obj::$null);
    call_method(get($scope, "variables"), "forEach", new Func(function($variable = null) use (&$defined) {
      set($defined, get($variable, "name"), true);
    }));
    $referenced = call_method($Object, "create", Obj::$null);
    $unresolved = call_method($Object, "create", Obj::$null);
    call_method(get($scope, "references"), "forEach", new Func(function($ref = null) use (&$referenced, &$scope, &$unresolved) {
      $name = null;
      $name = get(get($ref, "identifier"), "name");
      set($referenced, $name, true);
      if ((not(get($ref, "resolved")) || get(get($ref, "resolved"), "scope") !== $scope) && $name !== "__dirname") {
        set($unresolved, $name, true);
      }
    }));
    $childScopes = (is($or_ = get($scope, "childScopes")) ? $or_ : new Arr());
    call_method($childScopes, "forEach", new Func(function($childScope = null) use (&$indexScope, &$Object, &$referenced, &$defined, &$unresolved) {
      $index = null;
      $index = call($indexScope, $childScope);
      call_method(call_method($Object, "keys", get($index, "unresolved")), "forEach", new Func(function($name = null) use (&$referenced, &$defined, &$unresolved) {
        set($referenced, $name, true);
        if (not(get($defined, $name))) {
          set($unresolved, $name, true);
        }
      }));
    }));
    $firstVar = get(get($scope, "variables"), 0.0);
    $argumentsFound = (is($and_ = (is($and1_ = $firstVar) ? get($firstVar, "name") === "arguments" : $and1_)) ? get(get($firstVar, "references"), "length") : $and_);
    $scopeIndex = new Obj("defined", $defined, "referenced", $referenced, "unresolved", $unresolved, "thisFound", get($scope, "thisFound"), "argumentsFound", !not($argumentsFound));
    call($setHidden, get($scope, "block"), "scopeIndex", $scopeIndex);
    return $scopeIndex;
  });
  $buildRuntime = new Func("buildRuntime", function($opts = null) use (&$fs, &$path, &$removeComments, &$removeEmptyLines) {
    $includeModules = null; $source = null; $fileList = null; $totalModules = null; $output = null;
    $opts = (is($or_ = $opts) ? $or_ : new Obj());
    if (not(get($opts, "includeAllModules"))) {
      $includeModules = (is($or_ = get($opts, "includeModules")) ? $or_ : new Arr());
      $includeModules = call_method($includeModules, "reduce", new Func(function($includeModules = null, $name = null) {
        set($includeModules, $name, true);
        return $includeModules;
      }), new Obj());
    }
    $fileList = new Arr();
    $totalModules = 0.0;
    call_method($source, "replace", new RegExp("require_once\\('(.+?)'\\)", "g"), new Func(function($__ = null, $file = null) use (&$includeModules, &$totalModules, &$opts, &$fileList) {
      $name = null;
      $name = get(call_method(call_method(call_method($file, "split", "/"), "pop"), "split", "."), 0.0);
      if (is($includeModules) && call_method($file, "indexOf", "php/modules/") === 0.0) {
        if (not(call_method($includeModules, "hasOwnProperty", $name))) {
          return ;
        }
        $totalModules = _plus($totalModules, 1.0);
      }
      if ($name === "Debug" && not(get($opts, "includeDebug"))) {
        return ;
      }
      if ($name === "Test" && not(get($opts, "includeTest"))) {
        return ;
      }
      call_method($fileList, "push", $file);
    }));
    $output = call_method($fileList, "map", new Func(function($file = null) use (&$includeModules, &$totalModules, &$opts, &$fs, &$path) {
      $name = null; $source = null;
      $name = get(call_method(call_method(call_method($file, "split", "/"), "pop"), "split", "."), 0.0);
      if (is($includeModules) && $totalModules === 0.0 && $name === "Module") {
        return ;
      }
      if (is(get($opts, "log"))) {
        call_method($opts, "log", _concat("Adding runtime file: ", $file));
      }
      $source = call_method($fs, "readFileSync", call_method($path, "join", __DIR__, "..", $file), "utf8");
      $source = call_method($source, "replace", new RegExp("^<\\?php", ""), "");
      $source = call_method($source, "replace", new RegExp("^\\n+|\\n+\$", "g"), "");
      return $source;
    }));
    call_method($output, "unshift", "mb_internal_encoding(\"UTF-8\");\n");
    $output = call_method($output, "join", "\n");
    $output = call($removeComments, $output);
    $output = call($removeEmptyLines, $output);
    return $output;
  });
  $removeComments = new Func("removeComments", function($code = null) use (&$COMMENT_OR_STRING) {
    return call_method($code, "replace", $COMMENT_OR_STRING, new Func(function($match = null) {
      $ch = null;
      $ch = call_method($match, "charAt", 0.0);
      if ($ch === "\"" || $ch === "'") {
        return $match;
      }
      return call_method($match, "slice", 0.0, 2.0) === "//" ? "\n" : "";
    }));
  });
  $removeEmptyLines = new Func("removeEmptyLines", function($code = null) {
    return call_method($code, "replace", new RegExp("\\n([ \\t]*\\n)+", "g"), "\n");
  });
  $setHidden = new Func("setHidden", function($object = null, $name = null, $value = null) use (&$Object) {
    call_method($Object, "defineProperty", $object, $name, new Obj("value", $value, "enumerable", false, "writable", true, "configurable", true));
    return $value;
  });
  $fs = call($require, "fs", __DIR__);
  $path = call($require, "path", __DIR__);
  $utils = call($require, "./utils", __DIR__);
  $rocambole = call($require, "rocambole", __DIR__);
  $escope = call($require, "escope", __DIR__);
  $codegen = call($require, "./codegen", __DIR__);
  $COMMENT_OR_STRING = new RegExp("'(\\\\.|[^'\\n])*'|\"(\\\\.|[^\"\\n])*\"|/\\*([\\s\\S]*?)\\*/|//.*?\\n", "g");
  set($module, "exports", new Func(function($opts = null) use (&$Transformer) {
    $transformer = null;
    $transformer = _new($Transformer);
    return call_method($transformer, "process", $opts);
  }));
  set(get($module, "exports"), "Transformer", $Transformer);
  set(get($module, "exports"), "buildRuntime", $buildRuntime);
  $nodeHandlers = new Obj("NewExpression", new Func(function($node = null) use (&$Error, &$setHidden) {
    $this_ = Func::getContext();
    $args = null; $i = null; $len = null; $arg = null; $body = null; $code = null; $ast = null; $newNode = null;
    if (get(get($node, "callee"), "type") === "Identifier" && get(get($node, "callee"), "name") === "Function") {
      $args = call_method(get($node, "arguments"), "slice", 0.0);
      for ($i = 0.0, $len = get($args, "length"); cmp($i, '<', $len); $i++) {
        $arg = get($args, $i);
        if (get($arg, "type") !== "Literal" || _typeof(get($arg, "value")) !== "string") {
          throw new Ex(_new($Error, "Parse Error: new Function() not supported except with string literal"));
        }
      }
      $args = call_method($args, "map", new Func(function($arg = null) {
        return get($arg, "value");
      }));
      $body = call_method($args, "pop");
      $code = _concat("(function(", call_method($args, "join", ", "), ") {", $body, "})");
      $ast = call_method($this_, "parse", $code);
      $newNode = get(get(get($ast, "body"), 0.0), "expression");
      call_method($this_, "replaceNode", $node, $newNode);
      call($setHidden, $newNode, "useStrict", false);
    }
  }), "VariableDeclaration", new Func(function($node = null) use (&$utils, &$setHidden) {
    $scope = null; $varNames = null;
    $scope = call_method($utils, "getParentScope", $node);
    $varNames = (is($or_ = get($scope, "vars")) ? $or_ : call($setHidden, $scope, "vars", new Obj()));
    call_method(get($node, "declarations"), "forEach", new Func(function($decl = null) use (&$varNames) {
      set($varNames, get(get($decl, "id"), "name"), true);
    }));
  }), "FunctionDeclaration", new Func(function($node = null) use (&$utils, &$setHidden) {
    $name = null; $scope = null; $funcDeclarations = null;
    $name = get(get($node, "id"), "name");
    $scope = call_method($utils, "getParentScope", $node);
    $funcDeclarations = (is($or_ = get($scope, "funcs")) ? $or_ : call($setHidden, $scope, "funcs", new Obj()));
    set($funcDeclarations, $name, $node);
  }), "BinaryExpression", new Func(function($node = null) use (&$getTerms, &$setHidden) {
    $terms = null; $isConcat = null;
    if (get($node, "operator") === "+") {
      $terms = call($getTerms, $node, "+");
      $isConcat = call_method($terms, "some", new Func(function($node = null) {
        return get($node, "type") === "Literal" && _typeof(get($node, "value")) === "string";
      }));
      call($setHidden, $node, "terms", $terms);
      call($setHidden, $node, "isConcat", $isConcat);
    }
  }));
  set(get($Transformer, "prototype"), "process", new Func(function($opts = null) use (&$Object, &$codegen) {
    $this_ = Func::getContext();
    $ast = null;
    $opts = call_method($Object, "create", (is($or_ = $opts) ? $or_ : new Obj()));
    set($opts, "initVars", get($opts, "initVars") !== false);
    set($this_, "opts", $opts);
    $ast = call_method($this_, "parse", get($opts, "source"));
    return call_method($codegen, "generate", $ast, $opts);
  }));
  set(get($Transformer, "prototype"), "parse", new Func(function($source = null) use (&$rocambole) {
    $this_ = Func::getContext();
    $ast = null;
    $source = call_method($source, "trim");
    $ast = call_method($rocambole, "parse", $source);
    call_method($this_, "transform", $ast);
    return $ast;
  }));
  set(get($Transformer, "prototype"), "transform", new Func(function($ast = null) use (&$rocambole, &$escope, &$indexScope, &$nodeHandlers) {
    $this_ = Func::getContext();
    $self = null; $scopes = null; $count = null;
    $self = $this_;
    call_method($rocambole, "recursive", $ast, new Func(function($node = null) use (&$nodeHandlers, &$self) {
      $type = null;
      $type = get($node, "type");
      if (_in($type, $nodeHandlers)) {
        call_method(get($nodeHandlers, $type), "call", $self, $node);
      }
    }));
    $scopes = get(call_method($escope, "analyze", $ast), "scopes");
    call($indexScope, get($scopes, 0.0));
    $count = 0.0;
    call_method($scopes, "forEach", new Func(function($scope = null) use (&$count) {
      $param = null; $identifiers = null; $suffix = null;
      if (get($scope, "type") === "catch") {
        $param = get(get($scope, "variables"), 0.0);
        $identifiers = new Arr(get(get($param, "identifiers"), 0.0));
        call_method(get($param, "references"), "forEach", new Func(function($ref = null) use (&$identifiers) {
          call_method($identifiers, "push", get($ref, "identifier"));
        }));
        $suffix = _concat("_", ++$count, "_");
        call_method($identifiers, "forEach", new Func(function($identifier = null) use (&$suffix) {
          set($identifier, "appendSuffix", $suffix);
        }));
      }
    }));
  }));
  set(get($Transformer, "prototype"), "replaceNode", new Func(function($oldNode = null, $newNode = null) use (&$Object) {
    $parent = null;
    $parent = get($oldNode, "parent");
    call_method(call_method($Object, "keys", $parent), "forEach", new Func(function($key = null) use (&$oldNode, &$parent, &$newNode) {
      if (get($parent, $key) === $oldNode) {
        set($parent, $key, $newNode);
      }
    }));
    set($newNode, "parent", $parent);
  }));
}));
