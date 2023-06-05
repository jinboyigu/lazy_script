const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const CryptoJS = require('crypto-js');
const {replaceObjectMethod} = require('../common');

const convertHex = body => CryptoJS.SHA256(JSON.stringify(body)).toString();

function genParamsSign(options) {
  const {
    userAgent = '',
    appId,
    fp,
    signKeys = ['functionId', 'appid', 'clientVersion', 'client', 't', 'body'],
  } = options;
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
  const paramsSign = new ctx.ParamsSign({appId});
  paramsSign.ctx = ctx;
  replaceObjectMethod(paramsSign, 'sign', function ([data]) {
    if (!_.isEmpty(signKeys)) {
      data = _.pick(data, signKeys);
    }
    data.body && (data.body = convertHex(data.body));
    return [data];
  });
  return paramsSign;
}

module.exports = {
  genParamsSign,
};
