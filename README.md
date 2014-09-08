##JavaScript to PHP

This tool transforms JavaScript to PHP. Just for fun. Kind of like [php.js][1] but the opposite.

[View Online Demo][2]

### Why?

This is a proof-of-concept started at a hackathon recently and as far as I can tell, hasn't been done before, so why not?. There's some interesting properties of the two languages that make this a really interesting challenge: lexical scope, prototypal inheritance, duality of `+` operator in JS, PHP's implicit variable declaration, differences in Regular Expression implementations, etc. A lot of this had to be implemented in the form of runtime helpers and type checking, but it turns out it's totally doable.

### What could this possibly be used for?

There are heaps of ["compile to JS"][3] languages out there (Coffee, TypeScript, Dart), but next to nothing for PHP. PHP is ubiquitous in bulk hosting (upwards of 80% of the market), PHP runs on Google App Engine, AppFog, Rackspace Cloud Sites, etc. So if you need to host on PHP but don't like writing PHP, well you're hosed. ...unless you could write in JS and deploy in PHP.

### That's madness!

Well, maybe so. But if you were going to write in one language and compile to PHP, why not JS (or a subset of it). There already exists parsers, static analysis tools, lint tools, refactoring utilities. And you have to know JS anyway because it's in the browser. OK, I'm not suggesting you write production code using this, but who knows, maybe it will mature into something you can take to production in some use-cases. I can imagine at some point in the future someone creating a cool thing in JS and via this tool being able to put it up on CodeCanyon in PHP. The same application might then be run on [Node][4] using [Fibers][7] and the JVM via [Nahsorn][5] or [DynJS][6].

### What about performance?

Sure, you pay a performance penalty at runtime, but seriously, have you run mainstream PHP apps before? It's not exactly like the performance bar is too high (I think a default install of WP performs 27 SQL queries to load the homepage once). Your app is likely not CPU bound and if it is, then you should be running Node + worker processes or some other awesome solution.

Anyway, I'm focusing on correctness, not performance, and this is very alpha stuff, so don't expect too much.

### Project Status

The core language functionality is mostly implemented and has some tests (Object, Array, Math lib, String methods, etc) but there is no interface to the outside world besides `console.log()`. There's no file-system, HTTP or Database module and there's no formal way to call into PHP from JS at this point.

Feel free to contribute if this interests you.

### How to Use

    git clone git@github.com:sstur/js2php.git
    echo "var a = 1; console.log(a + 1)" > example.js
    node js2php --runtime > runtime.php
    node js2php example.js > example.php
    php -f example.php

### How it works

We're using the awesome [esprima][8] JavaScript parser with [rocambole][9] to walk the AST and [escope][10] to figure out what is lexically scoped and hoist function declarations and so on. After several passes of AST manipulation `transformer/codegen.js` generates the PHP code from walking the tree.

Various constructs get wrapped in helper functions, for instance, property access, method calls, `&&`, `||` and `+` operators. The runtime helpers for this mostly live in `php/helpers` and there are a bunch of classes in `php/classes` for Array, RegExp and such. All this PHP gets packaged into runtime.php which is `require`d from your output file.

Have a play with the online demo, but the output code looks something like this:

```php
<?php
require_once("runtime.php");
$HelloWorld = new Func("HelloWorld", function($this_, $arguments, $greeting) {
  set($this_, "greeting", $greeting);
});
set(get($HelloWorld, "prototype"), "go", new Func(function($this_, $arguments, $subject) use (&$console) {
  call_method($console, "log", get($this_, "greeting"), $subject);
}));
call_method(x_new($HelloWorld, "Hi"), "go", "world");
```

It's not particularly elegant, but it's human-readable and has all the basics we need to implement standards-compliant JS in PHP.


[1]: http://phpjs.hertzen.com/
[2]: http://sstur.github.io/js2php/demo/
[3]: https://github.com/jashkenas/coffeescript/wiki/List-of-languages-that-compile-to-JS
[4]: http://nodejs.org/
[5]: http://openjdk.java.net/projects/nashorn/
[6]: http://dynjs.org/
[7]: https://github.com/laverdet/node-fibers/
[8]: http://esprima.org/
[9]: https://github.com/millermedeiros/rocambole
[10]: https://github.com/Constellation/escope
