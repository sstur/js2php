(function() {
  var fs = require('fs');
  var esformatter = require('esformatter');

  // for a list of available options check "lib/preset/default.json"
  var options = {
    preset: 'default',
    indent: {
      value: '  '
    },
    lineBreak: {
      before: {
        ElseIfStatement: 1,
        VariableName: 0
      }
    },
    whiteSpace: {
      after: {
        PropertyName: 0
      }
    }
  };

  var source = fs.readFileSync('./sample.js', 'utf8');
  source = esformatter.format(source, options);
  fs.writeFileSync('./output.js', source, 'utf8');

})();