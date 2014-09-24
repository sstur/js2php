/*global CodeMirror */
(function() {

  var debug = location.search.match(/debug/) ? true : false;
  var useWebWorker = !debug;
  if (!useWebWorker) {
    document.write('<script src="js/transformer.js"></script>')
    document.write('<script src="js/web-worker.js"></script>')
  }

  var worker, isWorking, enqueueWork;

  function postMessage(data) {
    return (useWebWorker) ? worker.postMessage(data) : window.postMessage(data, '*');
  }

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

    inputEditor.on('change', processSource);
    processSource();


    function processSource() {
      var sourceCode = inputEditor.getValue();
      if (!sourceCode.trim()) {
        return outputEditor.setValue('');
      }
      if (isWorking) {
        enqueueWork = {sourceCode: sourceCode};
        return;
      }
      if (!worker) {
        worker = useWebWorker ? new Worker('js/web-worker.js') : window;
        worker.addEventListener('message', onWorkerMessage, false);
      }
      sendToWorker(sourceCode);
    }

    function sendToWorker(sourceCode) {
      postMessage({
        command: 'transform',
        noCatch: window.noCatch,
        params: {
          source: sourceCode,
          initVars: debug
        }
      });
      //todo: use setTimeout to add loading class to output pane
      isWorking = true;
    }

    function onWorkerMessage(e) {
      var data = e.data || {};
      if (data.command === 'transform-complete') {
        outputEditor.setValue(data.result || '');
        if (enqueueWork) {
          sendToWorker(enqueueWork.sourceCode);
          enqueueWork = null;
        } else {
          isWorking = false;
        }
      }
    }

  }, false);
})();