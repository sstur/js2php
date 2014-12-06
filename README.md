##JavaScript to PHP

This tool transforms JavaScript to PHP. Just for fun.

[View Online Demo][2]

[![Example Code](https://raw.githubusercontent.com/sstur/js2php/master/demo/images/example.png)][2]

### Why?

This is a proof-of-concept started at a hackathon recently, just for fun. There are various aspects of the two languages that make this a really interesting challenge: lexical scope, prototypal inheritance, duality of `+` operator in JS, PHP's implicit variable declaration, etc. A lot of this had to be implemented in runtime helpers with type checking, but it turns out JavaScript and PHP are similar enough to do this as a source transformation without actually building an interpreter.

### What could this possibly be used for?

There are dozens of ["compile to JS"][3] languages available (Coffee, TypeScript, Dart), but not many good choices in the PHP space[**](#alternatives). PHP is ubiquitous in bulk hosting, it runs on almost every web server around. PHP applications are generally easy to host and maintain. So if you need to host on PHP but don't like writing PHP, well tough. ...unless you could write in JS and deploy to PHP!

### That's madness!

Maybe so. But if you wanted a compile-to-PHP language, JavaScript is a fairly solid choice. There's heaps of tooling, libraries, community, etc. Plus web developers should know JavaScript anyway because it's the language of the browser. We're not at a place where you can really deploy this stuff to production, but that could become feasible at some point. I can imagine building a simple web app in JS and then compiling it to PHP to run on a LAMP stack and then run the same application on [Node][4] using [Fibers][7] or maybe even on the JVM via [Nahsorn][5] or [DynJS][6] (stay tuned for a PoC).

Another use case might be allowing some user-generated scripting (think plugins). Your application could compile user-generated JS safely to PHP to be run server-side. None of the usual PHP functions are exposed and there is no disk/network access or eval. You can expose a carefully defined set of functions to JS land.

### What about performance?

Sure, you'll take a performance hit at runtime, but let's face it, mainstream PHP apps haven't exactly set the performance bar too high (I think a default WP install runs 27 SQL queries to render a single page). Your app is likely not CPU bound anyway (and if it is, you should be running Node + worker processes or some other awesome solution).

At this point I'm focusing on correctness, not performance, and this is very alpha stuff, but so far it seems the performance penalty is not prohibitively expensive.

### Project Status

The core language constructs, classes and methods are mostly implemented and we have decent test coverage. I'm working on an opt-in module system to interface with request/response and file-system. Database access, HTTP client, crypto and other modules to follow. Specific modules can be specified at compile time; by default js2php will only allow access to the outside world via `console.log()` and `process.exit()` so the generated PHP is completely safe.

Feel free to contribute if this interests you.

### How to Use
Install from GitHub:

    git clone git@github.com:sstur/js2php.git
    cd js2php
    npm install

Install from npm:

    npm install -g jstophp

When you install from npm using the `-g` flag, you can run it from any directory by simply calling `js2php` rather than calling `node path/to/js2php`. The rest of the examples in this readme will call it this way. 

Compile and run a simple example: 

    echo 'var x = "world"; console.log("hi " + x)' | js2php --quiet | php

or, a more verbose example: 

    echo "var a = 1; console.log(a + 1)" > example.js
    js2php example.js > example.php
    php example.php

### How it works

We're using the awesome [esprima][8] JavaScript parser with [rocambole][9] to walk the AST and [escope][10] to figure out variable scope, hoist function declarations and so on. After AST manipulation `tools/codegen.js` generates the PHP code by walking the tree.

Various constructs get wrapped in helper functions, for instance, property access, method calls and `+` operator. The runtime helpers can be found in `php/helpers` and there are a bunch of classes in `php/classes` for Array, RegExp and such. All this PHP gets packaged into your output file, or you can save it to a standalone runtime and reference that from your output file like so:

    js2php --runtime-only > runtime.php
    js2php --runtime runtime.php example.js > example.php

You can also specify the output file using `-o` or `--out` and you can compile multiple input files into one output file like so:

    js2php -o example.php file1.js file2.js

Have a play with the [online demo][2]. The generated code will look something like this:

```php
<?php
$HelloWorld = new Func("HelloWorld", function($greeting = null) {
  $this_ = Func::getContext();
  set($this_, "greeting", $greeting);
});
set(get($HelloWorld, "prototype"), "greet", new Func(function($subject = null) use (&$console) {
  $this_ = Func::getContext();
  call_method($console, "log", get($this_, "greeting"), $subject);
}));
call_method(_new($HelloWorld, "Hi"), "greet", "world");
```

It's not particularly elegant, but it's human-readable and has all the basics we need to implement standards-compliant JS in PHP.

### Alternative "Compile to PHP" languages
There are a handful of other projects worth noting. [Haxe][11] is probably the most popular and is a solid statically-typed language which compiles to PHP (among others). [gutscript][19] and [Mammouth][14] are both syntactically similar to CoffeeScript, [Pharen][13] is a Lisp implementation and [Pratphall][15] uses TypeScript syntax. There's also [another project with the same name as this][18] which is similar at the parsing level, but somewhat different in execution. It accepts JS syntax but otherwise behaves like PHP.

Most of these projects are either incomplete or abandoned which is a shame. I love the idea of writing PHP in a friendlier syntax, especially if the source-transform can iron out some of the core inconsistencies in to PHP. It would be great to see more usable choices in this space!

### Tests
Run `npm test`. Requires PHP 5.3+ or [HHVM][16].

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
[18]: https://github.com/endel/js2php
[19]: https://github.com/c9s/gutscript
