<?php

call(new Func(function() use (&$require, &$Object, &$exports, &$Error, &$String, &$Array) {
  $util = null; $utils = null; $toString = null; $hasOwnProperty = null; $PRECEDENCE = null; $BINARY_PRECEDENCE = null; $UNARY_NUM_OPS = null; $BINARY_NUM_OPS = null; $BOOL_SAFE_OPS = null; $NUM_SAFE_UNARY_OPS = null; $NUM_SAFE_BINARY_OPS = null; $GLOBALS_ = null;
  $Generator = new Func("Generator", function($opts = null) use (&$Object) {
    $this_ = Func::getContext();
    set($this_, "opts", call_method($Object, "create", (is($or_ = $opts) ? $or_ : new Obj())));
    set($this_, "wrapStringsInObjects", new Arr(true));
  });
  $isStrictDirective = new Func("isStrictDirective", function($stmt = null) {
    $expr = null;
    if (is($stmt) && s_eq($stmt->type, Str::str("ExpressionStatement"))) {
      $expr = $stmt->expression;
      if (s_eq($expr->type, Str::str("Literal")) && s_eq($expr->value, Str::str("use strict"))) {
        return true;
      }
    }
    return false;
  });
  $isBooleanExpr = new Func("isBooleanExpr", function($node = null) use (&$BOOL_SAFE_OPS) {
    $isBooleanExpr = Func::getCurrent();
    if (s_eq($node->type, Str::str("LogicalExpression"))) {
      return (is($and_ = call($isBooleanExpr, $node->left)) ? call($isBooleanExpr, $node->right) : $and_);
    }
    if (s_eq($node->type, Str::str("Literal")) && s_eq(_typeof($node->value), Str::str("boolean"))) {
      return true;
    }
    if (s_eq($node->type, Str::str("BinaryExpression")) && _in($node->operator, $BOOL_SAFE_OPS)) {
      return true;
    }
    if (s_eq($node->type, Str::str("UnaryExpression")) && s_eq($node->operator, Str::str("!"))) {
      return true;
    }
    return false;
  });
  $isNumericExpr = new Func("isNumericExpr", function($node = null) use (&$NUM_SAFE_UNARY_OPS, &$NUM_SAFE_BINARY_OPS) {
    if (s_eq($node->type, Str::str("Literal")) && s_eq(_typeof($node->value), Str::str("number"))) {
      return true;
    }
    if (s_eq($node->type, Str::str("UnaryExpression")) && _in($node->operator, $NUM_SAFE_UNARY_OPS)) {
      return true;
    }
    if (s_eq($node->type, Str::str("BinaryExpression")) && _in($node->operator, $NUM_SAFE_BINARY_OPS)) {
      return true;
    }
  });
  $encodeLiteral = new Func("encodeLiteral", function($value = null, $node = null, $wrapStringInObject = null) use (&$encodeString, &$toString, &$encodeRegExp, &$Error, &$util) {
    $type = null; $rawValue = null;
    $type = s_eq($value, Obj::$null) ? Str::str("null") : (isset($value) ? _typeof($value) : "undefined");
    if (s_eq($type, Str::str("undefined"))) {
      return Str::str("null");
    }
    if (s_eq($type, Str::str("null"))) {
      return Str::str("Obj::\$null");
    }
    if (s_eq($type, Str::str("string"))) {
      if (is($wrapStringInObject)) {
        return _concat(Str::str("Str::str("), call($encodeString, $value), Str::str(")"));
      } else {
        return call($encodeString, $value);
      }

    }
    if (s_eq($type, Str::str("boolean"))) {
      return call_method($value, "toString");
    }
    if (s_eq($type, Str::str("number")) && is($node) && cmp($node->raw->length, '>', 1.0)) {
      if (is(call_method($node->raw, "startsWith", Str::str("0")))) {
        $rawValue = call_method($node->raw, "replace", new RegExp("^0o", ""), Str::str("0"));
        return _concat(Str::str("(float)"), $rawValue);
      }
      if (is((float)~to_number(call_method($node->raw, "indexOf", Str::str("e"))))) {
        return $node->raw;
      }
    }
    if (s_eq($type, Str::str("number"))) {
      $value = call_method($value, "toString");
      return is((float)~to_number(call_method($value, "indexOf", Str::str(".")))) || is((float)~to_number(call_method($value, "indexOf", Str::str("e")))) ? $value : (_concat($value, Str::str(".0")));
    }
    if (s_eq(call_method($toString, "call", $value), Str::str("[object RegExp]"))) {
      return call($encodeRegExp, $value);
    }
    throw new Ex(_new($Error, _concat(Str::str("No handler for literal of type: "), $type, Str::str(": "), call_method($util, "inspect", $value))));
  });
  $encodeRegExp = new Func("encodeRegExp", function($value = null) use (&$encodeString) {
    $flags = null; $source = null;
    $flags = Str::str("");
    if (is($value->global)) {
      $flags = _plus($flags, Str::str("g"));
    }
    if (is($value->ignoreCase)) {
      $flags = _plus($flags, Str::str("i"));
    }
    if (is($value->multiline)) {
      $flags = _plus($flags, Str::str("m"));
    }
    $source = call_method($value->source, "replace", new RegExp("\\\\.", "g"), new Func(function($s = null) {
      return s_eq($s, Str::str("\\/")) ? Str::str("/") : $s;
    }));
    return _concat(Str::str("new RegExp("), call($encodeString, $source), Str::str(", "), call($encodeString, $flags), Str::str(")"));
  });
  $encodeString = new Func("encodeString", function($value = null) use (&$utils) {
    return call_method($utils, "encodeString", $value);
  });
  $encodeVar = new Func("encodeVar", function($identifier = null) use (&$encodeVarName) {
    $name = null;
    $name = $identifier->name;
    return call($encodeVarName, $name, $identifier->appendSuffix);
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
    return $BINARY_PRECEDENCE->get($op);
  });
  $util = call($require, Str::str("util"), __DIR__);
  $utils = call($require, Str::str("./utils"), __DIR__);
  $toString = $Object->prototype->toString;
  $hasOwnProperty = $Object->prototype->hasOwnProperty;
  $PRECEDENCE = new Obj("SEQUENCE", 0.0, "YIELD", 1.0, "ASSIGNMENT", 1.0, "CONDITIONAL", 2.0, "ARROW_FUNCTION", 2.0, "LOGICAL_OR", 3.0, "LOGICAL_AND", 4.0, "BITWISE_OR", 5.0, "BITWISE_XOR", 6.0, "BITWISE_AND", 7.0, "EQUALITY", 8.0, "RELATIONAL", 9.0, "BITWISE_SHIFT", 10.0, "ADDITIVE", 11.0, "MULTIPLICATIVE", 12.0, "UNARY", 13.0, "POSTFIX", 14.0, "CALL", 15.0, "NEW", 16.0, "TAGGED_TEMPLATE", 17.0, "MEMBER", 18.0, "PRIMARY", 19.0);
  $BINARY_PRECEDENCE = new Obj("||", $PRECEDENCE->LOGICAL_OR, "&&", $PRECEDENCE->LOGICAL_AND, "|", $PRECEDENCE->BITWISE_OR, "^", $PRECEDENCE->BITWISE_XOR, "&", $PRECEDENCE->BITWISE_AND, "==", $PRECEDENCE->EQUALITY, "!=", $PRECEDENCE->EQUALITY, "===", $PRECEDENCE->EQUALITY, "!==", $PRECEDENCE->EQUALITY, "<", $PRECEDENCE->RELATIONAL, ">", $PRECEDENCE->RELATIONAL, "<=", $PRECEDENCE->RELATIONAL, ">=", $PRECEDENCE->RELATIONAL, "in", $PRECEDENCE->RELATIONAL, "instanceof", $PRECEDENCE->RELATIONAL, "<<", $PRECEDENCE->BITWISE_SHIFT, ">>", $PRECEDENCE->BITWISE_SHIFT, ">>>", $PRECEDENCE->BITWISE_SHIFT, "+", $PRECEDENCE->ADDITIVE, "-", $PRECEDENCE->ADDITIVE, "*", $PRECEDENCE->MULTIPLICATIVE, "%", $PRECEDENCE->MULTIPLICATIVE, "/", $PRECEDENCE->MULTIPLICATIVE);
  $UNARY_NUM_OPS = new Obj("-", Str::str("_negate"), "+", Str::str("to_number"), "~", Str::str("(float)~"));
  $BINARY_NUM_OPS = new Obj("-", Str::str("-"), "%", Str::str("%"), "*", Str::str("*"), "/", Str::str("_divide"), "&", Str::str("&"), "|", Str::str("|"), "^", Str::str("^"), "<<", Str::str("<<"), ">>", Str::str(">>"), ">>>", Str::str("_bitwise_zfrs"));
  $BOOL_SAFE_OPS = new Obj("===", 1.0, "!==", 1.0, "==", 1.0, "!=", 1.0, "<", 1.0, "<=", 1.0, ">", 1.0, ">=", 1.0, "in", 1.0, "instanceof", 1.0);
  $NUM_SAFE_UNARY_OPS = new Obj("-", 1.0, "+", 1.0, "~", 1.0);
  $NUM_SAFE_BINARY_OPS = new Obj("-", 1.0, "%", 1.0, "*", 1.0, "/", 1.0, "&", 1.0, "|", 1.0, "^", 1.0, "<<", 1.0, ">>", 1.0, ">>>", 1.0);
  $GLOBALS_ = new Obj("Array", 1.0, "Boolean", 1.0, "Buffer", 1.0, "Date", 1.0, "Error", 1.0, "RangeError", 1.0, "ReferenceError", 1.0, "SyntaxError", 1.0, "TypeError", 1.0, "Function", 1.0, "Infinity", 1.0, "JSON", 1.0, "Math", 1.0, "NaN", 1.0, "Number", 1.0, "Object", 1.0, "RegExp", 1.0, "String", 1.0, "console", 1.0, "decodeURI", 1.0, "decodeURIComponent", 1.0, "encodeURI", 1.0, "encodeURIComponent", 1.0, "escape", 1.0, "eval", 1.0, "isFinite", 1.0, "isNaN", 1.0, "parseFloat", 1.0, "parseInt", 1.0, "undefined", 1.0, "unescape", 1.0);
  set($Generator, "prototype", new Obj("toBlock", new Func(function($node = null) {
    $this_ = Func::getContext();
    $opts = null; $result = null;
    $opts = $this_->opts;
    if (s_eq($node->type, Str::str("BlockStatement"))) {
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
    $opts = $this_->opts;
    $scopeNode = s_eq($node->type, Str::str("BlockStatement")) ? $node->parent : $node;
    $scopeIndex = (is($or_ = $scopeNode->scopeIndex) ? $or_ : call_method($Object, "create", Obj::$null));
    $results = new Arr();
    set($opts, "indentLevel", 1.0, "+=");
    if (is($scopeIndex->thisFound)) {
      if (s_eq($node->type, Str::str("Program"))) {
        call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("\$this_ = \$global;\n")));
      } else {
        call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("\$this_ = Func::getContext();\n")));
      }

    }
    if (is($scopeIndex->argumentsFound) && !s_eq($node->type, Str::str("Program"))) {
      call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("\$arguments = Func::getArguments();\n")));
    }
    if (is($node->vars) && is($opts->initVars)) {
      $declarations = new Arr();
      call_method(call_method($Object, "keys", $node->vars), "forEach", new Func(function($name = null) use (&$declarations, &$encodeVarName) {
        call_method($declarations, "push", _concat(call($encodeVarName, $name), Str::str(" = null;")));
      }));
      if (is($declarations->length)) {
        call_method($results, "push", _concat(call_method($this_, "indent"), call_method($declarations, "join", Str::str(" ")), Str::str("\n")));
      }
    }
    $funcDeclarations = $node->funcs;
    if (is($funcDeclarations)) {
      call_method(call_method($Object, "keys", $funcDeclarations), "forEach", new Func(function($name = null) use (&$funcDeclarations, &$results, &$encodeVarName) {
        $this_ = Func::getContext();
        $func = null;
        $func = call_method($this_, "FunctionExpression", $funcDeclarations->get($name));
        call_method($results, "push", _concat(call_method($this_, "indent"), call($encodeVarName, $name), Str::str(" = "), $func, Str::str(";\n")));
      }), $this_);
    }
    call_method($node->body, "forEach", new Func(function($node = null) use (&$results) {
      $this_ = Func::getContext();
      $result = null;
      $result = call_method($this_, "generate", $node);
      if (is($result)) {
        call_method($results, "push", _plus(call_method($this_, "indent"), $result));
      }
    }), $this_);
    if (cmp($opts->indentLevel, '>', 0.0)) {
      set($opts, "indentLevel", 1.0, "-=");
    }
    return call_method($results, "join", Str::str(""));
  }), "BlockStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr(Str::str("{\n"));
    call_method($results, "push", call_method($this_, "Body", $node));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "VariableDeclaration", new Func(function($node = null) use (&$encodeVar) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr();
    call_method($node->declarations, "forEach", new Func(function($node = null) use (&$results, &$encodeVar) {
      $this_ = Func::getContext();
      if (is($node->init)) {
        call_method($results, "push", _concat(call($encodeVar, $node->id), Str::str(" = "), call_method($this_, "generate", $node->init)));
      }
    }), $this_);
    if (not($results->length)) {
      return Str::str("");
    }
    if (s_eq($node->parent->type, Str::str("ForStatement"))) {
      return call_method($results, "join", Str::str(", "));
    }
    return _concat(call_method($results, "join", Str::str("; ")), Str::str(";\n"));
  }), "IfStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr(Str::str("if ("));
    call_method($results, "push", call_method($this_, "truthyWrap", $node->test));
    call_method($results, "push", Str::str(") {\n"));
    call_method($results, "push", call_method($this_, "toBlock", $node->consequent));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    if (is($node->alternate)) {
      call_method($results, "push", Str::str(" else "));
      if (s_eq($node->alternate->type, Str::str("IfStatement"))) {
        call_method($results, "push", call_method($this_, "generate", $node->alternate));
      } else {
        call_method($results, "push", Str::str("{\n"));
        call_method($results, "push", call_method($this_, "toBlock", $node->alternate));
        call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}\n")));
      }

    }
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "SwitchStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $opts = null; $results = null;
    $opts = $this_->opts;
    $results = new Arr(Str::str("switch ("));
    call_method($results, "push", call_method($this_, "generate", $node->discriminant));
    call_method($results, "push", Str::str(") {\n"));
    set($opts, "indentLevel", 1.0, "+=");
    call_method($node->cases, "forEach", new Func(function($node = null) use (&$results, &$opts) {
      $this_ = Func::getContext();
      call_method($results, "push", call_method($this_, "indent"));
      if (s_eq($node->test, Obj::$null)) {
        call_method($results, "push", Str::str("default:\n"));
      } else {
        call_method($this_->wrapStringsInObjects, "push", true);
        call_method($results, "push", _concat(Str::str("case "), call_method($this_, "generate", $node->test), Str::str(":\n")));
        call_method($this_->wrapStringsInObjects, "pop");
      }

      set($opts, "indentLevel", 1.0, "+=");
      call_method($node->consequent, "forEach", new Func(function($node = null) use (&$results) {
        $this_ = Func::getContext();
        call_method($results, "push", _plus(call_method($this_, "indent"), call_method($this_, "generate", $node)));
      }), $this_);
      set($opts, "indentLevel", 1.0, "-=");
    }), $this_);
    set($opts, "indentLevel", 1.0, "-=");
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "ConditionalExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $alternate = null;
    $alternate = call_method($this_, "generate", $node->alternate);
    switch ($node->alternate->type) {
      case Str::str("AssignmentExpression"):
      case Str::str("BinaryExpression"):
      case Str::str("LogicalExpression"):
      case Str::str("UpdateExpression"):
      case Str::str("ConditionalExpression"):
        $alternate = _concat(Str::str("("), $alternate, Str::str(")"));
        break;
    }
    return _concat(call_method($this_, "truthyWrap", $node->test), Str::str(" ? "), call_method($this_, "generate", $node->consequent), Str::str(" : "), $alternate);
  }), "ForStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr(Str::str("for ("));
    call_method($results, "push", _concat(call_method($this_, "generate", $node->init), Str::str("; ")));
    call_method($results, "push", _concat(call_method($this_, "truthyWrap", $node->test), Str::str("; ")));
    call_method($results, "push", call_method($this_, "generate", $node->update));
    call_method($results, "push", Str::str(") {\n"));
    call_method($results, "push", call_method($this_, "toBlock", $node->body));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "ForInStatement", new Func(function($node = null) use (&$Error, &$encodeVar) {
    $this_ = Func::getContext();
    $results = null; $identifier = null;
    $results = new Arr();
    if (s_eq($node->left->type, Str::str("VariableDeclaration"))) {
      $identifier = $node->left->declarations->get(0.0)->id;
    } else if (s_eq($node->left->type, Str::str("Identifier"))) {
      $identifier = $node->left;
    } else {
      throw new Ex(_new($Error, _concat(Str::str("Unknown left part of for..in `"), $node->left->type, Str::str("`"))));
    }


    call_method($results, "push", Str::str("foreach (keys("));
    call_method($results, "push", _concat(call_method($this_, "generate", $node->right), Str::str(") as "), call($encodeVar, $identifier), Str::str(") {\n")));
    call_method($results, "push", call_method($this_, "toBlock", $node->body));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "WhileStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr(Str::str("while ("));
    call_method($results, "push", call_method($this_, "truthyWrap", $node->test));
    call_method($results, "push", Str::str(") {\n"));
    call_method($results, "push", call_method($this_, "toBlock", $node->body));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "DoWhileStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    $results = null;
    $results = new Arr(Str::str("do {\n"));
    call_method($results, "push", call_method($this_, "toBlock", $node->body));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("} while ("), call_method($this_, "truthyWrap", $node->test), Str::str(");")));
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "TryStatement", new Func(function($node = null) use (&$encodeVar) {
    $this_ = Func::getContext();
    $catchClause = null; $param = null; $results = null;
    $catchClause = $node->handlers->get(0.0);
    $param = $catchClause->param;
    $results = new Arr(Str::str("try {\n"));
    call_method($results, "push", call_method($this_, "Body", $node->block));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("} catch(Exception "), call($encodeVar, $param), Str::str(") {\n")));
    call_method($results, "push", _concat(call_method($this_, "indent", 1.0), Str::str("if ("), call($encodeVar, $param), Str::str(" instanceof Ex) "), call($encodeVar, $param), Str::str(" = "), call($encodeVar, $param), Str::str("->value;\n")));
    call_method($results, "push", call_method($this_, "Body", $catchClause->body));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    if (is($node->finalizer)) {
      call_method($results, "push", Str::str(" finally {\n"));
      call_method($results, "push", call_method($this_, "Body", $node->finalizer));
      call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    }
    return _concat(call_method($results, "join", Str::str("")), Str::str("\n"));
  }), "ThrowStatement", new Func(function($node = null) {
    $this_ = Func::getContext();
    return _concat(Str::str("throw new Ex("), call_method($this_, "generate", $node->argument), Str::str(");\n"));
  }), "FunctionExpression", new Func(function($node = null) use (&$isStrictDirective, &$encodeString, &$Object, &$encodeVarName, &$encodeVar) {
    $this_ = Func::getContext();
    $meta = null; $opts = null; $parentIsStrict = null; $results = null; $params = null; $scopeIndex = null; $functionName = null; $unresolvedRefs = null; $useClause = null;
    $meta = new Arr();
    $opts = $this_->opts;
    $parentIsStrict = $opts->isStrict;
    set($opts, "isStrict", (is($or_ = $parentIsStrict) ? $or_ : call($isStrictDirective, $node->body->body->get(0.0))));
    if (s_eq($node->useStrict, false)) {
      set($opts, "isStrict", false);
    }
    if (is($opts->isStrict)) {
      call_method($meta, "push", Str::str("\"strict\" => true"));
    }
    $results = new Arr(Str::str("new Func("));
    if (is($node->id)) {
      call_method($results, "push", _concat(call($encodeString, $node->id->name), Str::str(", ")));
    }
    $params = call_method($node->params, "map", new Func(function($param = null) use (&$encodeVar) {
      return _concat(call($encodeVar, $param), Str::str(" = null"));
    }));
    $scopeIndex = (is($or_ = $node->scopeIndex) ? $or_ : call_method($Object, "create", Obj::$null));
    $functionName = is($node->id) ? $node->id->name : Str::str("");
    if (is($scopeIndex->unresolved->get($functionName))) {
      _delete($scopeIndex->unresolved, $functionName);
    }
    $unresolvedRefs = call_method(call_method($Object, "keys", $scopeIndex->unresolved), "map", new Func(function($name = null) use (&$encodeVarName) {
      return call($encodeVarName, $name);
    }));
    $useClause = is($unresolvedRefs->length) ? _concat(Str::str("use (&"), call_method($unresolvedRefs, "join", Str::str(", &")), Str::str(") ")) : Str::str("");
    call_method($results, "push", _concat(Str::str("function("), call_method($params, "join", Str::str(", ")), Str::str(") "), $useClause, Str::str("{\n")));
    if (is($scopeIndex->referenced->get($functionName))) {
      call_method($results, "push", _concat(call_method($this_, "indent", 1.0), call($encodeVarName, $functionName), Str::str(" = Func::getCurrent();\n")));
    }
    call_method($results, "push", call_method($this_, "Body", $node->body));
    call_method($results, "push", _concat(call_method($this_, "indent"), Str::str("}")));
    if (is($meta->length)) {
      call_method($results, "push", _concat(Str::str(", array("), call_method($meta, "join", Str::str(", ")), Str::str(")")));
    }
    call_method($results, "push", Str::str(")"));
    set($opts, "isStrict", $parentIsStrict);
    return call_method($results, "join", Str::str(""));
  }), "ArrayExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $items = null;
    $items = call_method($node->elements, "map", new Func(function($el = null) {
      $this_ = Func::getContext();
      return s_eq($el, Obj::$null) ? Str::str("Arr::\$empty") : call_method($this_, "generate", $el);
    }), $this_);
    return _concat(Str::str("new Arr("), call_method($items, "join", Str::str(", ")), Str::str(")"));
  }), "ObjectExpression", new Func(function($node = null) use (&$String, &$encodeString) {
    $this_ = Func::getContext();
    $items = null;
    $items = new Arr();
    call_method($node->properties, "forEach", new Func(function($node = null) use (&$String, &$items, &$encodeString) {
      $this_ = Func::getContext();
      $key = null; $keyName = null;
      $key = $node->key;
      $keyName = s_eq($key->type, Str::str("Identifier")) ? $key->name : call($String, $key->value);
      call_method($items, "push", call($encodeString, $keyName));
      call_method($items, "push", call_method($this_, "generate", $node->value));
    }), $this_);
    return _concat(Str::str("new Obj("), call_method($items, "join", Str::str(", ")), Str::str(")"));
  }), "CallExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $args = null; $result = null;
    call_method($this_->wrapStringsInObjects, "push", true);
    $args = call_method($node->arguments, "map", new Func(function($arg = null) {
      $this_ = Func::getContext();
      return call_method($this_, "generate", $arg);
    }), $this_);
    call_method($this_->wrapStringsInObjects, "pop");
    if (s_eq($node->callee->name, Str::str("require"))) {
      call_method($args, "push", Str::str("__DIR__"));
    }
    if (s_eq($node->callee->type, Str::str("MemberExpression"))) {
      $result = _concat(Str::str("call_method("), call_method($this_, "generate", $node->callee->object), Str::str(", "), call_method($this_, "encodeProp", $node->callee), is($args->length) ? _concat(Str::str(", "), call_method($args, "join", Str::str(", "))) : Str::str(""), Str::str(")"));
      return $result;
    } else {
      return _concat(Str::str("call("), call_method($this_, "generate", $node->callee), is($args->length) ? _concat(Str::str(", "), call_method($args, "join", Str::str(", "))) : Str::str(""), Str::str(")"));
    }

  }), "MemberExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $result = null;
    $result = call_method($this_, "generate", $node->object);
    if (is(call_method($result, "startsWith", Str::str("new ")))) {
      $result = _concat(Str::str("("), $result, Str::str(")"));
    }
    if (is($node->computed)) {
      $result = _plus($result, _concat(Str::str("->get("), call_method($this_, "encodeProp", $node), Str::str(")")));
    } else if (is((float)~to_number(call_method($node->property->name, "indexOf", Str::str("\$"))))) {
      $result = _plus($result, _concat(Str::str("->{'"), $node->property->name, Str::str("'}")));
    } else {
      $result = _plus($result, _concat(Str::str("->"), $node->property->name));
    }


    return $result;
  }), "NewExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $args = null;
    $args = call_method($node->arguments, "map", new Func(function($arg = null) {
      $this_ = Func::getContext();
      return call_method($this_, "generate", $arg);
    }), $this_);
    return _concat(Str::str("_new("), call_method($this_, "generate", $node->callee), is($args->length) ? _concat(Str::str(", "), call_method($args, "join", Str::str(", "))) : Str::str(""), Str::str(")"));
  }), "AssignmentExpression", new Func(function($node = null) use (&$GLOBALS_, &$hasOwnProperty, &$utils, &$encodeVar) {
    $this_ = Func::getContext();
    $scope = null; $ident = null;
    if (s_eq($node->left->type, Str::str("MemberExpression"))) {
      if (s_eq($node->operator, Str::str("="))) {
        return _concat(Str::str("set("), call_method($this_, "generate", $node->left->object), Str::str(", "), call_method($this_, "encodeProp", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
      } else {
        return _concat(Str::str("set("), call_method($this_, "generate", $node->left->object), Str::str(", "), call_method($this_, "encodeProp", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(", \""), $node->operator, Str::str("\")"));
      }

    }
    if (is(call_method($hasOwnProperty, "call", $GLOBALS_, $node->left->name))) {
      $scope = call_method($utils, "getParentScope", $node);
      if (s_eq($scope->type, Str::str("Program"))) {
        set($node->left, "appendSuffix", Str::str("_"));
      }
    }
    if (s_eq($node->operator, Str::str("+="))) {
      $ident = call_method($this_, "generate", $node->left);
      return _concat($ident, Str::str(" = _plus("), $ident, Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    return _concat(call($encodeVar, $node->left), Str::str(" "), $node->operator, Str::str(" "), call_method($this_, "generate", $node->right));
  }), "UpdateExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $operator = null; $returnOld = null;
    if (s_eq($node->argument->type, Str::str("MemberExpression"))) {
      $operator = s_eq($node->operator, Str::str("++")) ? Str::str("+=") : Str::str("-=");
      $returnOld = is($node->prefix) ? false : true;
      return _concat(Str::str("set("), call_method($this_, "generate", $node->argument->object), Str::str(", "), call_method($this_, "encodeProp", $node->argument), Str::str(", 1, \""), $operator, Str::str("\", "), $returnOld, Str::str(")"));
    }
    if (is($node->prefix)) {
      return _plus($node->operator, call_method($this_, "generate", $node->argument));
    } else {
      return _plus(call_method($this_, "generate", $node->argument), $node->operator);
    }

  }), "LogicalExpression", new Func(function($node = null) use (&$isBooleanExpr, &$opPrecedence) {
    $this_ = Func::getContext();
    $op = null; $result = null;
    $op = $node->operator;
    if (is(call($isBooleanExpr, $node))) {
      $result = _concat(call_method($this_, "generate", $node->left), Str::str(" "), $op, Str::str(" "), call_method($this_, "generate", $node->right));
      if (cmp(call($opPrecedence, $op), '<', call($opPrecedence, $node->parent->operator))) {
        $result = _concat(Str::str("("), $result, Str::str(")"));
      }
      return $result;
    }
    if (s_eq($op, Str::str("&&"))) {
      return call_method($this_, "genAnd", $node);
    }
    if (s_eq($op, Str::str("||"))) {
      return call_method($this_, "genOr", $node);
    }
  }), "genAnd", new Func(function($node = null) use (&$isBooleanExpr) {
    $this_ = Func::getContext();
    $opts = null; $name = null; $test = null; $result = null;
    $opts = $this_->opts;
    set($opts, "andDepth", eq($opts->andDepth, Obj::$null) ? 0.0 : (_plus($opts->andDepth, 1.0)));
    $name = s_eq($opts->andDepth, 0.0) ? Str::str("\$and_") : (_concat(Str::str("\$and"), $opts->andDepth, Str::str("_")));
    $test = _concat(Str::str("("), $name, Str::str(" = "), call_method($this_, "generate", $node->left), Str::str(")"));
    if (not(call($isBooleanExpr, $node->left))) {
      $test = _concat(Str::str("is"), $test);
    }
    $result = _concat(Str::str("("), $test, Str::str(" ? "), call_method($this_, "generate", $node->right), Str::str(" : "), $name, Str::str(")"));
    set($opts, "andDepth", s_eq($opts->andDepth, 0.0) ? Obj::$null : (to_number($opts->andDepth) - 1.0));
    return $result;
  }), "genOr", new Func(function($node = null) use (&$isBooleanExpr) {
    $this_ = Func::getContext();
    $opts = null; $name = null; $test = null; $result = null;
    $opts = $this_->opts;
    set($opts, "orDepth", eq($opts->orDepth, Obj::$null) ? 0.0 : (_plus($opts->orDepth, 1.0)));
    $name = s_eq($opts->orDepth, 0.0) ? Str::str("\$or_") : (_concat(Str::str("\$or"), $opts->orDepth, Str::str("_")));
    $test = _concat(Str::str("("), $name, Str::str(" = "), call_method($this_, "generate", $node->left), Str::str(")"));
    if (not(call($isBooleanExpr, $node->left))) {
      $test = _concat(Str::str("is"), $test);
    }
    $result = _concat(Str::str("("), $test, Str::str(" ? "), $name, Str::str(" : "), call_method($this_, "generate", $node->right), Str::str(")"));
    set($opts, "orDepth", s_eq($opts->orDepth, 0.0) ? Obj::$null : (to_number($opts->orDepth) - 1.0));
    return $result;
  }), "BinaryExpression", new Func(function($node = null) use (&$BINARY_NUM_OPS, &$isWord, &$isNumericExpr, &$opPrecedence) {
    $this_ = Func::getContext();
    $op = null; $terms = null; $castFloat = null; $toNumber = null; $leftExpr = null; $rightExpr = null; $result = null;
    $op = $node->operator;
    if (s_eq($op, Str::str("+"))) {
      $terms = call_method($node->terms, "map", $this_->generate, $this_);
      if (is($node->isConcat)) {
        return _concat(Str::str("_concat("), call_method($terms, "join", Str::str(", ")), Str::str(")"));
      } else {
        return _concat(Str::str("_plus("), call_method($terms, "join", Str::str(", ")), Str::str(")"));
      }

    }
    if (s_eq($op, Str::str("=="))) {
      return _concat(Str::str("eq("), call_method($this_, "generate", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (s_eq($op, Str::str("==="))) {
      return _concat(Str::str("s_eq("), call_method($this_, "generate", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (s_eq($op, Str::str("!=="))) {
      return _concat(Str::str("!s_eq("), call_method($this_, "generate", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (s_eq($op, Str::str("!="))) {
      return _concat(Str::str("!eq("), call_method($this_, "generate", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (cmp(call_method(new Arr(Str::str("<"), Str::str(">"), Str::str("<="), Str::str(">=")), "indexOf", $op), '>', -1.0)) {
      return _concat(Str::str("cmp("), call_method($this_, "generate", $node->left), Str::str(", '"), $op, Str::str("', "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (cmp(call_method(new Arr(Str::str("<"), Str::str(">"), Str::str("<="), Str::str(">=")), "indexOf", $op), '>', -1.0)) {
      return _concat(Str::str("cmp("), call_method($this_, "generate", $node->left), Str::str(", '"), $op, Str::str("', "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (cmp(call_method(new Arr(Str::str("<"), Str::str(">"), Str::str("<="), Str::str(">=")), "indexOf", $op), '>', -1.0)) {
      return _concat(Str::str("cmp("), call_method($this_, "generate", $node->left), Str::str(", '"), $op, Str::str("', "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (s_eq($op, Str::str(">>>"))) {
      return _concat(Str::str("_bitwise_zfrs("), call_method($this_, "generate", $node->left), Str::str(", "), call_method($this_, "generate", $node->right), Str::str(")"));
    }
    if (s_eq($op, Str::str("%"))) {
      $castFloat = true;
    }
    $toNumber = false;
    if (_in($op, $BINARY_NUM_OPS)) {
      $op = $BINARY_NUM_OPS->get($op);
      $toNumber = true;
    } else if (is(call($isWord, $op))) {
      $op = _concat(Str::str("_"), $op);
    }

    $leftExpr = call_method($this_, "generate", $node->left);
    $rightExpr = call_method($this_, "generate", $node->right);
    if (is(call($isWord, $op))) {
      return _concat($op, Str::str("("), $leftExpr, Str::str(", "), $rightExpr, Str::str(")"));
    } else if (is($toNumber)) {
      if (not(call($isNumericExpr, $node->left))) {
        $leftExpr = _concat(Str::str("to_number("), $leftExpr, Str::str(")"));
      }
      if (not(call($isNumericExpr, $node->right))) {
        $rightExpr = _concat(Str::str("to_number("), $rightExpr, Str::str(")"));
      }
    }

    $result = _concat($leftExpr, Str::str(" "), $op, Str::str(" "), $rightExpr);
    if (is($castFloat)) {
      $result = _concat(Str::str("(float)("), $result, Str::str(")"));
    } else if (cmp(call($opPrecedence, $node->operator), '<', call($opPrecedence, $node->parent->operator))) {
      return _concat(Str::str("("), $result, Str::str(")"));
    }

    return $result;
  }), "UnaryExpression", new Func(function($node = null) use (&$isBooleanExpr, &$encodeLiteral, &$UNARY_NUM_OPS, &$isWord) {
    $this_ = Func::getContext();
    $op = null; $toNumber = null; $result = null;
    $op = $node->operator;
    if (s_eq($op, Str::str("!"))) {
      return is(call($isBooleanExpr, $node->argument)) ? _concat(Str::str("!"), call_method($this_, "generate", $node->argument)) : (_concat(Str::str("not("), call_method($this_, "generate", $node->argument), Str::str(")")));
    }
    if (s_eq($op, Str::str("-")) && s_eq($node->argument->type, Str::str("Literal")) && s_eq(_typeof($node->argument->value), Str::str("number"))) {
      return _concat(Str::str("-"), call($encodeLiteral, $node->argument->value, $node->argument));
    }
    if (s_eq($op, Str::str("typeof")) && s_eq($node->argument->type, Str::str("Identifier"))) {
      return _concat(Str::str("(isset("), call_method($this_, "generate", $node->argument), Str::str(") ? _typeof("), call_method($this_, "generate", $node->argument), Str::str(") : \"undefined\")"));
    }
    if (s_eq($op, Str::str("delete")) && s_eq($node->argument->type, Str::str("MemberExpression"))) {
      return _concat(Str::str("_delete("), call_method($this_, "generate", $node->argument->object), Str::str(", "), call_method($this_, "encodeProp", $node->argument), Str::str(")"));
    }
    $toNumber = false;
    if (_in($op, $UNARY_NUM_OPS)) {
      $op = $UNARY_NUM_OPS->get($op);
      $toNumber = true;
    } else if (is(call($isWord, $op))) {
      $op = _concat(Str::str("_"), $op);
    }

    $result = call_method($this_, "generate", $node->argument);
    if (is(call($isWord, $op))) {
      $result = _concat(Str::str("("), $result, Str::str(")"));
    } else if (is($toNumber)) {
      if (!s_eq($node->argument->type, Str::str("Literal")) || !s_eq(_typeof($node->argument->value), Str::str("number"))) {
        $result = _concat(Str::str("to_number("), $result, Str::str(")"));
      }
    }

    return _plus($op, $result);
  }), "SequenceExpression", new Func(function($node = null) {
    $this_ = Func::getContext();
    $expressions = null;
    $expressions = call_method($node->expressions, "map", new Func(function($node = null) {
      $this_ = Func::getContext();
      return call_method($this_, "generate", $node);
    }), $this_);
    if (s_eq($node->parent->type, Str::str("ForStatement")) && s_eq($node->parent->init, $node)) {
      return call_method($expressions, "join", Str::str(", "));
    } else {
      return _concat(Str::str("_seq("), call_method($expressions, "join", Str::str(", ")), Str::str(")"));
    }

  }), "truthyWrap", new Func(function($node = null) use (&$opPrecedence, &$isBooleanExpr) {
    $this_ = Func::getContext();
    $op = null; $type = null; $result = null;
    if (not($node)) {
      return Str::str("");
    }
    $op = $node->operator;
    $type = $node->type;
    if (s_eq($type, Str::str("LogicalExpression"))) {
      if (s_eq($op, Str::str("&&")) || s_eq($op, Str::str("||"))) {
        $result = _concat(call_method($this_, "truthyWrap", $node->left), Str::str(" "), $op, Str::str(" "), call_method($this_, "truthyWrap", $node->right));
        if (cmp(call($opPrecedence, $op), '<', call($opPrecedence, $node->parent->operator))) {
          $result = _concat(Str::str("("), $result, Str::str(")"));
        }
        return $result;
      }
    }
    if (is(call($isBooleanExpr, $node))) {
      return call_method($this_, "generate", $node);
    } else {
      return _concat(Str::str("is("), call_method($this_, "generate", $node), Str::str(")"));
    }

  }), "generate", new Func(function($node = null) use (&$isStrictDirective, &$Error, &$encodeLiteral, &$encodeVar) {
    $this_ = Func::getContext();
    $opts = null; $type = null; $result = null;
    $opts = $this_->opts;
    if (eq($opts->indentLevel, Obj::$null)) {
      set($opts, "indentLevel", -1.0);
    }
    if (eq($node, Obj::$null)) {
      return Str::str("");
    }
    $type = $node->type;
    switch ($type) {
      case Str::str("Program"):
        set($opts, "isStrict", call($isStrictDirective, $node->body->get(0.0)));
        $result = call_method($this_, "Body", $node);
        break;
      case Str::str("ExpressionStatement"):
        $result = is(call($isStrictDirective, $node)) ? Str::str("") : (_concat(call_method($this_, "generate", $node->expression), Str::str(";\n")));
        break;
      case Str::str("ReturnStatement"):
        $result = _concat(Str::str("return "), call_method($this_, "generate", $node->argument), Str::str(";\n"));
        break;
      case Str::str("ContinueStatement"):
        $result = Str::str("continue;\n");
        break;
      case Str::str("BreakStatement"):
        $result = Str::str("break;\n");
        break;
      case Str::str("EmptyStatement"):
      case Str::str("DebuggerStatement"):
      case Str::str("FunctionDeclaration"):
        $result = Str::str("");
        break;
      case Str::str("IfStatement"):
      case Str::str("SwitchStatement"):
      case Str::str("ForStatement"):
      case Str::str("ForInStatement"):
      case Str::str("WhileStatement"):
      case Str::str("DoWhileStatement"):
      case Str::str("BlockStatement"):
      case Str::str("TryStatement"):
      case Str::str("ThrowStatement"):
        $result = call_method($this_, $type, $node);
        break;
      case Str::str("SwitchCase"):
      case Str::str("CatchClause"):
        throw new Ex(_new($Error, _concat(Str::str("should never encounter: \""), $type, Str::str("\""))));
        break;
      case Str::str("DirectiveStatement"):
      case Str::str("ForOfStatement"):
      case Str::str("LabeledStatement"):
      case Str::str("WithStatement"):
        throw new Ex(_new($Error, _concat(Str::str("unsupported: \""), $type, Str::str("\""))));
        break;
      case Str::str("Literal"):
        $result = call($encodeLiteral, $node->value, $node, $this_->wrapStringsInObjects->get(to_number($this_->wrapStringsInObjects->length) - 1.0));
        break;
      case Str::str("Identifier"):
        $result = call($encodeVar, $node);
        break;
      case Str::str("ThisExpression"):
        $result = Str::str("\$this_");
        break;
      case Str::str("VariableDeclaration"):
      case Str::str("AssignmentExpression"):
        call_method($this_->wrapStringsInObjects, "push", true);
        $result = call_method($this_, $type, $node);
        call_method($this_->wrapStringsInObjects, "pop");
        break;
      case Str::str("FunctionExpression"):
      case Str::str("CallExpression"):
      case Str::str("MemberExpression"):
      case Str::str("NewExpression"):
      case Str::str("ArrayExpression"):
      case Str::str("ObjectExpression"):
      case Str::str("UnaryExpression"):
      case Str::str("BinaryExpression"):
      case Str::str("LogicalExpression"):
      case Str::str("SequenceExpression"):
      case Str::str("UpdateExpression"):
      case Str::str("ConditionalExpression"):
        $result = call_method($this_, $type, $node);
        break;
      case Str::str("ArrayPattern"):
      case Str::str("ObjectPattern"):
      case Str::str("Property"):
        throw new Ex(_new($Error, _concat(Str::str("unsupported: \""), $type, Str::str("\""))));
        break;
      default:
        throw new Ex(_new($Error, _concat(Str::str("unknown node type: \""), $type, Str::str("\""))));
    }
    return $result;
  }), "encodeProp", new Func(function($node = null) use (&$encodeLiteral) {
    $this_ = Func::getContext();
    if (is($node->computed)) {
      return call_method($this_, "generate", $node->property);
    } else {
      return call($encodeLiteral, $node->property->name);
    }

  }), "indent", new Func(function($count = null) use (&$repeat) {
    $this_ = Func::getContext();
    $indentLevel = null;
    $indentLevel = _plus($this_->opts->indentLevel, (is($or_ = $count) ? $or_ : 0.0));
    return call($repeat, Str::str("  "), $indentLevel);
  })));
  set($exports, "generate", new Func(function($ast = null, $opts = null) use (&$Generator) {
    $generator = null;
    $generator = _new($Generator, $opts);
    return call_method($generator, "generate", $ast);
  }));
}));
