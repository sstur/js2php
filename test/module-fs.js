/*global global, process, Buffer, testSuite*/
testSuite('strings', function(assert) {
  "use strict";

  var fs = process.binding('fs');

  var basePath = './test/temp/';
  //create a text blob that's > 1kb to ensure there's multiple chunks
  var textBlob = [];
  var textBlobMax = 30;
  for (var i = 0; i <= textBlobMax; i++) {
    textBlob.push(i);
  }
  textBlob = textBlob.join('|');

  testSuite('createDir', function() {
    fs.removeDirIfExists(basePath + 'test', true);
    testSuite('should create in existing', function() {
      var path = basePath + 'test';
      fs.createDir(path);
      var info = fs.getInfo(path);
      assert('type is directory', info.type === 'directory');
    });
    fs.removeDirIfExists(basePath + 'test2', true);
    testSuite('should not have directory after deletion', function() {
      assert.shouldThrow('throw', function() {
        fs.getInfo(basePath + 'test2');
      }, /ENOENT/);
    });
    testSuite('should throw if parent not exist', function() {
      var path = basePath + 'test2/test3';
      assert.shouldThrow('throw', function() {
        fs.createDir(path);
      }, /ENOENT/);
    });
    testSuite('should create multi-level', function() {
      var path = basePath + 'test2/test3';
      fs.createDir(path, {deep: true});
      var info = fs.getInfo(path);
      assert('type is directory', info.type === 'directory');
    });
  });
  testSuite('removeDir', function() {
    testSuite('should remove simple', function() {
      var path = basePath + 'test';
      fs.removeDir(path);
    });
    testSuite('should throw on removeDir with contents', function() {
      var path = basePath + 'test2';
      assert.shouldThrow('throw', function() {
        fs.removeDir(path);
      }, /ENOENT/);
    });
    testSuite('should remove with contents', function() {
      var path = basePath + 'test2/test3';
      fs.writeFile(path + '/file.txt', 'abc');
      fs.removeDir(path, true);
    });
    testSuite('should be gone', function() {
      var path = basePath + 'test';
      assert.shouldThrow('throw', function() {
        fs.getInfo(path);
      }, /ENOENT/);
    });
    testSuite('should throw if not exists', function() {
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
    testSuite('should read file in chunks (utf8)', function() {
      var readStream = fs.createReadStream(file, {encoding: 'utf8'});
      var chunks = [];
      readStream.on('data', function(data) {
        //todo: remove this
        data = Buffer.isBuffer(data) ? data.toString() : data;
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
    testSuite('should readAll (utf8)', function() {
      var readStream = fs.createReadStream(file, {encoding: 'utf8'});
      var text = readStream.readAll();
      //todo: remove this
      text = Buffer.isBuffer(text) ? text.toString() : text;
      assert('type', typeof text === 'string');
      assert('value', text === textBlob);
    });
    testSuite('should read file in chunks', function() {
      var readStream = fs.createReadStream(file);
      var chunks = [];
      readStream.on('data', function(data) {
        assert('is Buffer', data instanceof Buffer);
        chunks.push(data.toString());
      });
      readStream.on('end', function() {
        chunks = chunks.join('');
      });
      readStream.read();
      assert('type', typeof chunks === 'string');
      assert('value', chunks === textBlob);
    });
    testSuite('should readAll', function() {
      var readStream = fs.createReadStream(file);
      var data = readStream.readAll();
      assert('is Buffer', data instanceof Buffer);
      assert('value', data.toString() === textBlob);
    });
    fs.deleteFile(file);
    testSuite('should throw if file not exists', function() {
      assert.shouldThrow('throw', function() {
        fs.createReadStream(file);
      }, /ENOENT/);
    });
    fs.removeDir(path, true);
    testSuite('should throw if folder not exists', function() {
      assert.shouldThrow('throw', function() {
        fs.createReadStream(file);
      }, /ENOENT/);
    });
  });
  testSuite('WriteStream', function() {
    var path = basePath + 'test';
    fs.createDir(path);
    var file = path + '/file.txt';
    testSuite('should write utf8 by default', function() {
      var writeStream = fs.createWriteStream(file);
      writeStream.write('Ω');
      writeStream.write(new Buffer('Ω'));
      writeStream.end();
      var data = fs.readFile(file);
      //todo: remove this (specify utf8 in readFile)
      data = data.toString();
      assert('type', typeof data === 'string');
      assert('value', data === 'ΩΩ');
    });
    testSuite('should append chunks', function() {
      var writeStream = fs.createWriteStream(file);
      for (var i = 0; i < textBlobMax; i++) {
        writeStream.write(i + '|');
      }
      writeStream.write(new Buffer(textBlobMax.toString()));
      writeStream.end();
      var data = fs.readFile(file);
      //todo: remove this (specify utf8 in readFile)
      data = data.toString();
      assert('value', data === 'ΩΩ' + textBlob);
    });
    testSuite('should overwrite when specified', function() {
      var writeStream = fs.createWriteStream(file, {overwrite: true});
      writeStream.write('abc');
      writeStream.end();
      var data = fs.readFile(file);
      //todo: remove this (specify utf8 in readFile)
      data = data.toString();
      assert('value', data === 'abc');
    });
    testSuite('should overwrite when append is false', function() {
      var writeStream = fs.createWriteStream(file, {append: false});
      writeStream.write('ü');
      writeStream.end();
      var data = fs.readFile(file);
      //todo: remove this (specify utf8 in readFile)
      data = data.toString();
      assert('value', data === 'ü');
    });
  });
  testSuite('moveFile', function() {
    testSuite('should rename file', function() {
      fs.moveFile(basePath + 'test/file.txt', basePath + 'test/file2.txt');
    });
    fs.removeDir(basePath + 'test2', true);
    fs.createDir(basePath + 'test2');
    testSuite('should move file if destination is directory', function() {
      fs.moveFile(basePath + 'test/file2.txt', basePath + 'test2');
    });
    testSuite('should move and rename', function() {
      fs.moveFile(basePath + 'test2/file2.txt', basePath + 'test/file.txt');
    });
    testSuite('should throw when source file not exist', function() {
      assert.shouldThrow('throw', function() {
        fs.moveFile(basePath + 'test2/file2.txt', basePath + 'test');
      }, /ENOENT/);
    });
    testSuite('should throw when source path not exist', function() {
      assert.shouldThrow('throw', function() {
        fs.moveFile(basePath + 'test3/file.txt', basePath + 'test');
      }, /ENOENT/);
    });
    testSuite('should throw when destination path not exist', function() {
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
  testSuite('getInfo', function() {
  });
  testSuite('readFile', function() {
  });
  testSuite('writeFile', function() {
  });

});
