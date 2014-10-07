(function() {
  var JSONP, createElement, encode, noop, object_to_uri, random, random_string;

  createElement = function(tag) {
    return window.document.createElement(tag);
  };

  encode = window.encodeURIComponent;

  random = Math.random;

  JSONP = function(options) {
    var callback, done, head, params, script;
    options = options ? options : {};
    params = {
      data: options.data || {},
      error: options.error || noop,
      success: options.success || noop,
      url: options.url || ''
    };
    if (params.url.length === 0) {
      throw new Error('MissingUrl');
    }
    done = false;
    callback = params.data[options.callback_name || 'callback'] = 'jsonp_' + random_string(15);
    window[callback] = function(data) {
      params.success(data);
      try {
        return delete window[callback];
      } catch (_error) {
        window[callback] = void 0;
        return void 0;
      }
    };
    script = createElement('script');
    script.src = params.url;
    script.src += params.url.indexOf('?' === -1) ? '?' : '&';
    script.src += object_to_uri(params.data);
    script.async = true;
    script.onerror = function(evt) {
      return params.error({
        url: script.src,
        event: evt
      });
    };
    script.onload = script.onreadystatechange = function() {
      if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
        done = true;
        script.onload = script.onreadystatechange = null;
        if (script && script.parentNode) {
          return script.parentNode.removeChild(script);
        }
      }
    };
    head = head || window.document.getElementsByTagName('head')[0];
    return head.appendChild(script);
  };

  noop = function() {
    return void 0;
  };

  random_string = function(length) {
    var str;
    str = '';
    while (str.length < length) {
      str += random().toString(36)[2];
    }
    return str;
  };

  object_to_uri = function(obj) {
    var data, key, value;
    data = [];
    for (key in obj) {
      value = obj[key];
      data.push(encode(key) + '=' + encode(value));
    }
    return data.join('&');
  };

  if ((typeof define !== "undefined" && define !== null) && define.amd) {
    define(function() {
      return JSONP;
    });
  } else if ((typeof module !== "undefined" && module !== null) && module.exports) {
    module.exports = JSONP;
  } else {
    this.JSONP = JSONP;
  }

}).call(this);
