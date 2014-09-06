(function () {
  if (!Function.prototype.bind) {
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
  }
  var call = Function.prototype.call;
  var prototypeOfArray = Array.prototype;
  var prototypeOfObject = Object.prototype;
  var slice = prototypeOfArray.slice;
  var _toString = call.bind(prototypeOfObject.toString);
  var owns = call.bind(prototypeOfObject.hasOwnProperty);
  var defineGetter;
  var defineSetter;
  var lookupGetter;
  var lookupSetter;
  var supportsAccessors;
  if (supportsAccessors = owns(prototypeOfObject, '__defineGetter__')) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
  }
  if ([
    1,
    2
  ].splice(0).length != 2) {
    var array_splice = Array.prototype.splice;
    Array.prototype.splice = function (start, deleteCount) {
      if (!arguments.length) {
        return [];
      } else {
        return array_splice.apply(this, [
            start === void 0 ? 0 : start,
            deleteCount === void 0 ? this.length - start : deleteCount
        ].concat(slice.call(arguments, 2)));
      }
    };
  }
  if ([].unshift(0) != 1) {
    var array_unshift = Array.prototype.unshift;
    Array.prototype.unshift = function () {
      array_unshift.apply(this, arguments);
      return this.length;
    };
  }
  if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
      return _toString(obj) == '[object Array]';
    };
  }
  var boxedString = Object('a');
  var splitString = boxedString[0] != 'a' || !(0 in boxedString);
  if (!Array.prototype.forEach) {
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
  }
  if (!Array.prototype.map) {
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
  }
  if (!Array.prototype.filter) {
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
  }
  if (!Array.prototype.every) {
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
  }
  if (!Array.prototype.some) {
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
  }
  if (!Array.prototype.reduce) {
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
  }
  if (!Array.prototype.reduceRight) {
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
  }
  if (!Array.prototype.indexOf || [
    0,
    1
  ].indexOf(1, 2) != -1) {
    Array.prototype.indexOf = function indexOf(sought) {
      var self = splitString && _toString(this) == '[object String]' ? this.split('') : toObject(this);
      var length = self.length >>> 0;
      if (!length) {
        return -1;
      }
      var i = 0;
      if (arguments.length > 1) {
        i = toInteger(arguments[1]);
      }
      i = i >= 0 ? i : Math.max(0, length + i);
      for (; i < length; i++) {
        if (i in self && self[i] === sought) {
          return i;
        }
      }
      return -1;
    };
  }
  if (!Array.prototype.lastIndexOf || [
    0,
    1
  ].lastIndexOf(0, -3) != -1) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought) {
      var self = splitString && _toString(this) == '[object String]' ? this.split('') : toObject(this);
      var length = self.length >>> 0;
      if (!length) {
        return -1;
      }
      var i = length - 1;
      if (arguments.length > 1) {
        i = Math.min(i, toInteger(arguments[1]));
      }
      i = i >= 0 ? i : length - Math.abs(i);
      for (; i >= 0; i--) {
        if (i in self && sought === self[i]) {
          return i;
        }
      }
      return -1;
    };
  }
  if (!Object.keys) {
    var hasDontEnumBug = true;
    var dontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ];
    var dontEnumsLength = dontEnums.length;
    for (var key in { 'toString': null }) {
      hasDontEnumBug = false;
    }
    Object.keys = function keys(object) {
      if (typeof object != 'object' && typeof object != 'function' || object === null) {
        throw new Error('Object.keys called on a non-object');
      }
      var keysArray = [];
      for (var name in object) {
        if (owns(object, name)) {
          keysArray.push(name);
        }
      }
      if (hasDontEnumBug) {
        for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
          var dontEnum = dontEnums[i];
          if (dontEnum == 'constructor' && object.constructor && object.constructor.prototype === object) {
            continue;
          }
          if (owns(object, dontEnum)) {
            keysArray.push(dontEnum);
          }
        }
      }
      return keysArray;
    };
  }
  var negativeDate = -62198755200000;
  var negativeYearString = '-000001';
  if (!Date.prototype.toISOString || new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1) {
    Date.prototype.toISOString = function toISOString() {
      var result, length, value, year, month;
      if (!isFinite(this)) {
        throw new Error('Date.prototype.toISOString called on non-finite value.');
      }
      year = this.getUTCFullYear();
      month = this.getUTCMonth();
      year += Math.floor(month / 12);
      month = (month % 12 + 12) % 12;
      result = [
          month + 1,
        this.getUTCDate(),
        this.getUTCHours(),
        this.getUTCMinutes(),
        this.getUTCSeconds()
      ];
      year = (year < 0 ? '-' : year > 9999 ? '+' : '') + ('00000' + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6);
      length = result.length;
      while (length--) {
        value = result[length];
        if (value < 10) {
          result[length] = '0' + value;
        }
      }
      return year + '-' + result.slice(0, 2).join('-') + 'T' + result.slice(2).join(':') + '.' + ('000' + this.getUTCMilliseconds()).slice(-3) + 'Z';
    };
  }
  var dateToJSONIsSupported = false;
  try {
    dateToJSONIsSupported = Date.prototype.toJSON && new Date(NaN).toJSON() === null && new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 && Date.prototype.toJSON.call({
      toISOString: function () {
        return true;
      }
    });
  } catch (e) {
  }
  if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
      var o = Object(this);
      var tv = toPrimitive(o);
      var toISO;
      if (typeof tv === 'number' && !isFinite(tv)) {
        return null;
      }
      toISO = o.toISOString;
      if (typeof toISO != 'function') {
        throw new Error('toISOString property is not callable');
      }
      return toISO.call(o);
    };
  }
  if (!Date.parse || 'Date.parse is buggy') {
    Date = function (NativeDate) {
      function Date(Y, M, D, h, m, s, ms) {
        var length = arguments.length;
        if (this instanceof NativeDate) {
          var date = length == 1 && String(Y) === Y ? new NativeDate(Date.parse(Y)) : length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) : length >= 6 ? new NativeDate(Y, M, D, h, m, s) : length >= 5 ? new NativeDate(Y, M, D, h, m) : length >= 4 ? new NativeDate(Y, M, D, h) : length >= 3 ? new NativeDate(Y, M, D) : length >= 2 ? new NativeDate(Y, M) : length >= 1 ? new NativeDate(Y) : new NativeDate();
          date.constructor = Date;
          return date;
        }
        return NativeDate.apply(this, arguments);
      }
      var isoDateExpression = new RegExp('^' + '(\\d{4}|[+-]\\d{6})' + '(?:-(\\d{2})' + '(?:-(\\d{2})' + '(?:' + 'T(\\d{2})' + ':(\\d{2})' + '(?:' + ':(\\d{2})' + '(?:\\.(\\d{3}))?' + ')?' + '(' + 'Z|' + '(?:' + '([-+])' + '(\\d{2})' + ':(\\d{2})' + ')' + ')?)?)?)?' + '$');
      var months = [
        0,
        31,
        59,
        90,
        120,
        151,
        181,
        212,
        243,
        273,
        304,
        334,
        365
      ];
      function dayFromMonth(year, month) {
        var t = month > 1 ? 1 : 0;
        return months[month] + Math.floor((year - 1969 + t) / 4) - Math.floor((year - 1901 + t) / 100) + Math.floor((year - 1601 + t) / 400) + 365 * (year - 1970);
      }
      for (var key in NativeDate) {
        Date[key] = NativeDate[key];
      }
      Date.now = NativeDate.now;
      Date.UTC = NativeDate.UTC;
      Date.prototype = NativeDate.prototype;
      Date.prototype.constructor = Date;
      Date.parse = function parse(string) {
        var match = isoDateExpression.exec(string);
        if (match) {
          var year = Number(match[1]);
          var month = Number(match[2] || 1) - 1;
          var day = Number(match[3] || 1) - 1;
          var hour = Number(match[4] || 0);
          var minute = Number(match[5] || 0);
          var second = Number(match[6] || 0);
          var millisecond = Number(match[7] || 0);
          var offset = !match[4] || match[8] ? 0 : Number(new NativeDate(1970, 0));
          var signOffset = match[9] === '-' ? 1 : -1;
          var hourOffset = Number(match[10] || 0);
          var minuteOffset = Number(match[11] || 0);
          var result;
          if (hour < (minute > 0 || second > 0 || millisecond > 0 ? 24 : 25) && minute < 60 && second < 60 && millisecond < 1000 && month > -1 && month < 12 && hourOffset < 24 && minuteOffset < 60 && day > -1 && day < dayFromMonth(year, month + 1) - dayFromMonth(year, month)) {
            result = ((dayFromMonth(year, month) + day) * 24 + hour + hourOffset * signOffset) * 60;
            result = ((result + minute + minuteOffset * signOffset) * 60 + second) * 1000 + millisecond + offset;
            if (-8640000000000000 <= result && result <= 8640000000000000) {
              return result;
            }
          }
          return NaN;
        }
        return NativeDate.parse.apply(this, arguments);
      };
      return Date;
    }(Date);
  }
  if (!Date.now) {
    Date.now = function now() {
      return new Date().getTime();
    };
  }
  if (''.substr && '0b'.substr(-1) !== 'b') {
    var string_substr = String.prototype.substr;
    String.prototype.substr = function (start, length) {
      return string_substr.call(this, start < 0 ? (start = this.length + start) < 0 ? 0 : start : start, length);
    };
  }
  var ws = '\t\n\v\f\r \xa0\u1680\u180e\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028' + '\u2029\ufeff';
  if (!String.prototype.trim || ws.trim()) {
    ws = '[' + ws + ']';
    var trimBeginRegexp = new RegExp('^' + ws + ws + '*');
    var trimEndRegexp = new RegExp(ws + ws + '*$');
    String.prototype.trim = function trim() {
      if (this === undefined || this === null) {
        throw new Error('can\'t convert ' + this + ' to object');
      }
      return String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    };
  }
  function toInteger(n) {
    n = +n;
    if (n !== n) {
      n = 0;
    } else if (n !== 0 && n !== 1 / 0 && n !== -(1 / 0)) {
      n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
  }
  function isPrimitive(input) {
    var type = typeof input;
    return input === null || type === 'undefined' || type === 'boolean' || type === 'number' || type === 'string';
  }
  function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
      return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === 'function') {
      val = valueOf.call(input);
      if (isPrimitive(val)) {
        return val;
      }
    }
    toString = input.toString;
    if (typeof toString === 'function') {
      val = toString.call(input);
      if (isPrimitive(val)) {
        return val;
      }
    }
    throw new Error();
  }
  var toObject = function (o) {
    if (o == null) {
      throw new Error('can\'t convert ' + o + ' to object');
    }
    return Object(o);
  };
  if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
      return object.__proto__ || (object.constructor ? object.constructor.prototype : prototypeOfObject);
    };
  }
  if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = 'Object.getOwnPropertyDescriptor called on a non-object: ';
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
      if (typeof object != 'object' && typeof object != 'function' || object === null) {
        throw new Error(ERR_NON_OBJECT + object);
      }
      if (!owns(object, property)) {
        return;
      }
      var descriptor = {
        enumerable: true,
        configurable: true
      };
      if (supportsAccessors) {
        var prototype = object.__proto__;
        object.__proto__ = prototypeOfObject;
        var getter = lookupGetter(object, property);
        var setter = lookupSetter(object, property);
        object.__proto__ = prototype;
        if (getter || setter) {
          if (getter) {
            descriptor.get = getter;
          }
          if (setter) {
            descriptor.set = setter;
          }
          return descriptor;
        }
      }
      descriptor.value = object[property];
      descriptor.writable = true;
      return descriptor;
    };
  }
  if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
      return Object.keys(object);
    };
  }
  if (!Object.create) {
    var createEmpty;
    var supportsProto = Object.prototype.__proto__ === null;
    if (supportsProto || typeof document == 'undefined' && typeof ActiveXObject == 'undefined') {
      createEmpty = function () {
        return { '__proto__': null };
      };
    } else {
      createEmpty = function () {
        var empty, Empty;
        return function () {
          if (Empty)
            return new Empty();
          try {
            var doc = new ActiveXObject('htmlfile');
          } catch (e) {
          }
          if (doc) {
            doc.write('<' + 'script>document.win = window</script>');
            doc.close();
            empty = doc.win.Object.prototype;
          } else {
            var iframe = document.createElement('iframe');
            var parent = document.body || document.documentElement;
            iframe.style.display = 'none';
            parent.appendChild(iframe);
            iframe.src = 'javascript:';
            empty = iframe.contentWindow.Object.prototype;
            parent.removeChild(iframe);
            iframe = null;
          }
          delete empty.constructor;
          delete empty.hasOwnProperty;
          delete empty.propertyIsEnumerable;
          delete empty.isProtoypeOf;
          delete empty.toLocaleString;
          delete empty.toString;
          delete empty.valueOf;
          empty.__proto__ = null;
          Empty = function () {
          };
          Empty.prototype = empty;
          return new Empty();
        };
      }();
    }
    Object.create = function create(prototype, properties) {
      var object;
      function Type() {
      }
      if (prototype === null) {
        object = createEmpty();
      } else {
        if (typeof prototype !== 'object' && typeof prototype !== 'function') {
          throw new Error('Object prototype may only be an Object or null');
        }
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
      }
      if (properties !== void 0) {
        Object.defineProperties(object, properties);
      }
      return object;
    };
  }
  function doesDefinePropertyWork(object) {
    try {
      Object.defineProperty(object, 'sentinel', {});
      return 'sentinel' in object;
    } catch (exception) {
    }
  }
  if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == 'undefined' || doesDefinePropertyWork(document.createElement('div'));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
      var definePropertyFallback = Object.defineProperty;
    }
  }
  if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = 'Property description must be an object: ';
    var ERR_NON_OBJECT_TARGET = 'Object.defineProperty called on non-object: ';
    var ERR_ACCESSORS_NOT_SUPPORTED = 'getters & setters can not be defined ' + 'on this javascript engine';
    Object.defineProperty = function defineProperty(object, property, descriptor) {
      if (typeof object != 'object' && typeof object != 'function' || object === null) {
        throw new Error(ERR_NON_OBJECT_TARGET + object);
      }
      if (typeof descriptor != 'object' && typeof descriptor != 'function' || descriptor === null) {
        throw new Error(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
      }
      if (definePropertyFallback) {
        try {
          return definePropertyFallback.call(Object, object, property, descriptor);
        } catch (exception) {
        }
      }
      if (owns(descriptor, 'value')) {
        if (supportsAccessors && (lookupGetter(object, property) || lookupSetter(object, property))) {
          var prototype = object.__proto__;
          object.__proto__ = prototypeOfObject;
          delete object[property];
          object[property] = descriptor.value;
          object.__proto__ = prototype;
        } else {
          object[property] = descriptor.value;
        }
      } else {
        if (!supportsAccessors) {
          throw new Error(ERR_ACCESSORS_NOT_SUPPORTED);
        }
        if (owns(descriptor, 'get')) {
          defineGetter(object, property, descriptor.get);
        }
        if (owns(descriptor, 'set')) {
          defineSetter(object, property, descriptor.set);
        }
      }
      return object;
    };
  }
  if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
      if (owns(properties, 'constructor')) {
        Object.defineProperty(object, 'constructor', properties.constructor);
      }
      for (var property in properties) {
        if (owns(properties, property) && property != '__proto__' && property != 'constructor') {
          Object.defineProperty(object, property, properties[property]);
        }
      }
      return object;
    };
  }
  if (!Object.seal) {
    Object.seal = function seal(object) {
      return object;
    };
  }
  if (!Object.freeze) {
    Object.freeze = function freeze(object) {
      return object;
    };
  }
  try {
    Object.freeze(function () {
    });
  } catch (exception) {
    Object.freeze = function freeze(freezeObject) {
      return function freeze(object) {
        if (typeof object == 'function') {
          return object;
        } else {
          return freezeObject(object);
        }
      };
    }(Object.freeze);
  }
  if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
      return object;
    };
  }
  if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
      return false;
    };
  }
  if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
      return false;
    };
  }
  if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
      if (Object(object) !== object) {
        throw new Error();
      }
      var name = '';
      while (owns(object, name)) {
        name += '?';
      }
      object[name] = true;
      var returnValue = owns(object, name);
      delete object[name];
      return returnValue;
    };
  }
}());