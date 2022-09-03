/*global global, testSuite, Buffer*/
testSuite('json', function (assert) {
  testSuite('basic stringify', function () {
    assert('string primitive', JSON.stringify('s') === '"s"');
    var a = [true, false, 1, null, undefined, NaN, Infinity, -Infinity, 's'];
    assert(
      'primitives',
      JSON.stringify(a) === '[true,false,1,null,null,null,null,null,"s"]'
    );
    a = new Array(3);
    assert('empty array', JSON.stringify(a) === '[null,null,null]');
    a = [new String('s'), new Boolean(false), new Number(3)];
    assert('boxed primitives', JSON.stringify(a) === '["s",false,3]');
    var s = '\\"How\bquickly\tdaft\njumping\fzebras\rvex"';
    assert(
      'control characters',
      JSON.stringify(s) ===
        '"\\\\\\"How\\bquickly\\tdaft\\njumping\\fzebras\\rvex\\""'
    );
    var o = { foo: { b: { foo: { c: { foo: null } } } } };
    assert(
      'nested objects containing identically-named properties should serialize correctly',
      JSON.stringify(o) === '{"foo":{"b":{"foo":{"c":{"foo":null}}}}}'
    );
    o = {};
    a = [o, o];
    assert(
      'objects containing duplicate references should not throw',
      JSON.stringify(a) === '[{},{}]'
    );
    o = { a: undefined, b: 1 };
    assert(
      'object properties with value undefined are skipped',
      JSON.stringify(o) === '{"b":1}'
    );
    o = { b: new Buffer('abc') };
    /*assert(
      'should serialize buffer to string',
      JSON.stringify(o) === '{"b":"<Buffer 616263>"}'
    );*/
    a = [];
    a[5] = 1;
    assert(
      'sparse arrays should serialize correctly',
      JSON.stringify(a) === '[null,null,null,null,null,1]'
    );
    var d = new Date(Date.UTC(1994, 6, 3));
    assert(
      'dates should serialze correctly',
      JSON.stringify(d) === '"1994-07-03T00:00:00.000Z"'
    );
    d = new Date(Date.UTC(1993, 5, 2, 2, 10, 28, 224));
    assert(
      'dates with milliseconds',
      JSON.stringify(d) === '"1993-06-02T02:10:28.224Z"'
    );
    d = new Date(-1);
    assert(
      'date initialized with negative epoch ms',
      JSON.stringify(d) === '"1969-12-31T23:59:59.999Z"'
    );
  });

  function equals(value1, value2) {
    assert('equals', value1 === value2);
  }

  function parseError(source, message, callback) {
    message = message || 'should throw';
    assert.shouldThrow(message, function () {
      JSON.parse(source, callback);
    });
  }

  // Ensures that `JSON.parse` parses the given source string correctly.
  function parses(expected, source, message, callback) {
    message = message || 'parses';
    assert.deepEqual(message, JSON.parse(source, callback), expected);
  }

  // Ensures that `JSON.stringify` serializes the given object correctly.
  function serializes(expected, value, message, filter, width) {
    message = message || 'serializes';
    assert(message, JSON.stringify(value, filter, width) === expected);
  }

  testSuite('`parse`: Empty Source Strings', function () {
    testSuite('Empty JSON source string', function () {
      parseError('');
    });
    testSuite('Source string containing only line terminators', function () {
      parseError('\n\n\r\n', '');
    });
    testSuite('Source string containing a single space character', function () {
      parseError(' ', '');
    });
    testSuite(
      'Source string containing multiple space characters',
      function () {
        parseError(' ', '');
      }
    );
  });

  testSuite('`parse`: Whitespace', function () {
    // The only valid JSON whitespace characters are tabs, spaces, and line
    // terminators. All other Unicode category `Z` (`Zs`, `Zl`, and `Zp`)
    // characters are invalid (note that the `Zs` category includes the
    // space character).
    var characters = [
      '{\u00a0}',
      '{\u1680}',
      '{\u180e}',
      '{\u2000}',
      '{\u2001}',
      '{\u2002}',
      '{\u2003}',
      '{\u2004}',
      '{\u2005}',
      '{\u2006}',
      '{\u2007}',
      '{\u2008}',
      '{\u2009}',
      '{\u200a}',
      '{\u202f}',
      '{\u205f}',
      '{\u3000}',
      '{\u2028}',
      '{\u2029}',
    ];

    //todo: fix whitespace throwing?
    testSuite(
      'Source string containing an invalid Unicode whitespace character',
      function () {
        characters.forEach(function (value) {
          parseError(value);
        });
      }
    );

    parseError('{\u000B}', 'Source string containing a vertical tab');
    parseError('{\u000C}', 'Source string containing a form feed');

    testSuite('Source string containing a byte-order mark', function () {
      parseError('{\uFEFF}', '');
    });

    testSuite('Source string containing a CRLF line ending', function () {
      parses({}, '{\r\n}');
    });
    testSuite(
      'Source string containing multiple line terminators',
      function () {
        parses({}, '{\n\n\r\n}');
      }
    );
    testSuite('Source string containing a tab character', function () {
      parses({}, '{\t}');
    });
    testSuite('Source string containing a space character', function () {
      parses({}, '{ }');
    });
  });

  testSuite('`parse`: Octal Values', function () {
    var values = ['00', '01', '02', '03', '04', '05', '06', '07', '010'];
    values.forEach(function (value) {
      //Octal literal
      parseError(value, '');
      //Negative octal literal
      parseError('-' + value, '');
    });
    // `08` and `018` are invalid octal values.
    values = [
      '00',
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '011',
      '08',
      '018',
    ];
    values.forEach(function (value) {
      //Octal escape sequence in a string
      parseError('"\\' + value + '"', '');
      //Hex escape sequence in a string
      parseError('"\\x' + value + '"', '');
    });
  });

  testSuite('`parse`: Numeric Literals', function () {
    testSuite('Integer', function () {
      parses(100, '100');
    });
    testSuite('Negative integer', function () {
      parses(-100, '-100');
    });
    testSuite('Float', function () {
      parses(10.5, '10.5');
    });
    testSuite('Negative float', function () {
      parses(-3.141, '-3.141');
    });
    testSuite('Decimal', function () {
      parses(0.625, '0.625');
    });
    testSuite('Negative decimal', function () {
      parses(-0.03125, '-0.03125');
    });
    testSuite('Exponential', function () {
      parses(1000, '1e3');
    });
    testSuite('Positive exponential', function () {
      parses(100, '1e+2');
    });
    testSuite('Negative exponential', function () {
      parses(-0.01, '-1e-2');
    });
    testSuite('Decimalized exponential', function () {
      parses(3125, '0.03125e+5');
    });
    testSuite('Case-insensitive exponential delimiter', function () {
      parses(100, '1E2');
    });

    testSuite('Leading `+`', function () {
      parseError('+1');
    });
    //testSuite("Trailing decimal point", function() {
    //  parseError("1.");
    //});
    testSuite('Leading decimal point', function () {
      parseError('.1');
    });
    testSuite('Missing exponent', function () {
      parseError('1e');
    });
    testSuite('Missing signed exponent', function () {
      parseError('1e-');
    });
    testSuite('Leading `--`', function () {
      parseError('--1');
    });
    testSuite('Trailing `-+`', function () {
      parseError('1-+');
    });
    testSuite('Hex literal', function () {
      parseError('d');
    });

    // The native `JSON.parse` implementation in IE 9 allows this syntax
    testSuite('Invalid negative sign', function () {
      parseError('- 5');
    });
  });

  testSuite('`parse`: String Literals', function () {
    testSuite('Double-quoted string literal', function () {
      parses('value', '"value"');
    });
    testSuite('Empty string literal', function () {
      parses('', '""');
    });

    testSuite(
      'String containing an escaped Unicode line separator',
      function () {
        parses('\u2028', '"\\u2028"');
      }
    );
    testSuite(
      'String containing an escaped Unicode paragraph separator',
      function () {
        parses('\u2029', '"\\u2029"');
      }
    );
    // ExtendScript doesn't handle surrogate pairs correctly; attempting to
    // parse `"\ud834\udf06"` will throw an uncatchable error (issue #29).
    //testSuite("String containing an unescaped Unicode surrogate pair", function() {
    //  parses("\ud834\udf06", '"\ud834\udf06"');
    //});
    testSuite(
      'String containing an escaped ASCII control character',
      function () {
        parses('\u0001', '"\\u0001"');
      }
    );
    testSuite('String containing an escaped backspace', function () {
      parses('\b', '"\\b"');
    });
    testSuite('String containing an escaped form feed', function () {
      parses('\f', '"\\f"');
    });
    testSuite('String containing an escaped line feed', function () {
      parses('\n', '"\\n"');
    });
    testSuite('String containing an escaped carriage return', function () {
      parses('\r', '"\\r"');
    });
    testSuite('String containing an escaped tab', function () {
      parses('\t', '"\\t"');
    });

    testSuite('String containing an escaped solidus', function () {
      parses('hello/world', '"hello\\/world"');
    });
    testSuite('String containing an escaped reverse solidus', function () {
      parses('hello\\world', '"hello\\\\world"');
    });
    testSuite(
      'String containing an escaped double-quote character',
      function () {
        parses('hello"world', '"hello\\"world"');
      }
    );

    testSuite('Single-quoted string literal', function () {
      parseError("'hello'");
    });
    testSuite('String containing a hex escape sequence', function () {
      parseError('"\\x61"');
    });
    testSuite('String containing an unescaped CRLF line ending', function () {
      parseError('"hello \r\n world"');
    });

    var controlCharacters = [
      '\u0001',
      '\u0002',
      '\u0003',
      '\u0004',
      '\u0005',
      '\u0006',
      '\u0007',
      '\b',
      '\t',
      '\n',
      '\u000b',
      '\f',
      '\r',
      '\u000e',
      '\u000f',
      '\u0010',
      '\u0011',
      '\u0012',
      '\u0013',
      '\u0014',
      '\u0015',
      '\u0016',
      '\u0017',
      '\u0018',
      '\u0019',
      '\u001a',
      '\u001b',
      '\u001c',
      '\u001d',
      '\u001e',
      '\u001f',
    ];

    // Opera 7 discards null characters in strings.
    if ('\0'.length) {
      controlCharacters.push('\u0000');
    }

    testSuite(
      'throw if containing an unescaped ASCII control character',
      function () {
        controlCharacters.forEach(function (value) {
          parseError('"' + value + '"', '');
        });
      }
    );
  });

  testSuite('`parse`: Array Literals', function () {
    testSuite('Trailing comma in array literal', function () {
      parseError('[1, 2, 3,]');
    });
    testSuite('Nested arrays', function () {
      parses(
        [1, 2, [3, [4, 5]], 6, [true, false], [null], [[]]],
        '[1, 2, [3, [4, 5]], 6, [true, false], [null], [[]]]'
      );
    });
    testSuite('Array containing empty object literal', function () {
      parses([{}], '[{}]');
    });
    testSuite('Mixed array', function () {
      parses(
        [100, true, false, null, { a: ['hello'], b: ['world'] }, [0.01]],
        '[1e2, true, false, null, {"a": ["hello"], "b": ["world"]}, [1e-2]]'
      );
    });
  });

  testSuite('`parse`: Object Literals', function () {
    testSuite('Object literal containing one member', function () {
      parses({ hello: 'world' }, '{"hello": "world"}');
    });
    testSuite('Object literal containing empty key', function () {
      parses({ '': 1 }, '{"": 1}');
    });
    testSuite('Object literal containing multiple members', function () {
      parses(
        {
          hello: 'world',
          foo: ['bar', true],
          fox: { quick: true, purple: false },
        },
        '{"hello": "world", "foo": ["bar", true], "fox": {"quick": true, "purple": false}}'
      );
    });

    testSuite('Unquoted identifier used as a property name', function () {
      parseError('{key: 1}');
    });
    testSuite('`false` used as a property name', function () {
      parseError('{false: 1}');
    });
    testSuite('`true` used as a property name', function () {
      parseError('{true: 1}');
    });
    testSuite('`null` used as a property name', function () {
      parseError('{null: 1}');
    });
    testSuite('Single-quoted string used as a property name', function () {
      parseError("{'key': 1}");
    });
    testSuite('Number used as a property name', function () {
      parseError('{1: 2, 3: 4}');
    });

    testSuite('Trailing comma in object literal', function () {
      parseError('{"hello": "world", "foo": "bar",}');
    });
  });

  // JavaScript expressions should never be evaluated, as we don't use `eval`.
  testSuite('`parse`: Invalid Expressions', function () {
    var expressions = [
      '1 + 1',
      '1 * 2',
      'var value = 123;',
      '{});value = 123;({}',
      'call()',
      '1, 2, 3, "value"',
    ];
    testSuite('Source string containing a JavaScript expression', function () {
      expressions.forEach(function (expression) {
        parseError(expression, '');
      });
    });
  });

  testSuite('`stringify` and `parse`: Optional Arguments', function () {
    //testSuite("Callback function provided", function() {
    //  parses({"a": 1, "b": 16}, '{"a": 1, "b": "10000"}', "", function(key, value) {
    //    return (typeof value === "string") ? parseInt(value, 2) : value;
    //  });
    //});
    //serializes("{\n  \"bar\": 456\n}", {"foo": 123, "bar": 456}, "Object; optional `filter` and `whitespace` arguments", ["bar"], 2);
    serializes(
      '{\n  "bar": 456\n}',
      { bar: 456 },
      'Object; optional `whitespace` arguments',
      null,
      2
    );

    // Test adapted from the Opera JSON test suite via Ken Snyder.
    // See http://testsuites.opera.com/JSON/correctness/scripts/045.js
    // The regular expression is necessary because the ExtendScript engine
    // only approximates pi to 14 decimal places (ES 3 and ES 5 approximate
    // pi to 15 places).
    //testSuite("allow list of non-enumerable property names specified as the `filter` argument", function() {
    //  var reg = /^\{"PI":3\.\d{14,15}\}$/;
    //  assert('non-enumerable prop', reg.test(JSON.stringify(Math, ["PI"])));
    //});
    //testSuite("not use `splice` when removing an array element", function() {
    //  var parsed = JSON.parse("[1, 2, 3]", function(key, value) {
    //    if (typeof value === "object" && value) {
    //      return value;
    //    }
    //  });
    //  assert('length', parsed.length === 3);
    //});
  });

  testSuite('`stringify`', function () {
    // Special values.
    testSuite('`null` is represented literally', function () {
      serializes('null', null);
    });
    testSuite('`Infinity` is serialized as `null`', function () {
      serializes('null', Infinity);
    });
    testSuite('`NaN` is serialized as `null`', function () {
      serializes('null', NaN);
    });
    testSuite('`-Infinity` is serialized as `null`', function () {
      serializes('null', -Infinity);
    });
    testSuite('Boolean primitives are represented literally', function () {
      serializes('true', true);
    });
    testSuite('Boolean objects are represented literally', function () {
      serializes('false', new Boolean(false));
    });
    testSuite('All control characters in strings are escaped', function () {
      serializes(
        '"\\\\\\"How\\bquickly\\tdaft\\njumping\\fzebras\\rvex\\""',
        new String('\\"How\bquickly\tdaft\njumping\fzebras\rvex"')
      );
    });

    testSuite('Arrays are serialized recursively', function () {
      serializes('[false,1,"Kit"]', [
        new Boolean(),
        new Number(1),
        new String('Kit'),
      ]);
    });
    testSuite('`[undefined]` is serialized as `[null]`', function () {
      serializes('[null]', [void 0]);
    });

    // Property enumeration is implementation-dependent.
    var value = {
      jdalton: ['John-David', 29],
      kitcambridge: ['Kit', 18],
      mathias: ['Mathias', 23],
    };
    testSuite('Objects are serialized recursively', function () {
      parses(value, JSON.stringify(value));
    });

    // Complex cyclic structures.
    value = { foo: { b: { foo: { c: { foo: null } } } } };
    testSuite(
      'Nested objects containing identically-named properties should serialize correctly',
      function () {
        serializes('{"foo":{"b":{"foo":{"c":{"foo":null}}}}}', value);
      }
    );

    var S = [],
      N = {};
    S.push(N, N);
    testSuite(
      'Objects containing duplicate references should not throw a `TypeError`',
      function () {
        serializes('[{},{}]', S);
      }
    );

    // Sparse arrays.
    value = [];
    value[5] = 1;
    testSuite('Sparse arrays should serialize correctly', function () {
      serializes('[null,null,null,null,null,1]', value);
    });

    // Dates.
    testSuite(
      'Dates should be serialized according to the simplified date time string format',
      function () {
        serializes(
          '"1994-07-03T00:00:00.000Z"',
          new Date(Date.UTC(1994, 6, 3))
        );
      }
    );
    testSuite(
      'The date time string should conform to the format outlined in the spec',
      function () {
        serializes(
          '"1993-06-02T02:10:28.224Z"',
          new Date(Date.UTC(1993, 5, 2, 2, 10, 28, 224))
        );
      }
    );
    testSuite(
      'The minimum valid date value should serialize correctly',
      function () {
        serializes('"-271821-04-20T00:00:00.000Z"', new Date(-8.64e15));
      }
    );
    /*testSuite(
      'The maximum valid date value should serialize correctly',
      function () {
        serializes('"275760-09-13T00:00:00.000Z"', new Date(8.64e15));
      }
    );*/
    /*testSuite('https://bugs.ecmascript.org/show_bug.cgi?id=119', function () {
      serializes(
        '"10000-01-01T00:00:00.000Z"',
        new Date(Date.UTC(10000, 0, 1))
      );
    });*/

    // Tests based on research by @Yaffle. See kriskowal/es5-shim#111.
    testSuite(
      'Millisecond values < 1000 should be serialized correctly',
      function () {
        serializes('"1969-12-31T23:59:59.999Z"', new Date(-1));
      }
    );
    /*testSuite(
      'Years prior to 0 should be serialized as extended years',
      function () {
        serializes('"-0001-01-01T00:00:00.000Z"', new Date(-621987552e5));
      }
    );*/
    /*testSuite(
      'Years after 9999 should be serialized as extended years',
      function () {
        serializes('"10000-01-01T00:00:00.000Z"', new Date(2534023008e5));
      }
    );*/
    testSuite(
      'Issue #4: Opera > 9.64 should correctly serialize a date with a year of `-109252`',
      function () {
        serializes(
          '"-109252-01-01T10:37:06.708Z"',
          new Date(-3509827334573292)
        );
      }
    );

    // Opera 7 normalizes dates with invalid time values to represent the
    // current date.
    value = new Date('Kit');
    if (!isFinite(value)) {
      testSuite('Invalid dates should serialize as `null`', function () {
        serializes('null', value);
      });
    }

    // Additional arguments.
    serializes(
      '[\n  1,\n  2,\n  3,\n  [\n    4,\n    5\n  ]\n]',
      [1, 2, 3, [4, 5]],
      'Nested arrays; optional `whitespace` argument',
      null,
      '  '
    );
    serializes(
      '[]',
      [],
      'Empty array; optional string `whitespace` argument',
      null,
      '  '
    );
    serializes(
      '{}',
      {},
      'Empty object; optional numeric `whitespace` argument',
      null,
      2
    );
    serializes(
      '[\n  1\n]',
      [1],
      'Single-element array; optional numeric `whitespace` argument',
      null,
      2
    );
    serializes(
      '{\n  "foo": 123\n}',
      { foo: 123 },
      'Single-member object; optional string `whitespace` argument',
      null,
      '  '
    );
    serializes(
      '{\n  "foo": {\n    "bar": [\n      123\n    ]\n  }\n}',
      { foo: { bar: [123] } },
      'Nested objects; optional numeric `whitespace` argument',
      null,
      2
    );
  });

  testSuite('ECMAScript 5 Conformance', function () {
    var value = { a1: { b1: [1, 2, 3, 4], b2: { c1: 1, c2: 2 } }, a2: 'a2' };

    // Section 15.12.1.1: The JSON Grammar.
    // ------------------------------------

    // Tests 15.12.1.1-0-1 thru 15.12.1.1-0-8.
    testSuite(
      'Valid whitespace characters may not separate two discrete tokens',
      function () {
        parseError('12\t\r\n 34');
      }
    );
    testSuite(
      'The vertical tab is not a valid whitespace character',
      function () {
        parseError('\u000b1234');
      }
    );
    testSuite('The form feed is not a valid whitespace character', function () {
      parseError('\u000c1234');
    });
    testSuite(
      'The non-breaking space is not a valid whitespace character',
      function () {
        parseError('\u00a01234');
      }
    );
    testSuite(
      'The zero-width space is not a valid whitespace character',
      function () {
        parseError('\u200b1234');
      }
    );
    testSuite(
      'The byte order mark (zero-width non-breaking space) is not a valid whitespace character',
      function () {
        parseError('\ufeff1234');
      }
    );
    testSuite(
      'Other Unicode category `Z` characters are not valid whitespace characters',
      function () {
        parseError(
          '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u30001234'
        );
      }
    );
    testSuite(
      'The line (U+2028) and paragraph (U+2029) separators are not valid whitespace characters',
      function () {
        parseError('\u2028\u20291234');
      }
    );

    // Test 15.12.1.1-0-9.
    testSuite(
      'Valid whitespace characters may precede and follow all tokens',
      function () {
        parses(
          { property: {}, prop2: [true, null, 123.456] },
          '\t\r \n{\t\r \n' +
            '"property"\t\r \n:\t\r \n{\t\r \n}\t\r \n,\t\r \n' +
            '"prop2"\t\r \n:\t\r \n' +
            '[\t\r \ntrue\t\r \n,\t\r \nnull\t\r \n,123.456\t\r \n]' +
            '\t\r \n}\t\r \n',
          ''
        );
      }
    );

    // Tests 15.12.1.1-g1-1 thru 15.12.1.1-g1-4.
    testSuite('Leading tab characters should be ignored', function () {
      parses(1234, '\t1234');
    });
    testSuite(
      'A tab character may not separate two disparate tokens',
      function () {
        parseError('12\t34');
      }
    );
    testSuite('Leading carriage returns should be ignored', function () {
      parses(1234, '\r1234');
    });
    testSuite(
      'A carriage return may not separate two disparate tokens',
      function () {
        parseError('12\r34');
      }
    );
    testSuite('Leading line feeds should be ignored', function () {
      parses(1234, '\n1234');
    });
    testSuite('A line feed may not separate two disparate tokens', function () {
      parseError('12\n34');
    });
    testSuite('Leading space characters should be ignored', function () {
      parses(1234, ' 1234');
    });
    testSuite(
      'A space character may not separate two disparate tokens',
      function () {
        parseError('12 34');
      }
    );

    // Tests 15.12.1.1-g2-1 thru 15.12.1.1-g2-5.
    testSuite('Strings must be enclosed in double quotes', function () {
      parses('abc', '"abc"');
    });
    testSuite('Single-quoted strings are not permitted', function () {
      parseError("'abc'");
    });
    // Note: the original test 15.12.1.1-g2-3 (`"\u0022abc\u0022"`) is incorrect,
    // as the JavaScript interpreter will always convert `\u0022` to `"`.
    testSuite(
      'Unicode-escaped double quote delimiters are not permitted',
      function () {
        parseError('\\u0022abc\\u0022');
      }
    );
    testSuite(
      'Strings must terminate with a double quote character',
      function () {
        parseError('"ab' + "c'");
      }
    );
    testSuite('Strings may be empty', function () {
      parses('', '""');
    });

    // Tests 15.12.1.1-g4-1 thru 15.12.1.1-g4-4.
    testSuite(
      'Unescaped control characters in the range [U+0000, U+0007] are not permitted within strings',
      function () {
        parseError('"\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007"');
      }
    );
    testSuite(
      'Unescaped control characters in the range [U+0008, U+000F] are not permitted within strings',
      function () {
        parseError('"\u0008\u0009\u000a\u000b\u000c\u000d\u000e\u000f"');
      }
    );
    testSuite(
      'Unescaped control characters in the range [U+0010, U+0017] are not permitted within strings',
      function () {
        parseError('"\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017"');
      }
    );
    testSuite(
      'Unescaped control characters in the range [U+0018, U+001F] are not permitted within strings',
      function () {
        parseError('"\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f"');
      }
    );

    // Tests 15.12.1.1-g5-1 thru 15.12.1.1-g5-3.
    testSuite(
      'Unicode escape sequences are permitted within strings',
      function () {
        parses('X', '"\\u0058"');
      }
    );
    testSuite(
      'Unicode escape sequences may not comprise fewer than four hexdigits',
      function () {
        parseError('"\\u005"');
      }
    );
    testSuite(
      'Unicode escape sequences may not contain non-hex characters',
      function () {
        parseError('"\\u0X50"');
      }
    );

    // Tests 15.12.1.1-g6-1 thru 15.12.1.1-g6-7.
    testSuite('Escaped solidus', function () {
      parses('/', '"\\/"');
    });
    testSuite('Escaped reverse solidus', function () {
      parses('\\', '"\\\\"');
    });
    testSuite('Escaped backspace', function () {
      parses('\b', '"\\b"');
    });
    testSuite('Escaped form feed', function () {
      parses('\f', '"\\f"');
    });
    testSuite('Escaped line feed', function () {
      parses('\n', '"\\n"');
    });
    testSuite('Escaped carriage return', function () {
      parses('\r', '"\\r"');
    });
    testSuite('Escaped tab', function () {
      parses('\t', '"\\t"');
    });

    // Section 15.12.3: `JSON.stringify()`.
    // ------------------------------------

    // Test 15.12.3-11-1 thru 5.12.3-11-15.
    testSuite(
      '`JSON.stringify(undefined)` should return `undefined`',
      function () {
        serializes(void 0, void 0);
      }
    );

    testSuite(
      'The `JSON.stringify` callback function can be called on a top-level `undefined` value',
      function () {
        serializes('"replacement"', void 0, '', function () {
          return 'replacement';
        });
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level string primitives',
      function () {
        serializes('"a string"', 'a string');
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level number primitives',
      function () {
        serializes('123', 123);
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level Boolean primitives',
      function () {
        serializes('true', true);
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level `null` values',
      function () {
        serializes('null', null);
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level number objects',
      function () {
        serializes('42', new Number(42));
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level string objects',
      function () {
        serializes('"wrapped"', new String('wrapped'));
      }
    );
    testSuite(
      '`JSON.stringify` should serialize top-level Boolean objects',
      function () {
        serializes('false', new Boolean(false));
      }
    );
    testSuite(
      'The `JSON.stringify` callback function may return `undefined` when called on a top-level number primitive',
      function () {
        serializes(void 0, 42, '', function () {
          return void 0;
        });
      }
    );
    testSuite(
      'The `JSON.stringify` callback function may return `undefined` when called on a top-level object',
      function () {
        serializes(void 0, { prop: 1 }, '', function () {
          return void 0;
        });
      }
    );
    testSuite(
      'The `JSON.stringify` callback function may return an array when called on a top-level number primitive',
      function () {
        serializes('[4,2]', 42, '', function (key, value) {
          return value == 42 ? [4, 2] : value;
        });
      }
    );
    testSuite(
      'The `JSON.stringify` callback function may return an object literal when called on a top-level number primitive',
      function () {
        serializes('{"forty":2}', 42, '', function (key, value) {
          return value == 42 ? { forty: 2 } : value;
        });
      }
    );
    testSuite(
      '`JSON.stringify` should return `undefined` when called on a top-level function',
      function () {
        serializes(void 0, function () {});
      }
    );
    testSuite(
      'The `JSON.stringify` callback function may return a number primitive when called on a top-level function',
      function () {
        serializes(
          '99',
          function () {},
          '',
          function () {
            return 99;
          }
        );
      }
    );

    //// Test 15.12.3-4-1.
    serializes(
      '[42]',
      [42],
      '`JSON.stringify` should ignore `filter` arguments that are not functions or arrays',
      {}
    );

    // Test 15.12.3-5-a-i-1 and 15.12.3-5-b-i-1.
    //testSuite("Optional `width` argument: Number object and primitive width values should produce identical results", function() {
    //  equals(JSON.stringify(value, null, new Number(5)), JSON.stringify(value, null, 5));
    //});
    //testSuite("Optional `width` argument: String object and primitive width values should produce identical results", function() {
    //  equals(JSON.stringify(value, null, new String("xxx")), JSON.stringify(value, null, "xxx"));
    //});

    // Test 15.12.3-6-a-1 and 15.12.3-6-a-2.
    testSuite(
      'Optional `width` argument: The maximum numeric width value should be 10',
      function () {
        equals(
          JSON.stringify(value, null, 10),
          JSON.stringify(value, null, 100)
        );
      }
    );
    testSuite(
      'Optional `width` argument: Numeric values should be converted to integers',
      function () {
        equals(
          JSON.stringify(value, null, 5.99999),
          JSON.stringify(value, null, 5)
        );
      }
    );

    // Test 15.12.3-6-b-1 and 15.12.3-6-b-4.
    testSuite(
      'Optional `width` argument: Numeric width values between 0 and 1 should be ignored',
      function () {
        equals(JSON.stringify(value, null, 0.999999), JSON.stringify(value));
      }
    );
    testSuite('Optional `width` argument: Zero should be ignored', function () {
      equals(JSON.stringify(value, null, 0), JSON.stringify(value));
    });
    testSuite(
      'Optional `width` argument: Negative numeric values should be ignored',
      function () {
        equals(JSON.stringify(value, null, -5), JSON.stringify(value));
      }
    );
    testSuite(
      'Optional `width` argument: Numeric width values in the range [1, 10] should produce identical results to that of string values containing `width` spaces',
      function () {
        equals(
          JSON.stringify(value, null, 5),
          JSON.stringify(value, null, '     ')
        );
      }
    );

    // Test 15.12.3-7-a-1.
    testSuite(
      'Optional `width` argument: String width values longer than 10 characters should be truncated',
      function () {
        equals(
          JSON.stringify(value, null, '0123456789xxxxxxxxx'),
          JSON.stringify(value, null, '0123456789')
        );
      }
    );

    // Test 15.12.3-8-a-1 thru 15.12.3-8-a-5.
    testSuite('Empty string `width` arguments should be ignored', function () {
      equals(JSON.stringify(value, null, ''), JSON.stringify(value));
    });
    testSuite(
      'Boolean primitive `width` arguments should be ignored',
      function () {
        equals(JSON.stringify(value, null, true), JSON.stringify(value));
      }
    );
    testSuite('`null` `width` arguments should be ignored', function () {
      equals(JSON.stringify(value, null, null), JSON.stringify(value));
    });
    testSuite(
      'Boolean object `width` arguments should be ignored',
      function () {
        equals(
          JSON.stringify(value, null, new Boolean(false)),
          JSON.stringify(value)
        );
      }
    );
    testSuite(
      'Object literal `width` arguments should be ignored',
      function () {
        equals(JSON.stringify(value, null, value), JSON.stringify(value));
      }
    );

    // Test 15.12.3@2-2-b-i-1.
    testSuite(
      'An object literal with a custom `toJSON` method nested within an array may return a string primitive for serialization',
      function () {
        serializes(
          '["fortytwo objects"]',
          [
            {
              prop: 42,
              toJSON: function () {
                return 'fortytwo objects';
              },
            },
          ],
          ''
        );
      }
    );

    // Test 15.12.3@2-2-b-i-2.
    //testSuite("An object literal with a custom `toJSON` method nested within an array may return a number object for serialization", function() {
    //  serializes('[42]', [{
    //    "prop": 42,
    //    "toJSON": function() {
    //      return new Number(42);
    //    }
    //  }], "");
    //});

    // Test 15.12.3@2-2-b-i-3.
    //testSuite("An object literal with a custom `toJSON` method nested within an array may return a Boolean object for serialization", function() {
    //  serializes('[true]', [{
    //    "prop": 42,
    //    "toJSON": function() {
    //      return new Boolean(true);
    //    }
    //  }], "");
    //});

    // Test 15.12.3@2-3-a-1.
    //testSuite("The `JSON.stringify` callback function may return a string object when called on an array", function() {
    //  serializes('["fortytwo"]', [42], "", function(key, value) {
    //    return value === 42 ? new String("fortytwo") : value;
    //  });
    //});

    // Test 15.12.3@2-3-a-2.
    //testSuite("The `JSON.stringify` callback function may return a number object when called on an array", function() {
    //  serializes('[84]', [42], "", function(key, value) {
    //    return value === 42 ? new Number(84) : value;
    //  });
    //});

    // Test 15.12.3@2-3-a-3.
    //testSuite("The `JSON.stringify` callback function may return a Boolean object when called on an array", function() {
    //  serializes('[false]', [42], "", function(key, value) {
    //    return value === 42 ? new Boolean(false) : value;
    //  });
    //});
  });
});
