/**
 * @description 处理 Charles 相关数据的方法
 */

const _ = require('lodash');

function formatPasteData(str) {
  return _.fromPairs(str.trim().split('\n').map(str => str.split('\t').map(s => s.trim())));
}

function getFormValue(key, o) {
  const text = _.get(o, 'request.body.text', '');
  if (!text) return;
  const searchParams = new URL(`http://test.cn?${text}`).searchParams;
  if (_.isArray(key)) {
    return _.fromPairs(key.map(k => [k, searchParams.get(k)]));
  } else {
    return searchParams.get(key);
  }
}

module.exports = {
  formatPasteData,
  getFormValue,
};
