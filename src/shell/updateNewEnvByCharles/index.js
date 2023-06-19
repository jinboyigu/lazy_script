const {readFileJSON, writeFileJSON} = require('../../lib/common');
const {readDirJSON} = require('../../lib/charles');
const Cookie = require('../../lib/cookie');
const _ = require('lodash');

function updateNewEnvByCharles() {
  const {JD_COOKIE_OPTION} = readFileJSON('../../../.env.product.json', __dirname);
  if (!JD_COOKIE_OPTION) return console.log('无需更新');
  const result = readDirJSON(__dirname);
  const cookieKeys = [
    ['wq_uin', 'wq_skey'],
    ['pt_pin', 'pt_key'],
  ];
  const newCookies = _.filter(result.map(o => {
    const cookie = new Cookie('');
    o.request.header.headers.forEach(({name, value}) => {
      if (name === 'cookie') {
        cookie.add(value);
      }
    });
    const targetKeys = cookieKeys.find(keys => cookie.get(keys[0]));
    if (!targetKeys) return;
    return _.pick(cookie.toObject(), targetKeys);
  }), v => !_.isEmpty(v));
  const jdCookieOption = JD_COOKIE_OPTION.map(o => {
    const cookies = o.cookies;
    const target = newCookies.filter(o => cookieKeys.some(([pinKey]) => o[pinKey] === cookies[pinKey])) || [];
    return {cookies: _.merge({}, ...target)};
  });
  const data = {JD_COOKIE_OPTION: jdCookieOption};
  writeFileJSON(data, '../../../.env.new.json', __dirname);
  console.log(data);
  console.log('成功写入文件 .env.new.json, 请手动执行发送邮件的命令');
  console.log('npm run shell:sendNewEnvByMail');
}

updateNewEnvByCharles();
