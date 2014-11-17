##JavaScript to PHP

This tool transforms JavaScript to PHP. Just for fun.

[View Online Demo][2]

[![Example Code](/demo/images/example.png?raw=true)][2]

### Why?

This is a proof-of-concept started at a hackathon recently to see if it could be done. There's some interesting aspects of the two languages that make this a really interesting challenge: lexical scope, prototypal inheritance, duality of `+` operator in JS, PHP's implicit variable declaration, etc. A lot of this had to be implemented in runtime helpers with type checking, but it turns out it's totally doable.

### What could this possibly be used for?

There are dozens of ["compile to JS"][3] languages available (Coffee, TypeScript, Dart), but not many good choices in the PHP world[**](#alternatives). PHP is ubiquitous in bulk hosting, it runs on Google App Engine, AppFog, Rackspace Cloud Sites and virtually every LAMP stack in the world. So if you need to host on PHP but don't like writing PHP, well tough luck. ...unless you could write in JS and deploy to PHP!

### That's madness!

Maybe so. But if you wanted a compile-to-PHP language, JavaScript (or a subset thereof) is a pretty solid choice. There's plenty of tooling, libraries, community, etc. Plus web developers have to know JS anyway because it's in the browser. OK, I'm not suggesting you deploy this generated PHP to production, but if this project matures that might become feasable. I could imagine a JS dev creating a cool thing in JS and then compiling to PHP to put it up on CodeCanyon. The same application might then be run on [Node][4] using [Fibers][7] and the JVM via [Nahsorn][5] or [DynJS][6]. Another interesting use case is this: your web app has a need for some user-generated scripting (think plugins) but you can't just run untrusted PHP on your server. Well, what if you could expose a small API via JS instead. Then compile the user's JS into perfectly safe PHP that has no disk or network access.

### What about performance?

Sure, you pay a performance penalty at runtime, but seriously, have you run mainstream PHP apps before? It's not like the performance bar is too high (I think a default WP install runs 27 SQL queries to render the homepage). Your app is likely not CPU bound anyway (and if it is, then you should be running Node + worker processes or some other awesome solution).

At this point I'm focusing on correctness, not performance, and this is very alpha stuff, but it works.

### Project Status

The core language is mostly implemented and has some tests (Object, Array, Math lib, String methods, etc) but there is no interface to the outside world besides `console.log()` and `process.exit()`. A basic HTTP module is in the works, but there's no file-system or database access and there's no formal way to call into PHP from JS.

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
$HelloWorld = new Func("HelloWorld", function($this_, $arguments, $greeting) {
  set($this_, "greeting", $greeting);
});
set(get($HelloWorld, "prototype"), "go", new Func(function($this_, $arguments, $subject) use (&$console) {
  call_method($console, "log", get($this_, "greeting"), $subject);
}));
call_method(_new($HelloWorld, "Hi"), "go", "world");
```

It's not particularly elegant, but it's human-readable and has all the basics we need to implement standards-compliant JS in PHP.

### Alternatives
There are a handful of other compile-to-PHP languages I want to mention. [Haxe][11] is probably the most popular and is a solid statically-typed language. I also came across [Pharen][13] (a Lisp implementation), [gutscript][19] and [Mammouth][14] (both similar to CoffeeScript) and [Pratphall][15] (TypeScript syntax). There's also another [JS to PHP project][17] from a few years back which is written in PHP and [a project with the same name as this one][18] which is similar at the parsing level, but somewhat different beyond that (accepts JS syntax but otherwise behaves like PHP). Most of these projects are either incomplete or abandoned which is a shame. I love the idea of writing PHP but in a friendlier language or syntax, and it would be great to see more usable choices in this space!

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
