/**
 * @description 处理 Charles 相关数据的方法
 */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const {readFileJSON} = require('./common');

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


/**
 * @description Charles export session(json)后提取数据
 * @param dirPath {String} 存放路径
 * @param options {Object} 选项
 * @param options.deleteOrigin {boolean} 是否删除源文件
 * @param options.formatFn {function} 处理返回结果
 * @return Array
 */
function readDirJSON(dirPath, options = {}) {
  const {deleteOrigin = true, formatFn = _.filter} = options;
  const fileNames = fs.readdirSync(dirPath).filter(v => v.endsWith('.chlsj'));
  if (_.isEmpty(fileNames)) {
    return [];
  }

  const result = formatFn(_.flatten(fileNames.map(name => readFileJSON(name, dirPath, []))));

  deleteOrigin && fileNames.forEach(name => {
    fs.rmSync(path.resolve(dirPath, name));
  });

  result.forEach(o => {
    _.get(o, 'request.header.headers', []).forEach(header => {
      header.name = header.name.toLowerCase();
    });
  });

  return result;
}

module.exports = {
  formatPasteData,
  getFormValue,
  readDirJSON,
};
