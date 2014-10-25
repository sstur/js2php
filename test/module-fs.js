/*global global, process, testSuite*/
testSuite('strings', function(assert) {
  "use strict";

  var fs = process.binding('fs');

  var basePath = './temp/';
  //create a text blob that's > 1kb to ensure there's multiple chunks
  var textBlob = [];
  var textBlobMax = 30;
  for (var i = 0; i <= textBlobMax; i++) {
    textBlob.push(i);
  }
  textBlob = textBlob.join('|');

  testSuite('createDir', function() {
    fs.removeDirIfExists(basePath + 'test', true);
    assert('should create in existing', function() {
      var path = basePath + 'test';
      fs.createDir(path);
      var info = fs.getInfo(path);
      assert('type is directory', info.type === 'directory');
    });
    fs.removeDirIfExists(basePath + 'test2', true);
    assert('should not have directory after deletion', function() {
      assert.shouldThrow('throw', function() {
        fs.getInfo(basePath + 'test2');
      }, /ENOENT/);
    });
    assert('should throw if parent not exist', function() {
      var path = basePath + 'test2/test3';
      assert.shouldThrow('throw', function() {
        fs.createDir(path);
      }, /ENOENT/);
    });
    assert('should create multi-level', function() {
      var path = basePath + 'test2/test3';
      fs.createDir(path, {deep: true});
      var info = fs.getInfo(path);
      assert('type is directory', info.type === 'directory');
    });
  });
  testSuite('removeDir', function() {
    assert('should remove simple', function() {
      var path = basePath + 'test';
      fs.removeDir(path);
    });
    //todo: should throw on removeDir with contents
    assert('should remove with contents', function() {
      var path = basePath + 'test2/test3';
      fs.writeFile(path + '/file.txt', 'abc');
      fs.removeDir(path, true);
    });
    assert('should be gone', function() {
      var path = basePath + 'test';
      assert.shouldThrow('throw', function() {
        fs.getInfo(path);
      }, /ENOENT/);
    });
    assert('should throw if not exists', function() {
      var path = basePath + 'test';
      assert.shouldThrow('throw', function() {
        fs.removeDir(path);
      }, /ENOENT/);
    });
  });
  testSuite('ReadStream', function() {
    var path = basePath + 'test';
    fs.createDir(path);
    var file = path + '/file.txt';
    fs.writeFile(file, textBlob, {overwrite: true});
    assert('should read file in chunks (text)', function() {
      var readStream = fs.createReadStream(file, {encoding: 'utf8'});
      var chunks = [];
      readStream.on('data', function(data) {
        assert('type', typeof data === 'string');
        chunks.push(data);
      });
      readStream.on('end', function() {
        chunks = chunks.join('');
      });
      readStream.read();
      assert('type', typeof chunks === 'string');
      assert('value', chunks === textBlob);
    });
    assert('should readAll (text)', function() {
      var readStream = fs.createReadStream(file, {encoding: 'utf8'});
      var text = readStream.readAll();
      assert('type', typeof text === 'string');
      assert('value', text === textBlob);
    });
    assert('should read file in chunks', function() {
      var readStream = fs.createReadStream(file);
      var chunks = [];
      readStream.on('data', function(data) {
        assert('is Buffer', data instanceof Buffer);
        chunks.push(data.toString());
      });
      readStream.on('end', function() {
        chunks = chunks.join('');
      });
      var result = readStream.read();
      assert('type', typeof chunks === 'string');
      assert('value', chunks === textBlob);
    });
    assert('should readAll', function() {
      var readStream = fs.createReadStream(file);
      var data = readStream.readAll();
      assert('is Buffer', data instanceof Buffer);
      assert('value', data.toString() === textBlob);
    });
    fs.deleteFile(file);
    assert('should throw if file not exists', function() {
      assert.shouldThrow('throw', function() {
        fs.createReadStream(file);
      }, /ENOENT/);
    });
    fs.removeDir(path, true);
    assert('should throw if folder not exists', function() {
      assert.shouldThrow('throw', function() {
        fs.createReadStream(file);
      }, /ENOENT/);
    });
  });
  testSuite('WriteStream', function() {
    var path = basePath + 'test';
    fs.createDir(path);
    var file = path + '/file.txt';
    assert('should write utf8 by default', function() {
      var writeStream = fs.createWriteStream(file);
      writeStream.write('Ω');
      writeStream.write(new Buffer('Ω'));
      writeStream.end();
      var data = fs.readFile(file);
      assert('type', typeof data === 'string');
      assert('value', data === 'ΩΩ');
    });
    assert('should append chunks', function() {
      var writeStream = fs.createWriteStream(file);
      for (var i = 0; i < textBlobMax; i++) {
        writeStream.write(i + '|');
      }
      writeStream.write(new Buffer(textBlobMax.toString()));
      writeStream.end();
      var data = fs.readFile(file);
      assert('value', data === 'ΩΩ' + textBlob);
    });
    assert('should overwrite when specified', function() {
      var writeStream = fs.createWriteStream(file, {overwrite: true});
      writeStream.write('abc');
      writeStream.end();
      var data = fs.readFile(file);
      assert('value', data === 'abc');
    });
    assert('should overwrite when append is false', function() {
      var writeStream = fs.createWriteStream(file, {append: false});
      writeStream.write('ü');
      writeStream.end();
      var data = fs.readFile(file);
      assert('value', data === 'ü');
    });
  });
  testSuite('moveFile', function() {
    assert('should rename file', function() {
      fs.moveFile(basePath + 'test/file.txt', basePath + 'test/file2.txt');
    });
    fs.removeDir(basePath + 'test2', true);
    fs.createDir(basePath + 'test2');
    assert('should move file if destination is directory', function() {
      fs.moveFile(basePath + 'test/file2.txt', basePath + 'test2');
    });
    assert('should move and rename', function() {
      fs.moveFile(basePath + 'test2/file2.txt', basePath + 'test/file.txt');
    });
    assert('should throw when source file not exist', function() {
      assert.shouldThrow('throw', function() {
        fs.moveFile(basePath + 'test2/file2.txt', basePath + 'test');
      }, /ENOENT/);
    });
    assert('should throw when source path not exist', function() {
      assert.shouldThrow('throw', function() {
        fs.moveFile(basePath + 'test3/file.txt', basePath + 'test');
      }, /ENOENT/);
    });
    assert('should throw when destination path not exist', function() {
      assert.shouldThrow('throw', function() {
        fs.moveFile(basePath + 'test/file.txt', basePath + 'test3/file');
      }, /ENOENT/);
    });
    fs.removeDir(basePath + 'test', true);
    fs.removeDir(basePath + 'test2', true);
  });
  testSuite('copyFile', function() {
  });
  testSuite('deleteFile', function() {
  });
  testSuite('deleteFileIfExists', function() {
  });
  testSuite('getDirContents', function() {
  });
  testSuite('walk', function() {
  });
  testSuite('getInfo', function() {
  });
  testSuite('readFile', function() {
  });
  testSuite('writeFile', function() {
  });

});
