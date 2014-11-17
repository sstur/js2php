/*global CodeMirror */
(function() {

  var debug = location.search.match(/debug/) ? true : false;
  var example = location.search.match(/example/) ? true : false;
  if (example) {
    document.documentElement.classList.add('example');
  }
  var useWebWorker = !debug;
  if (!useWebWorker) {
    document.write('<script src="js/transformer.js"></script>');
    document.write('<script src="js/web-worker.js"></script>');
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
      lineNumbers: !example,
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

    var btn = document.querySelector('.console button');
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (btn.classList.contains('loading')) {
        return;
      }
      btn.classList.add('loading');
      execSource(function(output) {
        document.querySelector('.console').classList.remove('empty');
        var el = document.querySelector('.console code');
        el.innerHTML = '';
        el.appendChild(document.createTextNode(output));
        btn.classList.remove('loading');
      });
    }, false);


    function execSource(callback) {
      JSONP({
        url: 'http://js2php-sstur.rhcloud.com/api/exec',
        data: {
          source: inputEditor.getValue()
        },
        success: function(data) {
          if (data.status !== 200) {
            console.log('HTTP Error:', data.status);
            return;
          }
          data = data.payload;
          var output = [];
          if (data.code !== 0) {
            output.push('Process exited with code: ' + data.code);
            if (data.stderr) {
              output.push(data.stderr);
            }
          }
          output.push(data.stdout);
          if (callback) {
            callback(output.join('\n'));
          } else {
            console.log(output.join('\n'));
          }
        }
      });
    }

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

    window.execSource = execSource;

  }, false);

})();