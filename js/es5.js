Array.prototype.forEach = function forEach(fn /*, ctx*/) {
  //var obj = toObject(this);
  var obj = this;
  var ctx = arguments[1];
  //var length = obj.length >>> 0;
  var length = obj.length;

  // If no callback function or if callback is not a callable function
  //if (Object.prototype.toString.call(fn) != "[object Function]") {
  //  throw new Error('forEach called without function');
  //}

  var i = -1;
  while (++i < length) {
    if (i in obj) {
      // Invoke the callback function with call, passing arguments:
      // context, property value, property key, thisArg object
      // context
      fn.call(ctx, obj[i], i, obj);
    }
  }
};
