(function () {
  Function.prototype.bind = function bind(that) {
    var target = this;
    if (typeof target != 'function') {
      throw new Error('Function.prototype.bind called on incompatible ' + target);
    }
    var args = slice.call(arguments, 1);
    var bound = function () {
      if (this instanceof bound) {
        var result = target.apply(this, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
          return result;
        }
        return this;
      } else {
        return target.apply(that, args.concat(slice.call(arguments)));
      }
    };
    if (target.prototype) {
      bound.prototype = Object.create(target.prototype);
    }
    return bound;
  };
  var call = Function.prototype.call;
  var prototypeOfArray = Array.prototype;
  var prototypeOfObject = Object.prototype;
  var slice = prototypeOfArray.slice;
  var _toString = call.bind(prototypeOfObject.toString);
  var boxedString = Object('a');
  var splitString = boxedString[0] != 'a' || !(0 in boxedString);
  Array.prototype.forEach = function forEach(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var thisp = arguments[1];
    var i = -1;
    var length = self.length >>> 0;
    if (_toString(fun) != '[object Function]') {
      throw new Error();
    }
    while (++i < length) {
      if (i in self) {
        fun.call(thisp, self[i], i, object);
      }
    }
  };
  Array.prototype.map = function map(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var length = self.length >>> 0;
    var result = Array(length);
    var thisp = arguments[1];
    if (_toString(fun) != '[object Function]') {
      throw new Error(fun + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self)
        result[i] = fun.call(thisp, self[i], i, object);
    }
    return result;
  };
  Array.prototype.filter = function filter(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var length = self.length >>> 0;
    var result = [];
    var value;
    var thisp = arguments[1];
    if (_toString(fun) != '[object Function]') {
      throw new Error(fun + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self) {
        value = self[i];
        if (fun.call(thisp, value, i, object)) {
          result.push(value);
        }
      }
    }
    return result;
  };
  Array.prototype.every = function every(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var length = self.length >>> 0;
    var thisp = arguments[1];
    if (_toString(fun) != '[object Function]') {
      throw new Error(fun + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self && !fun.call(thisp, self[i], i, object)) {
        return false;
      }
    }
    return true;
  };
  Array.prototype.some = function some(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var length = self.length >>> 0;
    var thisp = arguments[1];
    if (_toString(fun) != '[object Function]') {
      throw new Error(fun + ' is not a function');
    }
    for (var i = 0; i < length; i++) {
      if (i in self && fun.call(thisp, self[i], i, object)) {
        return true;
      }
    }
    return false;
  };
  Array.prototype.reduce = function reduce(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var length = self.length >>> 0;
    if (_toString(fun) != '[object Function]') {
      throw new Error(fun + ' is not a function');
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
        result = fun.call(void 0, result, self[i], i, object);
      }
    }
    return result;
  };
  Array.prototype.reduceRight = function reduceRight(fun) {
    var object = toObject(this);
    var self = splitString && _toString(this) == '[object String]' ? this.split('') : object;
    var length = self.length >>> 0;
    if (_toString(fun) != '[object Function]') {
      throw new Error(fun + ' is not a function');
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
        result = fun.call(void 0, result, self[i], i, object);
      }
    } while (i--);
    return result;
  };
  var toObject = function (o) {
    if (o == null) {
      throw new Error('can\'t convert ' + o + ' to object');
    }
    return Object(o);
  };
}());