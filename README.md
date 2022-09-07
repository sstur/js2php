## JavaScript to PHP

This tool transforms JavaScript to PHP.

[View Online Demo][2]

[![Example Code](https://raw.githubusercontent.com/sstur/js2php/master/demo/images/example.png)][2]

Note: This was a hobby project from a number of years ago and is _not actively maintained_, however PRs are welcome.

Also Note: This does not work with ES6+ JavaScript features (which were not widely available at the time this project was written). If you want to use next-generation JS features you should first pre-process your code using [babel][20]. PR to support ES6+ would be welcome.

### Why?

This is a proof-of-concept and a hobby project, mostly just for fun. There are various aspects of the two languages that make this a really interesting challenge: lexical scope, lambdas, prototypal inheritance, PHP's implicit variable declaration, etc. Some amount of code is implemented as runtime helpers, including operations which require type checking and "standard library" features such as Date functions. But it turns out JavaScript and PHP are similar enough to do most everything as a source transformation, and the PHP code produced is still readable.

### What could this possibly be used for?

There are plenty of ["compile to JS"][3] languages available (ReasonML, TypeScript, CoffeeScript, Dart), but not many choices in the PHP space[\*\*](#alternatives). PHP is ubiquitous in bulk hosting, it runs on millions of servers around the web and PHP applications are generally easy to host and maintain. So if you need to host on PHP but don't like writing PHP, well in theory you could write in JS and deploy to PHP!

### That's madness!

Maybe so. But if you wanted a compile-to-PHP language, that's widely familiar to devs, with plenty of existing tooling, libraries and community, then maybe JS is such a language. Plus, I think there's an unwritten rule that JS must be able to run on every surface in existence.

We're not at a place where you can use this stuff in production, but in theory there's nothing preventing JS compiled to PHP from being viable.

One interesting use case might be allowing some user-generated scripting (think plugins) to run in a sandboxed environment on your PHP platform. User-generated JS can be safely compiled to PHP because none of the usual [dangerous] PHP features are exposed to JS land (such as disk/network access). Actually, you can choose a carefully defined set of functions to expose to JS.

### What about performance?

Sure, you'll take a performance hit at runtime, but let's face it, PHP apps haven't exactly set the performance bar too high (at the time of writing a default WP install runs 27 SQL queries to render a single page). Your code is likely not CPU bound anyway.

That being said, performance has not been a core goal of this library, the focus has been on correctnes. I'm sure there's an abundence of opportunity to perf-optimize this project.

### Project Status

The core language constructs, classes and methods are mostly implemented and we have decent test coverage. I'm working on an opt-in module system to interface with request/response and file-system. Database access, HTTP client, crypto and other modules to follow. Specific modules can be specified at compile time; by default js2php will only allow access to the outside world via `console.log()` and `process.exit()` so the generated PHP is completely safe.

Feel free to contribute if this interests you.

### How to Use

Install from GitHub:

    git clone git@github.com:sstur/js2php.git
    cd js2php
    npm install

Install from npm:

    npm install -g @sstur/js2php

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

There are a handful of other projects worth noting. [Haxe][11] is probably the most popular and is a solid statically-typed language which compiles to PHP (among others).

Note: The Following is probably a very outdated list.

[gutscript][19] and [Mammouth][14] are both syntactically similar to CoffeeScript, [Pharen][13] is a Lisp implementation and [Pratphall][15] uses TypeScript syntax. There's also [another project with the same name as this][18] which is similar at the parsing level, but significantly different in execution. It accepts JS syntax but otherwise behaves like PHP.

### Tests

Run `npm test`. Requires PHP 5.3+ or [HHVM][16].

### Performance Comparison

You need a PHP version of js2php first: `npm build-php-version`

Afterwards you can run the comparison: `npm run performance-comparison`

A comparison result show up like that:

| Test     |        JS |       PHP |   Slowdown |
|----------|-----------|-----------|------------|
| boolean  |     24 ms |     31 ms |       29 % |
| date     |     44 ms |     97 ms |      120 % |
| regex    |     45 ms |    114 ms |      153 % |
| number   |     84 ms |    300 ms |      257 % |
| buffer   |    109 ms |    407 ms |      273 % |
| core     |    125 ms |    436 ms |      248 % |
| array    |    174 ms |    476 ms |      173 % |
| string   |    102 ms |    726 ms |      611 % |
| json     |    772 ms |   3389 ms |      338 % |
| process  |   1486 ms |   5976 ms |      302 % | 

### BSD License

Copyright (c) 2014, sstur@me.com. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.

- Neither the name of the author nor the names of its contributors may be used
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

[2]: https://sstur.github.io/js2php/demo/
[3]: https://github.com/jashkenas/coffeescript/wiki/List-of-languages-that-compile-to-JS
[8]: https://esprima.org/
[9]: https://github.com/millermedeiros/rocambole
[10]: https://github.com/Constellation/escope
[11]: https://haxe.org/
[13]: https://github.com/scriptor/pharen
[14]: https://mammouth.boutglay.com/
[15]: https://github.com/scriptor/pharen
[16]: https://hhvm.com/
[18]: https://github.com/endel/js2php
[19]: https://github.com/c9s/gutscript
[20]: https://babeljs.io/
