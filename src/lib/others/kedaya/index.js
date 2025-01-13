/**
 * @description 输出加密结果
 */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

function patch() {
  if (process.communal) {
    return;
  }
  const profile = require('./config/profile');
  // 替换 axios 引用
  (function replaceCommon() {
    const str = fs.readFileSync(path.resolve(__dirname, './util/common.js')).toString();
    const target = _.get(str.match(/axios=require\(([()\w,_]*)\)/), 1);
    target && fs.writeFileSync(path.resolve(__dirname, './util/common.js'), str.replace(target, '"./axios"'));
  })();
  const Common = require('./util/common');
  const common = new Common({});
  process.communal = {};
  profile.communal.forEach(key => {
    process.communal[key] = common[key];
  });
}

module.exports = function Algo(algoOptions) {
  patch();
  const jdAlgo = require('./util/jdAlgo');
  class _jdAlgo extends jdAlgo {}
  const {version = 'latest', type = 'main'} = algoOptions || {};
  const algo = new _jdAlgo({version, type});
  return {
    sign: async options => {
      let {url = `https://api.m.jd.com/client.action`, appId, form} = options || {};
      let formStr = Object.keys(form).map(key => {
        const value = form[key];
        return `${key}=${encodeURIComponent(_.isObject(value) ? JSON.stringify(value) : value)}`;
      }).join('&');
      return algo.curl(({
          url,
          form: formStr,
          algo: {
            appId,
          },
        }
      ));
    },
    userAgent: () => process.communal.userAgents(),
  };
};
