/*global Transformer, CodeMirror */
window.addEventListener('DOMContentLoaded', function() {
  var SAMPLE_CONTENT = "var message = 'Hello World';\nconsole.log(message, Math.floor(Math.random() * 100));\nconsole.log(message.charAt(0) + 'ello');\nf();\nfunction f() {\n  console.log('hi from `f`');\n}\nfunction Thing(name) {\n  this.name = name;\n}\nThing.prototype.sayHello = function() {\n  console.log('hi from', this.name);\n};\nvar thing = new Thing('Bob');\nthing.sayHello();";

  var inputEditor = CodeMirror(document.querySelector('#code-in'), {
    value: SAMPLE_CONTENT,
    mode: 'javascript',
    tabSize: 2,
    indentWithTabs: false,
    theme: 'solarized light',
    lineNumbers: true,
    readOnly: false
  });
  var outputEditor = CodeMirror(document.querySelector('#code-out'), {
    value: '',
    mode: 'php',
    tabSize: 2,
    indentWithTabs: false,
    theme: 'solarized light',
    lineNumbers: false,
    readOnly: false
  });
  inputEditor.on('change', onChange);
  onChange();


  function onChange(instance, changeObj) {
    var source = inputEditor.getValue();
    var result = tranformCode(source);
    if (result instanceof Error) {
      result = '<php\n/* ERROR TRANSFORMING SOURCE:\n' + result.message + ' */';
    }
    outputEditor.setValue(result);
  }

  function tranformCode(sourceCode) {
    if (!sourceCode.trim()) {
      return '';
    }
    if (window.noCatch) {
      //allow error to be thrown for debugging
      var transformedCode = Transformer({source: sourceCode});
    } else {
      try {
        transformedCode = Transformer({source: sourceCode});
      } catch (e) {
        return e;
      }
    }
    //for debugging
    window.sourceCode = sourceCode;
    window.outputCode = transformedCode;
    return transformedCode;
  }

}, false);
