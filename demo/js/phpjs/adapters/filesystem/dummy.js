(function() {
  var localStorage = {};

  function DummyFileSystem() {}

  DummyFileSystem.localStorage = localStorage;

  DummyFileSystem.prototype.lstatSync = function(filename) {
    if (localStorage[filename] == null) {
      throw Error();
    } else {
      return true;
    }
  };

  DummyFileSystem.prototype.error = function(e) {
    this.db = false;
    console.log(e);
    throw e;
  };

  DummyFileSystem.prototype.writeFileSync = function(filename, data) {
    localStorage[filename] = data;
  };

  DummyFileSystem.prototype.readFileSync = function(filename) {
    console.log('readFileSync', filename);
    return localStorage[filename] || '';
  };

  DummyFileSystem.prototype.version = '1.0';

  DummyFileSystem.prototype.FILES = 'files';

  PHP.Adapters.DummyFileSystem = DummyFileSystem;
})();