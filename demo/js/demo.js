var HELLO_COMPONENT = "var message = 'Hello World';\nconsole.log(message, Math.floor(Math.random() * 100));\nconsole.log(message.charAt(0) + 'ello');\nfunction f() {\n  console.log('hi from `f`');\n}\nf();\nfunction Thing(name) {\n  this.name = name;\n}\nThing.prototype.sayHello = function() {\n  console.log('hi from', this.name);\n};\nvar thing = new Thing('Bob');\nthing.sayHello();";

React.renderComponent(
  ReactPlayground({
    codeText: HELLO_COMPONENT,
    renderCode: true,
    transformer: function(code) {
      return window.Transformer({
        source: code
      });
    }
  }),
  document.getElementById('output-pane')
);
