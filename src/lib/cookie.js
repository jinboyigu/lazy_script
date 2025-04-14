/**
 * cookie 处理
 */
const _ = require('lodash');

class Cookie {
  cookieObject = {};

  constructor(data, names) {
    const cookie = fromPairs(data);
    this.cookieObject = _.isEmpty(names) ? cookie : _.pick(cookie, names);
  }

  get(name) {
    return this.cookieObject[name];
  }

  set(name, value) {
    const [key, v] = splitCookieStr(name);
    this.cookieObject[key] = v || value;
  }

  add(str) {
    const newCookie = fromPairs(str);
    _.forEach(newCookie, (value, name) => {
      this.set(name, value);
    });
  }

  remove(name) {
    delete this.cookieObject[name];
  }

  toString(keys) {
    return toPairs(_.isEmpty(keys) ? this.cookieObject : _.pick(this.cookieObject, keys));
  }

  toObject() {
    return _.assign({}, this.cookieObject);
  }

  putAll(data) {
    Object.keys(data).forEach(key => {
      this.cookieObject[key] = data[key];
    });
  }
}

// name1=value1;name2=value2
// ["name=value"]
// cookie 格式：name=value; Path=/; Expires=Sun, 23-Apr-23 09:01:35 GMT; Domain=.domain.com;
function fromPairs(data) {
  if (_.isPlainObject(data)) return data;
  if (_.isString(data)) data = data.split(';');
  return _.fromPairs(data.map(splitCookieStr));
}

function toPairs(cookie) {
  return _.toPairs(cookie).map(array => array.join('=')).join('; ');
}

/**
 * @description 拆分cookie str
 * @param str
 * @return {string[]}
 */
function splitCookieStr(str) {
  str = str.split(';')[0].trim();
  const index = str.indexOf('=');
  if (index === -1) {
    return [str, ''];
  }
  return [str.substring(0, index), str.substring(index + 1)];
}

// cookie 序列化
// cookie 格式：name=value; Path=/; Expires=Sun, 23-Apr-23 09:01:35 GMT; Domain=.domain.com;
function serialize(name, val, opt) {
  let pairs = [name + '=' + val];
  opt = opt || {};


  if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
  if (opt.domain) pairs.push('Domain=' + opt.domain);
  if (opt.path) pairs.push('Path=' + opt.path);
  if (opt.expires) pairs.push('Expires=' + opt.exppires.toUTCString());
  if (opt.httpOnly) pairs.push('HttpOnly');
  if (opt.secure) pairs.push('Secure');


  return pairs.join(';');
}

module.exports = Cookie;
