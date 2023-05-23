const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function genParamsSign(options) {
  const {userAgent = '', appId, fp} = options;
  const jsContent = fs.readFileSync(path.resolve(__dirname, './js_security_v3_0.1.4.js')).toString();

  const ctx = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    window: {
      addEventListener: _.noop,
      JD: {
        report: {
          umpBiz: _.noop,
        },
      },
      localStorage: {
        setItem(key, value) {
          this[key] = value;
        },
        getItem(key) {
          // TODO 完善该逻辑
          if (key.match(`WQ_vk1_${appId}`) && fp) {
            return {'v': fp, 't': 1684488392085, 'e': 31536000};
          }
          return this[key];
        },
        removeItem(key) {
          delete this[key];
        },
      },
    },
    document: {
      addEventListener: _.noop,
      removeEventListener: _.noop,
      cookie: '',
    },
    navigator: {userAgent},
  };
  vm.createContext(ctx);
  vm.runInContext(jsContent, ctx);
  return new ctx.ParamsSign({appId});
}

function convertHex() {
  var i = {
    bytesToHex: convertHex().bytesToHex,
    convertString: convertString(),
  };
  // t.exports ? (i.bytesToHex = n("6c24").bytesToHex,
  //   i.convertString = n("422f"),
  //   t.exports = c) : (i.bytesToHex = e.convertHex.bytesToHex,
  //   i.convertString = e.convertString,
  //   e.sha256 = c);
  var r = [];
  !function () {
    function t(t) {
      for (var e = Math.sqrt(t), n = 2; n <= e; n++)
        if (!(t % n))
          return !1;
      return !0;
    }

    function e(t) {
      return 4294967296 * (t - (0 | t)) | 0;
    }

    var n = 2
      , i = 0;
    while (i < 64)
      t(n) && (r[i] = e(Math.pow(n, 1 / 3)),
        i++),
        n++;
  }();
  var a = function (t) {
    for (var e = [], n = 0, i = 0; n < t.length; n++,
      i += 8)
      e[i >>> 5] |= t[n] << 24 - i % 32;
    return e;
  }
    , o = function (t) {
    for (var e = [], n = 0; n < 32 * t.length; n += 8)
      e.push(t[n >>> 5] >>> 24 - n % 32 & 255);
    return e;
  }
    , s = []
    , l = function (t, e, n) {
    for (var i = t[0], a = t[1], o = t[2], l = t[3], c = t[4], u = t[5], d = t[6], p = t[7], f = 0; f < 64; f++) {
      if (f < 16)
        s[f] = 0 | e[n + f];
      else {
        var h = s[f - 15]
          , v = (h << 25 | h >>> 7) ^ (h << 14 | h >>> 18) ^ h >>> 3
          , m = s[f - 2]
          , g = (m << 15 | m >>> 17) ^ (m << 13 | m >>> 19) ^ m >>> 10;
        s[f] = v + s[f - 7] + g + s[f - 16];
      }
      var y = c & u ^ ~c & d
        , b = i & a ^ i & o ^ a & o
        , w = (i << 30 | i >>> 2) ^ (i << 19 | i >>> 13) ^ (i << 10 | i >>> 22)
        , x = (c << 26 | c >>> 6) ^ (c << 21 | c >>> 11) ^ (c << 7 | c >>> 25)
        , S = p + x + y + r[f] + s[f]
        , _ = w + b;
      p = d,
        d = u,
        u = c,
        c = l + S | 0,
        l = o,
        o = a,
        a = i,
        i = S + _ | 0;
    }
    t[0] = t[0] + i | 0,
      t[1] = t[1] + a | 0,
      t[2] = t[2] + o | 0,
      t[3] = t[3] + l | 0,
      t[4] = t[4] + c | 0,
      t[5] = t[5] + u | 0,
      t[6] = t[6] + d | 0,
      t[7] = t[7] + p | 0;
  };

  function c(t, e) {
    t.constructor === String && (t = i.convertString.UTF8.stringToBytes(t));
    var n = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]
      , r = a(t)
      , s = 8 * t.length;
    r[s >> 5] |= 128 << 24 - s % 32,
      r[15 + (s + 64 >> 9 << 4)] = s;
    for (var c = 0; c < r.length; c += 16)
      l(n, r, c);
    var u = o(n);
    return e && e.asBytes ? u : e && e.asString ? i.convertString.bytesToString(u) : i.bytesToHex(u);
  }

  c.x2 = function (t, e) {
    return c(c(t, {
      asBytes: !0,
    }), e);
  };

  return c;

  function convertHex() {
    var n = {
      bytesToHex: function (t) {
        return i(t);
      },
      hexToBytes: function (t) {
        if (t.length % 2 === 1)
          throw new Error('hexToBytes can\'t have a string with an odd number of characters.');
        return 0 === t.indexOf('0x') && (t = t.slice(2)),
          t.match(/../g).map((function (t) {
              return parseInt(t, 16);
            }
          ));
      },
    };

    function i(t) {
      return t.map((function (t) {
          return r(t.toString(16), 2);
        }
      )).join('');
    }

    function r(t, e) {
      return t.length > e ? t : Array(e - t.length + 1).join('0') + t;
    }

    return n;
  }

  function convertString() {
    var n = {
      bytesToString: function (t) {return t.map((function (t) {return String.fromCharCode(t);})).join('');},
      stringToBytes: function (t) {return t.split('').map((function (t) {return t.charCodeAt(0);}));},
    };
    n.UTF8 = {
      bytesToString: function (t) {return decodeURIComponent(escape(n.bytesToString(t)));},
      stringToBytes: function (t) {return n.stringToBytes(unescape(encodeURIComponent(t)));},
    };
    return n;
  }
}

module.exports = {
  genParamsSign,
  convertHex: body => convertHex()(JSON.stringify(body)),
};
