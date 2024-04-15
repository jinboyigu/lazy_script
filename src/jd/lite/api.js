const CryptoJS = require('crypto-js');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

/**
 * @description 对请求参数进行加密后返回
 * @param functionId {String}
 * @param body {Object}
 * @param t 时间戳 {String}
 * @return form 包含 sign,t {Object}
 */
function encrypt(functionId, body = {}, t = getMoment().valueOf()) {
  const key = '12aea658f76e453faf803d15c40a72e0';
  const version = '3.1.0';
  const form = {
    appid: 'lite-android',
    body: JSON.stringify(body),
    client: 'android',
    clientVersion: version,
    functionId,
    t,
    uuid: 'hjudwgohxzVu96krv/T6Hg==',
  };
  let msg = Object.values(form).join('&');
  const sign = CryptoJS.HmacSHA256(msg, key).toString();
  return _.assign({sign}, form);
}

function clientHandleService(method, data = {}, others = {}, t) {
  const functionId = others.functionId || 'ClientHandleService.execute';
  delete others.functionId;
  return {functionId, form: encrypt(functionId, {method, data, ...others}, t)};
}

function doFormBody(api, functionId, method, data, body = {}) {
  return api.doFormBody(functionId, _.assign({method, data}, body));
}

function doForm(api, method, data = {}, others, t, options) {
  const {functionId, form} = clientHandleService(method, _.assign({'channel': '1'}, data), others, t);
  return api.doForm(functionId, form, options);
}

function doFormWithClientTime(api, method, data = {}, others, options) {
  const clientTime = getMoment().valueOf();
  return doForm(api, method, _.assign({clientTime: `${clientTime}`}, data), others, clientTime, options);
}

module.exports = {
  encrypt,

  clientHandleService,
  doFormBody,
  doForm,
  doFormWithClientTime,
};
