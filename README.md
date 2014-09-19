##JavaScript to PHP

This tool transforms JavaScript to PHP. Just for fun.

[View Online Demo][2]

[![Example Code](/demo/images/example.png?raw=true)][2]

### Why?

This is a proof-of-concept started at a hackathon recently to see if it could be done. There's some interesting aspects of the two languages that make this a really interesting challenge: lexical scope, prototypal inheritance, duality of `+` operator in JS, PHP's implicit variable declaration, etc. A lot of this had to be implemented in runtime helpers with type checking, but it turns out it's totally doable.

### What could this possibly be used for?

There are plenty of ["compile to JS"][3] languages out there (Coffee, TypeScript, Dart), but few good choices in the PHP world[**](#alternatives). PHP is ubiquitous in bulk hosting (80+ percent of the market). PHP runs on Google App Engine, AppFog, Rackspace Cloud Sites and every LAMP stack in the world. So if you need to host on PHP but don't like writing PHP, well you're hosed. ...unless you could write in JS and deploy to PHP!

### That's madness!

Maybe so. But if you were to write in one language and compile to PHP, JavaScript (or a subset thereof) would be a great choice. There's plenty of tooling, libraries, community, etc. Plus web developers have to know JS anyway because it's in the browser. OK, I'm not suggesting you write production code using this, but who knows, maybe it will mature into something you can take to production in the future. I could imagine someone creating a cool thing in JS and then compiling to PHP to put it up on CodeCanyon. The same application might then be run on [Node][4] using [Fibers][7] and the JVM via [Nahsorn][5] or [DynJS][6].

### What about performance?

Sure, you pay a performance penalty at runtime, but seriously, have you run mainstream PHP apps before? It's not like the performance bar is too high (I think a default WP install runs 27 SQL queries to render the homepage). Your app is likely not CPU bound anyway (and if it is, then you should be running Node + worker processes or some other awesome solution).

At this point I'm focusing on correctness, not performance, and this is very alpha stuff, so don't expect too much.

### Project Status

The core language is mostly implemented and has some tests (Object, Array, Math lib, String methods, etc) but there is no interface to the outside world besides `console.log()`. There's no file-system, HTTP or Database modules and there's no formal way to call into PHP from JS at this point.

Feel free to contribute if this interests you.

### How to Use

    git clone git@github.com:sstur/js2php.git
    cd js2php
    npm install
    echo "var a = 1; console.log(a + 1)" > example.js
    node js2php example.js > example.php
    php -f example.php

### How it works

We're using the awesome [esprima][8] JavaScript parser with [rocambole][9] to walk the AST and [escope][10] to figure out variable scope, hoist function declarations and so on. After AST manipulation `tools/codegen.js` generates the PHP code from walking the tree.

Various constructs get wrapped in helper functions, for instance, property access, method calls, `&&`, `||` and `+` operators. The runtime helpers for this mostly live in `php/helpers` and there are a bunch of classes in `php/classes` for Array, RegExp and such. All this PHP gets packaged into your output file, or you can save it to a standalone runtime and reference that from your output file like so:

    node js2php --runtime-only > runtime.php
    node js2php --runtime runtime.php example.js > example.php

You can also specify the output file using `-o` or `--out` and you can compile multiple input files into one output file like so:

    node js2php -o example.php file1.js file2.js

Have a play with the [online demo][2]. The generated code will look something like this:

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

### Alternatives
There are a few other "compile to PHP" languages out there, but none have the kind of support and tooling of an established language like JavaScript. [Haxe][11] is probably the most popular and is a solid statically-typed language. I also came across [Pharen][13] (a Lisp implementation), [Mammouth][14] (similar to CoffeeScript) and [Pratphall][15] (TypeScript syntax). There's also another [JS to PHP project][17] which takes a different approach (it's written in PHP and produces unreadable, hard-to-debug PHP) but is also interesting.

### Tests
Run `npm test` which is the same as `node js2php --test`. Requires PHP 5.3+ or [HHVM][16].

### BSD License
Copyright (c) 2014, sstur@me.com. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.

 * Neither the name of the author nor the names of its contributors may be used
   to endorse or promote products derived from this software without specific
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


[2]: http://sstur.github.io/js2php/demo/
[3]: https://github.com/jashkenas/coffeescript/wiki/List-of-languages-that-compile-to-JS
[4]: http://nodejs.org/
[5]: http://openjdk.java.net/projects/nashorn/
[6]: http://dynjs.org/
[7]: https://github.com/laverdet/node-fibers/
[8]: http://esprima.org/
[9]: https://github.com/millermedeiros/rocambole
[10]: https://github.com/Constellation/escope
[11]: http://haxe.org/
[13]: http://scriptor.github.io/pharen/
[14]: http://mammouth.wamalaka.com/
[15]: http://cretz.github.io/pratphall/
[16]: http://hhvm.com/
[17]: https://github.com/jakubkulhan/js2php
