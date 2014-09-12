(function() {

  Array.prototype.map = function map(fn) {
    var object = toObject(this);
    var self = (this instanceof String) ? this.split('') : object;
    var length = self.length >>> 0;
    var result = Array(length);
    var context = arguments[1];
    if (!(fn instanceof Function)) {
      throw new Error(fn + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self)
        result[i] = fn.call(context, self[i], i, object);
    }
    return result;
  };

  Array.prototype.filter = function filter(fn) {
    var object = toObject(this);
    var self = (this instanceof String) ? this.split('') : object;
    var length = self.length >>> 0;
    var result = [];
    var value;
    var context = arguments[1];
    if (!(fn instanceof Function)) {
      throw new Error(fn + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self) {
        value = self[i];
        if (fn.call(context, value, i, object)) {
          result.push(value);
        }
      }
    }
    return result;
  };

  Array.prototype.every = function every(fn) {
    var object = toObject(this);
    var self = (this instanceof String) ? this.split('') : object;
    var length = self.length >>> 0;
    var context = arguments[1];
    if (!(fn instanceof Function)) {
      throw new Error(fn + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self && !fn.call(context, self[i], i, object)) {
        return false;
      }
    }
    return true;
  };

  Array.prototype.some = function some(fn) {
    var object = toObject(this);
    var self = (this instanceof String) ? this.split('') : object;
    var length = self.length >>> 0;
    var context = arguments[1];
    if (!(fn instanceof Function)) {
      throw new Error(fn + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self && fn.call(context, self[i], i, object)) {
        return true;
      }
    }
    return false;
  };

  Array.prototype.reduce = function reduce(fn) {
    var object = toObject(this);
    var self = (this instanceof String) ? this.split('') : object;
    var length = self.length >>> 0;
    if (!(fn instanceof Function)) {
      throw new Error(fn + ' is not a function');
    }
    if (!length && arguments.length == 1) {
      throw new Error('reduce of empty array with no initial value');
    }
    var i = 0;
    var result;
    if (arguments.length >= 2) {
      result = arguments[1];
    } else {
      do {
        if (i in self) {
          result = self[i++];
          break;
        }
        if (++i >= length) {
          throw new Error('reduce of empty array with no initial value');
        }
      } while (true);
    }
    for (; i < length; i++) {
      if (i in self) {
        result = fn.call(void 0, result, self[i], i, object);
      }
    }
    return result;
  };

  Array.prototype.reduceRight = function reduceRight(fn) {
    var object = toObject(this);
    var self = (this instanceof String) ? this.split('') : object;
    var length = self.length >>> 0;
    if (!(fn instanceof Function)) {
      throw new Error(fn + ' is not a function');
    }
    if (!length && arguments.length == 1) {
      throw new Error('reduceRight of empty array with no initial value');
    }
    var result, i = length - 1;
    if (arguments.length >= 2) {
      result = arguments[1];
    } else {
      do {
        if (i in self) {
          result = self[i--];
          break;
        }
        if (--i < 0) {
          throw new Error('reduceRight of empty array with no initial value');
        }
      } while (true);
    }
    do {
      if (i in this) {
        result = fn.call(void 0, result, self[i], i, object);
      }
    } while (i--);
    return result;
  };

  function toObject(o) {
    if (o == null) {
      throw new Error('can\'t convert ' + o + ' to object');
    }
    return Object(o);
  }

})();