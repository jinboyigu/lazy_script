/**
 * 获取 jdAlgo 输出结果
 */

const _ = require('lodash');
const Api = require('../../../../jd/api');

module.exports = function (params) {
  // 返回加密数据
  if (params.data.match('h5st=')) {
    const form = {};
    params.data.split('&').forEach(str => {
      const [key, value] = str.split('=');
      form[key] = decodeURIComponent(value);
    });
    // 需要固定值, 不然可能会出错
    form['osVersion'] = '17.5';
    return Promise.resolve({data: {form, headers: params.headers}});
  }
  return new Api().commonDo({
    ..._.pick(params, ['url', 'headers', 'json']),
    needDelay: false,
  }).then(data => ({data}));
};
