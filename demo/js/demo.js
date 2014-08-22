var HELLO_COMPONENT = "var message = 'Hello World';\n\
console.log(message);\n\
console.log(Math.floor(Math.random() * 100));\n\
console.log(message.charAt(0) + 'ello');\n\
";

React.renderComponent(
  ReactPlayground({
    codeText: HELLO_COMPONENT,
    renderCode: true,
    transformer: function(code) {
      return window.Transformer({
        source: code,
        buildRuntime: false
      });
    }
  }),
  document.getElementById('output-pane')
);
