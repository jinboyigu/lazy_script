/**
 * 获取 jdAlgo 输出结果
 */

const axios = require('axios');

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
  const proxy = process.env.http_proxy;
  return axios({
    ...params,
    proxy: false,
    ...proxy && {
      httpsAgent: require('tunnel').httpsOverHttp({
        proxy: {
          host: new URL(proxy).hostname,
          port: new URL(proxy).port,
        },
        rejectUnauthorized: false,
      }),
    },
  });
};
