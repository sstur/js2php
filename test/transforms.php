<?php

set(
    $exports,
    'run',
    new Func(function () use (&$require, &$console, &$Error, &$JSON) {
        $fs = null;
        $path = null;
        $transform = null;
        $content = null;
        $fs = call($require, 'fs', __DIR__);
        $path = call($require, 'path', __DIR__);
        $transform = call($require, '../tools/transform.js', __DIR__);
        $content = call_method(
            $fs,
            'readFileSync',
            call_method($path, 'join', __DIR__, 'transforms.txt'),
            'utf8'
        );
        call_method($console, 'log', 'Begin transform tests ...');
        call_method(
            call_method($content, 'split', '----'),
            'forEach',
            new Func(function ($content = null) use (
                &$Error,
                &$JSON,
                &$transform
            ) {
                $pair = null;
                $source = null;
                $opts = null;
                $expected = null;
                $result = null;
                $message = null;
                $content = call_method($content, 'trim');
                $pair = call_method($content, 'split', '====');
                $source = call_method(get($pair, 0.0), 'trim');
                if (is(call_method($source, 'match', new RegExp('^//@', '')))) {
                    throw new Ex(_new($Error, 'debug'));
                    $source = call_method($source, 'split', "\n");
                    $opts = call_method(
                        call_method($source, 'shift'),
                        'slice',
                        3.0
                    );
                    $opts = call_method($JSON, 'parse', $opts);
                    $source = call_method($source, 'join', "\n");
                }
                $expected = call_method(get($pair, 1.0), 'trim');
                $opts = is($or_ = $opts) ? $or_ : new Obj();
                set($opts, 'source', $source);
                set(
                    $opts,
                    'initVars',
                    is($or_ = get($opts, 'initVars')) ? $or_ : false
                );
                $result = call_method(call($transform, $opts), 'trim');
                if ($result !== $expected) {
                    $message =
                        "Error: Transformation yielded unexpected result\n";
                    $message = _plus(
                        $message,
                        _concat(">>>> Expected:\n", $expected, "\n")
                    );
                    $message = _plus(
                        $message,
                        _concat(">>>> Result:\n", $result, "\n")
                    );
                    throw new Ex(_new($Error, $message));
                }
            })
        );
        call_method($console, 'log', 'Transform tests completed successfully.');
    })
);
