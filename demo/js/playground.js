/*global React, CodeMirror */
var ReactPlayground;
(function() {
  var IS_MOBILE = (
    navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
    );

  var CodeMirrorEditor = React.createClass({displayName: 'CodeMirrorEditor',
    componentDidMount: function() {
      if (IS_MOBILE) return;

      this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
        mode: this.props.mode || 'javascript',
        lineNumbers: false,
        lineWrapping: true,
        smartIndent: false,
        matchBrackets: true,
        theme: 'solarized-light',
        readOnly: this.props.readOnly
      });
      this.editor.on('change', this.handleChange);
    },

    componentDidUpdate: function() {
      if (this.props.readOnly) {
        this.editor.setValue(this.props.codeText);
      }
    },

    handleChange: function() {
      var source = this.editor.getValue();
      this.props.onChange && this.props.onChange(source);
    },

    render: function() {
      // wrap in a div to fully contain CodeMirror
      var editor;
      if (IS_MOBILE) {
        editor = React.DOM.pre( {style:{overflow: 'scroll'}}, this.props.codeText);
      } else {
        editor = React.DOM.textarea( {ref:"editor", defaultValue:this.props.codeText} );
      }
      return (
        React.DOM.div( {style:this.props.style, className:this.props.className},
          editor
        )
        );
    }
  });

  var selfCleaningTimeout = {
    componentDidUpdate: function() {
      clearTimeout(this.timeoutID);
    },

    setTimeout: function() {
      clearTimeout(this.timeoutID);
      this.timeoutID = setTimeout.apply(null, arguments);
    }
  };

  ReactPlayground = React.createClass({displayName: 'ReactPlayground',
    mixins: [selfCleaningTimeout],
    propTypes: {
      codeText: React.PropTypes.string.isRequired,
      transformer: React.PropTypes.func.isRequired,
      renderCode: React.PropTypes.bool
    },

    getInitialState: function() {
      return {
        code: this.props.codeText
      };
    },

    handleInputCodeChange: function(value) {
      this.setState({code: value});
      this.updateCode();
    },

    handleOutputCodeChange: function(value) {
      //for debugging
      window.outputCode = value;
    },

    transformCode: function() {
      var sourceCode = this.state.code;
      var transformedCode = '';
      if (window.noCatch) {
        //allow error to be thrown for debugging
        transformedCode = this.props.transformer(sourceCode);
      } else {
        try {
          transformedCode = this.props.transformer(sourceCode);
        } catch (e) {}
      }
      //for debugging
      window.sourceCode = sourceCode;
      window.outputCode = transformedCode;
      return transformedCode;
    },

    render: function() {
      var transformedCode = this.transformCode();

      var JSContent =
        CodeMirrorEditor({
          key: "js",
          onChange: this.handleInputCodeChange,
          className: "playgroundStage",
          codeText: this.state.code,
          mode: 'javascript'
        });

      return (
        React.DOM.div( {className:"playground"},
          React.DOM.div( {className:"playgroundCode"},
            JSContent
          ),
          React.DOM.div( {className:"playgroundPreview"},
            React.DOM.div( {ref:"mount"} )
          )
        )
        );
    },

    componentDidMount: function() {
      this.updateCode();
    },

    componentWillUpdate: function(nextProps, nextState) {
      // execute code only when the state's not being updated by switching tab
      // this avoids re-displaying the error, which comes after a certain delay
      if (this.state.code !== nextState.code) {
        this.updateCode();
      }
    },

    updateCode: function() {
      var mountNode = this.refs.mount.getDOMNode();
      try {
        React.unmountComponentAtNode(mountNode);
      } catch (e) { }
      var transformedCode = this.transformCode();
      if (this.props.renderCode) {
        React.renderComponent(
          CodeMirrorEditor({
            codeText: transformedCode,
            onChange: this.handleOutputCodeChange,
            readOnly: false,
            mode: 'php'
          }),
          mountNode
        );
      }
    }
  });

})();