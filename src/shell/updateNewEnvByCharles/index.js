const {readFileJSON, writeFileJSON} = require('../../lib/common');
const {readDirJSON} = require('../../lib/charles');
const Cookie = require('../../lib/cookie');
const _ = require('lodash');

function updateNewEnvByCharles() {
  const {JD_COOKIE_OPTION} = readFileJSON('../../../.env.product.json', __dirname);
  if (!JD_COOKIE_OPTION) return console.log('无需更新');
  const result = readDirJSON(__dirname);
  const ptPin = 'pt_pin';
  const newCookies = _.uniqBy(_.filter(result.map(o => {
    const cookie = new Cookie('');
    o.request.header.headers.forEach(({name, value}) => {
      if (name === 'cookie') {
        cookie.add(value);
      }
    });
    return _.pick(cookie.toObject(), [ptPin, 'pt_key']);
  }), v => !_.isEmpty(v)), ptPin);
  const jdCookieOption = JD_COOKIE_OPTION.map(o => {
    const cookies = o.cookies;
    const target = newCookies.find(o => o[ptPin] === cookies[ptPin]) || {};
    return {cookies: target};
  });
  const data = {JD_COOKIE_OPTION: jdCookieOption};
  writeFileJSON(data, '../../../.env.new.json', __dirname);
  console.log(data);
  console.log('成功写入文件 .env.new.json, 请手动执行发送邮件的命令');
  console.log('npm run shell:sendNewEnvByMail');
}

updateNewEnvByCharles();
