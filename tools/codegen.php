<?php

call(new Func(function() use (&$require, &$Object, &$exports, &$Error, &$String, &$Array) {
  $util = null; $utils = null; $toString = null; $hasOwnProperty = null; $PRECEDENCE = null; $BINARY_PRECEDENCE = null; $UNARY_NUM_OPS = null; $BINARY_NUM_OPS = null; $BOOL_SAFE_OPS = null; $NUM_SAFE_UNARY_OPS = null; $NUM_SAFE_BINARY_OPS = null; $GLOBALS_ = null;
  $Generator = new Func("Generator", function($opts = null) use (&$Object) {
    $this_ = Func::getContext();
    set($this_, "opts", call_method($Object, "create", (is($or_ = $opts) ? $or_ : new Obj())));
  });
  $isStrictDirective = new Func("isStrictDirective", function($stmt = null) {
    $expr = null;
    if (is($stmt) && get($stmt, "type") === "ExpressionStatement") {
      $expr = get($stmt, "expression");
      if (get($expr, "type") === "Literal" && get($expr, "value") === "use strict") {
        return true;
      }
    }
    return false;
  });
  $isBooleanExpr = new Func("isBooleanExpr", function($node = null) use (&$BOOL_SAFE_OPS) {
    $isBooleanExpr = Func::getCurrent();
    if (get($node, "type") === "LogicalExpression") {
      return (is($and_ = call($isBooleanExpr, get($node, "left"))) ? call($isBooleanExpr, get($node, "right")) : $and_);
    }
    if (get($node, "type") === "Literal" && _typeof(get($node, "value")) === "boolean") {
      return true;
    }
    if (get($node, "type") === "BinaryExpression" && _in(get($node, "operator"), $BOOL_SAFE_OPS)) {
      return true;
    }
    if (get($node, "type") === "UnaryExpression" && get($node, "operator") === "!") {
      return true;
    }
    return false;
  });
  $isNumericExpr = new Func("isNumericExpr", function($node = null) use (&$NUM_SAFE_UNARY_OPS, &$NUM_SAFE_BINARY_OPS) {
    if (get($node, "type") === "Literal" && _typeof(get($node, "value")) === "number") {
      return true;
    }
    if (get($node, "type") === "UnaryExpression" && _in(get($node, "operator"), $NUM_SAFE_UNARY_OPS)) {
      return true;
    }
    if (get($node, "type") === "BinaryExpression" && _in(get($node, "operator"), $NUM_SAFE_BINARY_OPS)) {
      return true;
    }
  });
  $encodeLiteral = new Func("encodeLiteral", function($value = null, $node = null) use (&$encodeString, &$toString, &$encodeRegExp, &$Error, &$util) {
    $type = null; $rawValue = null;
    $type = $value === Obj::$null ? "null" : (isset($value) ? _typeof($value) : "undefined");
    if ($type === "undefined") {
      return "null";
    }
    if ($type === "null") {
      return "Obj::\$null";
    }
    if ($type === "string") {
      return call($encodeString, $value);
    }
    if ($type === "boolean") {
      return call_method($value, "toString");
    }
    if ($type === "number" && is($node) && cmp(get(get($node, "raw"), "length"), '>', 1.0)) {
      if (is(call_method(get($node, "raw"), "startsWith", "0"))) {
        $rawValue = call_method(get($node, "raw"), "replace", new RegExp("^0o", ""), "0");
        return _concat("(float)", $rawValue);
      }
      if (is((float)~to_number(call_method(get($node, "raw"), "indexOf", "e")))) {
        return get($node, "raw");
      }
    }
    if ($type === "number") {
      $value = call_method($value, "toString");
      return is((float)~to_number(call_method($value, "indexOf", "."))) || is((float)~to_number(call_method($value, "indexOf", "e"))) ? $value : (_concat($value, ".0"));
    }
    if (call_method($toString, "call", $value) === "[object RegExp]") {
      return call($encodeRegExp, $value);
    }
    throw new Ex(_new($Error, _concat("No handler for literal of type: ", $type, ": ", call_method($util, "inspect", $value))));
  });
  $encodeRegExp = new Func("encodeRegExp", function($value = null) use (&$encodeString) {
    $flags = null; $source = null;
    $flags = "";
    if (is(get($value, "global"))) {
      $flags = _plus($flags, "g");
    }
    if (is(get($value, "ignoreCase"))) {
      $flags = _plus($flags, "i");
    }
    if (is(get($value, "multiline"))) {
      $flags = _plus($flags, "m");
    }
    $source = call_method(get($value, "source"), "replace", new RegExp("\\\\.", "g"), new Func(function($s = null) {
      return $s === "\\/" ? "/" : $s;
    }));
    return _concat("new RegExp(", call($encodeString, $source), ", ", call($encodeString, $flags), ")");
  });
  $encodeString = new Func("encodeString", function($value = null) use (&$utils) {
    return call_method($utils, "encodeString", $value);
  });
  $encodeVar = new Func("encodeVar", function($identifier = null) use (&$encodeVarName) {
    $name = null;
    $name = get($identifier, "name");
    return call($encodeVarName, $name, get($identifier, "appendSuffix"));
  });
  $encodeVarName = new Func("encodeVarName", function($name = null, $suffix = null) use (&$utils) {
    return call_method($utils, "encodeVarName", $name, $suffix);
  });
  $repeat = new Func("repeat", function($str = null, $count = null) use (&$Array) {
    return call_method(_new($Array, _plus($count, 1.0)), "join", $str);
  });
  $isWord = new Func("isWord", function($str = null) {
    return is(call_method($str, "match", new RegExp("^[a-z_]+\$", ""))) ? true : false;
  });
  $opPrecedence = new Func("opPrecedence", function($op = null) use (&$BINARY_PRECEDENCE) {
    return get($BINARY_PRECEDENCE, $op);
  });
  $util = call($require, "util", __DIR__);
  $utils = call($require, "./utils", __DIR__);
  $toString = get(get($Object, "prototype"), "toString");
  $hasOwnProperty = get(get($Object, "prototype"), "hasOwnProperty");
  $PRECEDENCE = new Obj("SEQUENCE", 0.0, "YIELD", 1.0, "ASSIGNMENT", 1.0, "CONDITIONAL", 2.0, "ARROW_FUNCTION", 2.0, "LOGICAL_OR", 3.0, "LOGICAL_AND", 4.0, "BITWISE_OR", 5.0, "BITWISE_XOR", 6.0, "BITWISE_AND", 7.0, "EQUALITY", 8.0, "RELATIONAL", 9.0, "BITWISE_SHIFT", 10.0, "ADDITIVE", 11.0, "MULTIPLICATIVE", 12.0, "UNARY", 13.0, "POSTFIX", 14.0, "CALL", 15.0, "NEW", 16.0, "TAGGED_TEMPLATE", 17.0, "MEMBER", 18.0, "PRIMARY", 19.0);
  $BINARY_PRECEDENCE = new Obj("||", get($PRECEDENCE, "LOGICAL_OR"), "&&", get($PRECEDENCE, "LOGICAL_AND"), "|", get($PRECEDENCE, "BITWISE_OR"), "^", get($PRECEDENCE, "BITWISE_XOR"), "&", get($PRECEDENCE, "BITWISE_AND"), "==", get($PRECEDENCE, "EQUALITY"), "!=", get($PRECEDENCE, "EQUALITY"), "===", get($PRECEDENCE, "EQUALITY"), "!==", get($PRECEDENCE, "EQUALITY"), "<", get($PRECEDENCE, "RELATIONAL"), ">", get($PRECEDENCE, "RELATIONAL"), "<=", get($PRECEDENCE, "RELATIONAL"), ">=", get($PRECEDENCE, "RELATIONAL"), "in", get($PRECEDENCE, "RELATIONAL"), "instanceof", get($PRECEDENCE, "RELATIONAL"), "<<", get($PRECEDENCE, "BITWISE_SHIFT"), ">>", get($PRECEDENCE, "BITWISE_SHIFT"), ">>>", get($PRECEDENCE, "BITWISE_SHIFT"), "+", get($PRECEDENCE, "ADDITIVE"), "-", get($PRECEDENCE, "ADDITIVE"), "*", get($PRECEDENCE, "MULTIPLICATIVE"), "%", get($PRECEDENCE, "MULTIPLICATIVE"), "/", get($PRECEDENCE, "MULTIPLICATIVE"));
  $UNARY_NUM_OPS = new Obj("-", "_negate", "+", "to_number", "~", "(float)~");
  $BINARY_NUM_OPS = new Obj("-", "-", "%", "%", "*", "*", "/", "_divide", "&", "&", "|", "|", "^", "^", "<<", "<<", ">>", ">>", ">>>", "_bitwise_zfrs");
  $BOOL_SAFE_OPS = new Obj("===", 1.0, "!==", 1.0, "==", 1.0, "!=", 1.0, "<", 1.0, "<=", 1.0, ">", 1.0, ">=", 1.0, "in", 1.0, "instanceof", 1.0);
  $NUM_SAFE_UNARY_OPS = new Obj("-", 1.0, "+", 1.0, "~", 1.0);
  $NUM_SAFE_BINARY_OPS = new Obj("-", 1.0, "%", 1.0, "*", 1.0, "/", 1.0, "&", 1.0, "|", 1.0, "^", 1.0, "<<", 1.0, ">>", 1.0, ">>>", 1.0);
  $GLOBALS_ = new Obj("Array", 1.0, "Boolean", 1.0, "Buffer", 1.0, "Date", 1.0, "Error", 1.0, "RangeError", 1.0, "ReferenceError", 1.0, "SyntaxError", 1.0, "TypeError", 1.0, "Function", 1.0, "Infinity", 1.0, "JSON", 1.0, "Math", 1.0, "NaN", 1.0, "Number", 1.0, "Object", 1.0, "RegExp", 1.0, "String", 1.0, "console", 1.0, "decodeURI", 1.0, "decodeURIComponent", 1.0, "encodeURI", 1.0, "encodeURIComponent", 1.0, "escape", 1.0, "eval", 1.0, "isFinite", 1.0, "isNaN", 1.0, "parseFloat", 1.0, "parseInt", 1.0, "undefined", 1.0, "unescape", 1.0);
  set($Generator, "prototype", new Obj("toBlock", new Func(function($node = null) {
    $this_ = Func::getContext();
    $opts = null; $result = null;
    $opts = get($this_, "opts");
    if (get($node, "type") === "BlockStatement") {
      return call_method($this_, "Body", $node);
    }
    set($opts, "indentLevel", 1.0, "+=");
    $result = call_method($this_, "generate", $node);
    if (is($result)) {
      $result = _plus(call_method($this_, "indent"), $result);
    }
    set($opts, "indentLevel", 1.0, "-=");
    return $result;
  }), "Body", new Func(function($node = null) use (&$Object, &$encodeVarName) {
    $this_ = Func::getContext();
    $opts = null; $scopeNode = null; $scopeIndex = null; $results = null; $declarations = null; $funcDeclarations = null;
    $opts = get($this_, "opts");
    $scopeNode = get($node, "type") === "BlockStatement" ? get($node, "parent") : $node;
    $scopeIndex = (is($or_ = get($scopeNode, "scopeIndex")) ? $or_ : call_method($Object, "create", Obj::$null));
    $results = new Arr();
    set($opts, "indentLevel", 1.0, "+=");
    if (is(get($scopeIndex, "thisFound"))) {
      if (get($node, "type") === "Program") {
        call_method($results, "push", _concat(call_method($this_, "indent"), "\$this_ = \$global;\n"));
      } else {
        call_method($results, "push", _concat(call_method($this_, "indent"), "\$this_ = Func::getContext();\n"));
      }

    }
    if (is(get($scopeIndex, "argumentsFound")) && get($node, "type") !== "Program") {
      call_method($results, "push", _concat(call_method($this_, "indent"), "\$arguments = Func::getArguments();\n"));
    }
    if (is(get($node, "vars")) && is(get($opts, "initVars"))) {
      $declarations = new Arr();
      call_method(call_method($Object, "keys", get($node, "vars")), "forEach", new Func(function($name = null) use (&$declarations, &$encodeVarName) {
        call_method($declarations, "push", _concat(call($encodeVarName, $name), " = null;"));
      }));
      if (is(get($declarations, "length"))) {
        call_method($results, "push", _concat(call_method($this_, "indent"), call_method($declarations, "join", " "), "\n"));
      }
    }
    $funcDeclarations = get($node, "funcs");
    if (is($funcDeclarations)) {
      call_method(call_method($Object, "keys", $funcDeclarations), "forEach", new Func(function($name = null) use (&$funcDeclarations, &$results, &$encodeVarName) {
        $this_ = Func::getContext();
        $func = null;
        $func = call_method($this_, "FunctionExpression", get($funcDeclarations, $name));
        call_method($results, "push", _concat(call_method($this_, "indent"), call($encodeVarName, $name), " = ", $func, ";\n"));
      }), $this_);
    }
    call_method(get($node, "body"), "forEach", new Func(function($node = null) use (&$results) {
      $this_ = Func::getContext();
      $result = null;
      $result = call_method($this_, "generate", $node);
      if (is($result)) {
        call_method($results, "push", _plus(call_method($this_, "indent"), $result));
      }
    }), $this_);
    if (cmp(get($opts, "indentLevel"), '>', 0.0)) {
      set($opts, "indentLevel", 1.0, "-=");
    }
    return call_method($results, "join", "");
  }), "BlockStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr("{\n");
    call_method($results, "push", call_method($this_, "Body", $node));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "VariableDeclaration", new Func(function($node = null) use (&$encodeVar) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr();
    call_method(get($node, "declarations"), "forEach", new Func(function($node = null) use (&$results, &$encodeVar) {
      $this_ = Func::getContext();
      if (is(get($node, "init"))) {
        call_method($results, "push", _concat(call($encodeVar, get($node, "id")), " = ", call_method($this_, "generate", get($node, "init"))));
      }
    }), $this_);
    if (not(get($results, "length"))) {
      return "";
    }
    if (get(get($node, "parent"), "type") === "ForStatement") {
      return call_method($results, "join", ", ");
    }
    return _concat(call_method($results, "join", "; "), ";\n");
  }), "IfStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr("if (");
    call_method($results, "push", call_method($this_, "truthyWrap", get($node, "test")));
    call_method($results, "push", ") {\n");
    call_method($results, "push", call_method($this_, "toBlock", get($node, "consequent")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    if (is(get($node, "alternate"))) {
      call_method($results, "push", " else ");
      if (get(get($node, "alternate"), "type") === "IfStatement") {
        call_method($results, "push", call_method($this_, "generate", get($node, "alternate")));
      } else {
        call_method($results, "push", "{\n");
        call_method($results, "push", call_method($this_, "toBlock", get($node, "alternate")));
        call_method($results, "push", _concat(call_method($this_, "indent"), "}\n"));
      }

    }
    return _concat(call_method($results, "join", ""), "\n");
  }), "SwitchStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $opts = null; $results = null;
    $opts = get($this_, "opts");
    $results = new Arr("switch (");
    call_method($results, "push", call_method($this_, "generate", get($node, "discriminant")));
    call_method($results, "push", ") {\n");
    set($opts, "indentLevel", 1.0, "+=");
    call_method(get($node, "cases"), "forEach", new Func(function($node = null) use (&$results, &$opts) {
      $this_ = Func::getContext();
      call_method($results, "push", call_method($this_, "indent"));
      if (get($node, "test") === Obj::$null) {
        call_method($results, "push", "default:\n");
      } else {
        call_method($results, "push", _concat("case ", call_method($this_, "generate", get($node, "test")), ":\n"));
      }

      set($opts, "indentLevel", 1.0, "+=");
      call_method(get($node, "consequent"), "forEach", new Func(function($node = null) use (&$results) {
        $this_ = Func::getContext();
        call_method($results, "push", _plus(call_method($this_, "indent"), call_method($this_, "generate", $node)));
      }), $this_);
      set($opts, "indentLevel", 1.0, "-=");
    }), $this_);
    set($opts, "indentLevel", 1.0, "-=");
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "ConditionalExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $alternate = null;
    $alternate = call_method($this_, "generate", get($node, "alternate"));
    switch (get(get($node, "alternate"), "type")) {
      case "AssignmentExpression":
      case "BinaryExpression":
      case "LogicalExpression":
      case "UpdateExpression":
      case "ConditionalExpression":
        $alternate = _concat("(", $alternate, ")");
        break;
    }
    return _concat(call_method($this_, "truthyWrap", get($node, "test")), " ? ", call_method($this_, "generate", get($node, "consequent")), " : ", $alternate);
  }), "ForStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr("for (");
    call_method($results, "push", _concat(call_method($this_, "generate", get($node, "init")), "; "));
    call_method($results, "push", _concat(call_method($this_, "truthyWrap", get($node, "test")), "; "));
    call_method($results, "push", call_method($this_, "generate", get($node, "update")));
    call_method($results, "push", ") {\n");
    call_method($results, "push", call_method($this_, "toBlock", get($node, "body")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "ForInStatement", new Func(function($node = null) use (&$Error, &$encodeVar) {
    $this_ = Func::getContext();
    $results = null; $identifier = null;
    $results = new Arr();
    if (get(get($node, "left"), "type") === "VariableDeclaration") {
      $identifier = get(get(get(get($node, "left"), "declarations"), 0.0), "id");
    } else if (get(get($node, "left"), "type") === "Identifier") {
      $identifier = get($node, "left");
    } else {
      throw new Ex(_new($Error, _concat("Unknown left part of for..in `", get(get($node, "left"), "type"), "`")));
    }


    call_method($results, "push", "foreach (keys(");
    call_method($results, "push", _concat(call_method($this_, "generate", get($node, "right")), ") as ", call($encodeVar, $identifier), ") {\n"));
    call_method($results, "push", call_method($this_, "toBlock", get($node, "body")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "WhileStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr("while (");
    call_method($results, "push", call_method($this_, "truthyWrap", get($node, "test")));
    call_method($results, "push", ") {\n");
    call_method($results, "push", call_method($this_, "toBlock", get($node, "body")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "DoWhileStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr("do {\n");
    call_method($results, "push", call_method($this_, "toBlock", get($node, "body")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "} while (", call_method($this_, "truthyWrap", get($node, "test")), ");"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "TryStatement", new Func(function($node = null) use (&$encodeVar) {
    $this_ = Func::getContext();
    $catchClause = null; $param = null; $results = null;
    $catchClause = get(get($node, "handlers"), 0.0);
    $param = get($catchClause, "param");
    $results = new Arr("try {\n");
    call_method($results, "push", call_method($this_, "Body", get($node, "block")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "} catch(Exception ", call($encodeVar, $param), ") {\n"));
    call_method($results, "push", _concat(call_method($this_, "indent", 1.0), "if (", call($encodeVar, $param), " instanceof Ex) ", call($encodeVar, $param), " = ", call($encodeVar, $param), "->value;\n"));
    call_method($results, "push", call_method($this_, "Body", get($catchClause, "body")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    return _concat(call_method($results, "join", ""), "\n");
  }), "ThrowStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    return _concat("throw new Ex(", call_method($this_, "generate", get($node, "argument")), ");\n");
  }), "FunctionExpression", new Func(function($node = null) use (&$isStrictDirective, &$encodeString, &$Object, &$encodeVarName, &$encodeVar) {
    $this_ = Func::getContext();
    $meta = null; $opts = null; $parentIsStrict = null; $results = null; $params = null; $scopeIndex = null; $functionName = null; $unresolvedRefs = null; $useClause = null;
    $meta = new Arr();
    $opts = get($this_, "opts");
    $parentIsStrict = get($opts, "isStrict");
    set($opts, "isStrict", (is($or_ = $parentIsStrict) ? $or_ : call($isStrictDirective, get(get(get($node, "body"), "body"), 0.0))));
    if (get($node, "useStrict") === false) {
      set($opts, "isStrict", false);
    }
    if (is(get($opts, "isStrict"))) {
      call_method($meta, "push", "\"strict\" => true");
    }
    $results = new Arr("new Func(");
    if (is(get($node, "id"))) {
      call_method($results, "push", _concat(call($encodeString, get(get($node, "id"), "name")), ", "));
    }
    $params = call_method(get($node, "params"), "map", new Func(function($param = null) use (&$encodeVar) {
      return _concat(call($encodeVar, $param), " = null");
    }));
    $scopeIndex = (is($or_ = get($node, "scopeIndex")) ? $or_ : call_method($Object, "create", Obj::$null));
    $functionName = is(get($node, "id")) ? get(get($node, "id"), "name") : "";
    if (is(get(get($scopeIndex, "unresolved"), $functionName))) {
      _delete(get($scopeIndex, "unresolved"), $functionName);
    }
    $unresolvedRefs = call_method(call_method($Object, "keys", get($scopeIndex, "unresolved")), "map", new Func(function($name = null) use (&$encodeVarName) {
      return call($encodeVarName, $name);
    }));
    $useClause = is(get($unresolvedRefs, "length")) ? _concat("use (&", call_method($unresolvedRefs, "join", ", &"), ") ") : "";
    call_method($results, "push", _concat("function(", call_method($params, "join", ", "), ") ", $useClause, "{\n"));
    if (is(get(get($scopeIndex, "referenced"), $functionName))) {
      call_method($results, "push", _concat(call_method($this_, "indent", 1.0), call($encodeVarName, $functionName), " = Func::getCurrent();\n"));
    }
    call_method($results, "push", call_method($this_, "Body", get($node, "body")));
    call_method($results, "push", _concat(call_method($this_, "indent"), "}"));
    if (is(get($meta, "length"))) {
      call_method($results, "push", _concat(", array(", call_method($meta, "join", ", "), ")"));
    }
    call_method($results, "push", ")");
    set($opts, "isStrict", $parentIsStrict);
    return call_method($results, "join", "");
  }), "ArrayExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $items = null;
    $items = call_method(get($node, "elements"), "map", new Func(function($el = null) {
      $this_ = Func::getContext();
      return $el === Obj::$null ? "Arr::\$empty" : call_method($this_, "generate", $el);
    }), $this_);
    return _concat("new Arr(", call_method($items, "join", ", "), ")");
  }), "ObjectExpression", new Func(function($node = null) use (&$String, &$encodeString) {
    $this_ = Func::getContext();
    $items = null;
    $items = new Arr();
    call_method(get($node, "properties"), "forEach", new Func(function($node = null) use (&$String, &$items, &$encodeString) {
      $this_ = Func::getContext();
      $key = null; $keyName = null;
      $key = get($node, "key");
      $keyName = get($key, "type") === "Identifier" ? get($key, "name") : call($String, get($key, "value"));
      call_method($items, "push", call($encodeString, $keyName));
      call_method($items, "push", call_method($this_, "generate", get($node, "value")));
    }), $this_);
    return _concat("new Obj(", call_method($items, "join", ", "), ")");
  }), "CallExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $args = null;
    $args = call_method(get($node, "arguments"), "map", new Func(function($arg = null) {
      $this_ = Func::getContext();
      return call_method($this_, "generate", $arg);
    }), $this_);
    if (get(get($node, "callee"), "name") === "require") {
      call_method($args, "push", "__DIR__");
    }
    if (get(get($node, "callee"), "type") === "MemberExpression") {
      return _concat("call_method(", call_method($this_, "generate", get(get($node, "callee"), "object")), ", ", call_method($this_, "encodeProp", get($node, "callee")), is(get($args, "length")) ? _concat(", ", call_method($args, "join", ", ")) : "", ")");
    } else {
      return _concat("call(", call_method($this_, "generate", get($node, "callee")), is(get($args, "length")) ? _concat(", ", call_method($args, "join", ", ")) : "", ")");
    }

  }), "MemberExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    return _concat("get(", call_method($this_, "generate", get($node, "object")), ", ", call_method($this_, "encodeProp", $node), ")");
  }), "NewExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $args = null;
    $args = call_method(get($node, "arguments"), "map", new Func(function($arg = null) {
      $this_ = Func::getContext();
      return call_method($this_, "generate", $arg);
    }), $this_);
    return _concat("_new(", call_method($this_, "generate", get($node, "callee")), is(get($args, "length")) ? _concat(", ", call_method($args, "join", ", ")) : "", ")");
  }), "AssignmentExpression", new Func(function($node = null) use (&$GLOBALS_, &$hasOwnProperty, &$utils, &$encodeVar) {
    $this_ = Func::getContext();
    $scope = null; $ident = null;
    if (get(get($node, "left"), "type") === "MemberExpression") {
      if (get($node, "operator") === "=") {
        return _concat("set(", call_method($this_, "generate", get(get($node, "left"), "object")), ", ", call_method($this_, "encodeProp", get($node, "left")), ", ", call_method($this_, "generate", get($node, "right")), ")");
      } else {
        return _concat("set(", call_method($this_, "generate", get(get($node, "left"), "object")), ", ", call_method($this_, "encodeProp", get($node, "left")), ", ", call_method($this_, "generate", get($node, "right")), ", \"", get($node, "operator"), "\")");
      }

    }
    if (is(call_method($hasOwnProperty, "call", $GLOBALS_, get(get($node, "left"), "name")))) {
      $scope = call_method($utils, "getParentScope", $node);
      if (get($scope, "type") === "Program") {
        set(get($node, "left"), "appendSuffix", "_");
      }
    }
    if (get($node, "operator") === "+=") {
      $ident = call_method($this_, "generate", get($node, "left"));
      return _concat($ident, " = _plus(", $ident, ", ", call_method($this_, "generate", get($node, "right")), ")");
    }
    return _concat(call($encodeVar, get($node, "left")), " ", get($node, "operator"), " ", call_method($this_, "generate", get($node, "right")));
  }), "UpdateExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $operator = null; $returnOld = null;
    if (get(get($node, "argument"), "type") === "MemberExpression") {
      $operator = get($node, "operator") === "++" ? "+=" : "-=";
      $returnOld = is(get($node, "prefix")) ? false : true;
      return _concat("set(", call_method($this_, "generate", get(get($node, "argument"), "object")), ", ", call_method($this_, "encodeProp", get($node, "argument")), ", 1, \"", $operator, "\", ", $returnOld, ")");
    }
    if (is(get($node, "prefix"))) {
      return _plus(get($node, "operator"), call_method($this_, "generate", get($node, "argument")));
    } else {
      return _plus(call_method($this_, "generate", get($node, "argument")), get($node, "operator"));
    }

  }), "LogicalExpression", new Func(function($node = null) use (&$isBooleanExpr, &$opPrecedence) {
    $this_ = Func::getContext();
    $op = null; $result = null;
    $op = get($node, "operator");
    if (is(call($isBooleanExpr, $node))) {
      $result = _concat(call_method($this_, "generate", get($node, "left")), " ", $op, " ", call_method($this_, "generate", get($node, "right")));
      if (cmp(call($opPrecedence, $op), '<', call($opPrecedence, get(get($node, "parent"), "operator")))) {
        $result = _concat("(", $result, ")");
      }
      return $result;
    }
    if ($op === "&&") {
      return call_method($this_, "genAnd", $node);
    }
    if ($op === "||") {
      return call_method($this_, "genOr", $node);
    }
  }), "genAnd", new Func(function($node = null) use (&$isBooleanExpr) {
    $this_ = Func::getContext();
    $opts = null; $name = null; $test = null; $result = null;
    $opts = get($this_, "opts");
    set($opts, "andDepth", eq(get($opts, "andDepth"), Obj::$null) ? 0.0 : (_plus(get($opts, "andDepth"), 1.0)));
    $name = get($opts, "andDepth") === 0.0 ? "\$and_" : (_concat("\$and", get($opts, "andDepth"), "_"));
    $test = _concat("(", $name, " = ", call_method($this_, "generate", get($node, "left")), ")");
    if (not(call($isBooleanExpr, get($node, "left")))) {
      $test = _concat("is", $test);
    }
    $result = _concat("(", $test, " ? ", call_method($this_, "generate", get($node, "right")), " : ", $name, ")");
    set($opts, "andDepth", get($opts, "andDepth") === 0.0 ? Obj::$null : (to_number(get($opts, "andDepth")) - 1.0));
    return $result;
  }), "genOr", new Func(function($node = null) use (&$isBooleanExpr) {
    $this_ = Func::getContext();
    $opts = null; $name = null; $test = null; $result = null;
    $opts = get($this_, "opts");
    set($opts, "orDepth", eq(get($opts, "orDepth"), Obj::$null) ? 0.0 : (_plus(get($opts, "orDepth"), 1.0)));
    $name = get($opts, "orDepth") === 0.0 ? "\$or_" : (_concat("\$or", get($opts, "orDepth"), "_"));
    $test = _concat("(", $name, " = ", call_method($this_, "generate", get($node, "left")), ")");
    if (not(call($isBooleanExpr, get($node, "left")))) {
      $test = _concat("is", $test);
    }
    $result = _concat("(", $test, " ? ", $name, " : ", call_method($this_, "generate", get($node, "right")), ")");
    set($opts, "orDepth", get($opts, "orDepth") === 0.0 ? Obj::$null : (to_number(get($opts, "orDepth")) - 1.0));
    return $result;
  }), "BinaryExpression", new Func(function($node = null) use (&$BINARY_NUM_OPS, &$isWord, &$isNumericExpr, &$opPrecedence) {
    $this_ = Func::getContext();
    $op = null; $terms = null; $castFloat = null; $toNumber = null; $leftExpr = null; $rightExpr = null; $result = null;
    $op = get($node, "operator");
    if ($op === "+") {
      $terms = call_method(get($node, "terms"), "map", get($this_, "generate"), $this_);
      if (is(get($node, "isConcat"))) {
        return _concat("_concat(", call_method($terms, "join", ", "), ")");
      } else {
        return _concat("_plus(", call_method($terms, "join", ", "), ")");
      }

    }
    if ($op === "==") {
      return _concat("eq(", call_method($this_, "generate", get($node, "left")), ", ", call_method($this_, "generate", get($node, "right")), ")");
    }
    if ($op === "!=") {
      return _concat("!eq(", call_method($this_, "generate", get($node, "left")), ", ", call_method($this_, "generate", get($node, "right")), ")");
    }
    if (cmp(call_method(new Arr("<", ">", "<=", ">="), "indexOf", $op), '>', -1.0)) {
      return _concat("cmp(", call_method($this_, "generate", get($node, "left")), ", '", $op, "', ", call_method($this_, "generate", get($node, "right")), ")");
    }
    if (cmp(call_method(new Arr("<", ">", "<=", ">="), "indexOf", $op), '>', -1.0)) {
      return _concat("cmp(", call_method($this_, "generate", get($node, "left")), ", '", $op, "', ", call_method($this_, "generate", get($node, "right")), ")");
    }
    if (cmp(call_method(new Arr("<", ">", "<=", ">="), "indexOf", $op), '>', -1.0)) {
      return _concat("cmp(", call_method($this_, "generate", get($node, "left")), ", '", $op, "', ", call_method($this_, "generate", get($node, "right")), ")");
    }
    if ($op === ">>>") {
      return _concat("_bitwise_zfrs(", call_method($this_, "generate", get($node, "left")), ", ", call_method($this_, "generate", get($node, "right")), ")");
    }
    if ($op === "%") {
      $castFloat = true;
    }
    $toNumber = false;
    if (_in($op, $BINARY_NUM_OPS)) {
      $op = get($BINARY_NUM_OPS, $op);
      $toNumber = true;
    } else if (is(call($isWord, $op))) {
      $op = _concat("_", $op);
    }

    $leftExpr = call_method($this_, "generate", get($node, "left"));
    $rightExpr = call_method($this_, "generate", get($node, "right"));
    if (is(call($isWord, $op))) {
      return _concat($op, "(", $leftExpr, ", ", $rightExpr, ")");
    } else if (is($toNumber)) {
      if (not(call($isNumericExpr, get($node, "left")))) {
        $leftExpr = _concat("to_number(", $leftExpr, ")");
      }
      if (not(call($isNumericExpr, get($node, "right")))) {
        $rightExpr = _concat("to_number(", $rightExpr, ")");
      }
    }

    $result = _concat($leftExpr, " ", $op, " ", $rightExpr);
    if (is($castFloat)) {
      $result = _concat("(float)(", $result, ")");
    } else if (cmp(call($opPrecedence, get($node, "operator")), '<', call($opPrecedence, get(get($node, "parent"), "operator")))) {
      return _concat("(", $result, ")");
    }

    return $result;
  }), "UnaryExpression", new Func(function($node = null) use (&$isBooleanExpr, &$encodeLiteral, &$UNARY_NUM_OPS, &$isWord) {
    $this_ = Func::getContext();
    $op = null; $toNumber = null; $result = null;
    $op = get($node, "operator");
    if ($op === "!") {
      return is(call($isBooleanExpr, get($node, "argument"))) ? _concat("!", call_method($this_, "generate", get($node, "argument"))) : (_concat("not(", call_method($this_, "generate", get($node, "argument")), ")"));
    }
    if ($op === "-" && get(get($node, "argument"), "type") === "Literal" && _typeof(get(get($node, "argument"), "value")) === "number") {
      return _concat("-", call($encodeLiteral, get(get($node, "argument"), "value"), get($node, "argument")));
    }
    if ($op === "typeof" && get(get($node, "argument"), "type") === "Identifier") {
      return _concat("(isset(", call_method($this_, "generate", get($node, "argument")), ") ? _typeof(", call_method($this_, "generate", get($node, "argument")), ") : \"undefined\")");
    }
    if ($op === "delete" && get(get($node, "argument"), "type") === "MemberExpression") {
      return _concat("_delete(", call_method($this_, "generate", get(get($node, "argument"), "object")), ", ", call_method($this_, "encodeProp", get($node, "argument")), ")");
    }
    $toNumber = false;
    if (_in($op, $UNARY_NUM_OPS)) {
      $op = get($UNARY_NUM_OPS, $op);
      $toNumber = true;
    } else if (is(call($isWord, $op))) {
      $op = _concat("_", $op);
    }

    $result = call_method($this_, "generate", get($node, "argument"));
    if (is(call($isWord, $op))) {
      $result = _concat("(", $result, ")");
    } else if (is($toNumber)) {
      if (get(get($node, "argument"), "type") !== "Literal" || _typeof(get(get($node, "argument"), "value")) !== "number") {
        $result = _concat("to_number(", $result, ")");
      }
    }

    return _plus($op, $result);
  }), "SequenceExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $expressions = null;
    $expressions = call_method(get($node, "expressions"), "map", new Func(function($node = null) {
      $this_ = Func::getContext();
      return call_method($this_, "generate", $node);
    }), $this_);
    if (get(get($node, "parent"), "type") === "ForStatement" && get(get($node, "parent"), "init") === $node) {
      return call_method($expressions, "join", ", ");
    } else {
      return _concat("_seq(", call_method($expressions, "join", ", "), ")");
    }

  }), "truthyWrap", new Func(function($node = null) use (&$opPrecedence, &$isBooleanExpr) {
    $this_ = Func::getContext();
    $op = null; $type = null; $result = null;
    if (not($node)) {
      return "";
    }
    $op = get($node, "operator");
    $type = get($node, "type");
    if ($type === "LogicalExpression") {
      if ($op === "&&" || $op === "||") {
        $result = _concat(call_method($this_, "truthyWrap", get($node, "left")), " ", $op, " ", call_method($this_, "truthyWrap", get($node, "right")));
        if (cmp(call($opPrecedence, $op), '<', call($opPrecedence, get(get($node, "parent"), "operator")))) {
          $result = _concat("(", $result, ")");
        }
        return $result;
      }
    }
    if (is(call($isBooleanExpr, $node))) {
      return call_method($this_, "generate", $node);
    } else {
      return _concat("is(", call_method($this_, "generate", $node), ")");
    }

  }), "generate", new Func(function($node = null) use (&$isStrictDirective, &$Error, &$encodeLiteral, &$encodeVar) {
    $this_ = Func::getContext();
    $opts = null; $type = null; $result = null;
    $opts = get($this_, "opts");
    if (eq(get($opts, "indentLevel"), Obj::$null)) {
      set($opts, "indentLevel", -1.0);
    }
    if (eq($node, Obj::$null)) {
      return "";
    }
    $type = get($node, "type");
    switch ($type) {
      case "Program":
        set($opts, "isStrict", call($isStrictDirective, get(get($node, "body"), 0.0)));
        $result = call_method($this_, "Body", $node);
        break;
      case "ExpressionStatement":
        $result = is(call($isStrictDirective, $node)) ? "" : (_concat(call_method($this_, "generate", get($node, "expression")), ";\n"));
        break;
      case "ReturnStatement":
        $result = _concat("return ", call_method($this_, "generate", get($node, "argument")), ";\n");
        break;
      case "ContinueStatement":
        $result = "continue;\n";
        break;
      case "BreakStatement":
        $result = "break;\n";
        break;
      case "EmptyStatement":
      case "DebuggerStatement":
      case "FunctionDeclaration":
        $result = "";
        break;
      case "VariableDeclaration":
      case "IfStatement":
      case "SwitchStatement":
      case "ForStatement":
      case "ForInStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "BlockStatement":
      case "TryStatement":
      case "ThrowStatement":
        $result = call_method($this_, $type, $node);
        break;
      case "SwitchCase":
      case "CatchClause":
        throw new Ex(_new($Error, _concat("should never encounter: \"", $type, "\"")));
        break;
      case "DirectiveStatement":
      case "ForOfStatement":
      case "LabeledStatement":
      case "WithStatement":
        throw new Ex(_new($Error, _concat("unsupported: \"", $type, "\"")));
        break;
      case "Literal":
        $result = call($encodeLiteral, get($node, "value"), $node);
        break;
      case "Identifier":
        $result = call($encodeVar, $node);
        break;
      case "ThisExpression":
        $result = "\$this_";
        break;
      case "FunctionExpression":
      case "AssignmentExpression":
      case "CallExpression":
      case "MemberExpression":
      case "NewExpression":
      case "ArrayExpression":
      case "ObjectExpression":
      case "UnaryExpression":
      case "BinaryExpression":
      case "LogicalExpression":
      case "SequenceExpression":
      case "UpdateExpression":
      case "ConditionalExpression":
        $result = call_method($this_, $type, $node);
        break;
      case "ArrayPattern":
      case "ObjectPattern":
      case "Property":
        throw new Ex(_new($Error, _concat("unsupported: \"", $type, "\"")));
        break;
      default:
        throw new Ex(_new($Error, _concat("unknown node type: \"", $type, "\"")));
    }
    return $result;
  }), "encodeProp", new Func(function($node = null) use (&$encodeLiteral) {
    $this_ = Func::getContext();
    if (is(get($node, "computed"))) {
      return call_method($this_, "generate", get($node, "property"));
    } else {
      return call($encodeLiteral, get(get($node, "property"), "name"));
    }

  }), "indent", new Func(function($count = null) use (&$repeat) {
    $this_ = Func::getContext();
    $indentLevel = null;
    $indentLevel = _plus(get(get($this_, "opts"), "indentLevel"), (is($or_ = $count) ? $or_ : 0.0));
    return call($repeat, "  ", $indentLevel);
  })));
  set($exports, "generate", new Func(function($ast = null, $opts = null) use (&$Generator) {
    $generator = null;
    $generator = _new($Generator, $opts);
    return call_method($generator, "generate", $ast);
  }));
}));
