const {readFileJSON, writeFileJSON, sleep, exec} = require('../../lib/common');
const {readDirJSON} = require('../../lib/charles');
const Cookie = require('../../lib/cookie');
const _ = require('lodash');

// 从 Charles 抓包文件中获取 cookie 并自动更新
// Charles可以设置自动保存来自动存储 json 格式文件
async function updateNewEnvByCharles() {
  const {JD_COOKIE_OPTION} = readFileJSON('../../../.env.product.json', __dirname);
  if (!JD_COOKIE_OPTION) return console.log('无需更新');
  const result = readDirJSON(require('path').resolve(__dirname, '../../../'));
  const cookieKeys = [
    // 标识, 需更新的cookie 字段, [header 值(默认为 cookie), 判断方法]
    ['wq_uin', 'wq_skey'],
    ['pt_pin', 'pt_key'],
    // https://blackhole.m.jd
    ['pin_hash', 'wskey', ['j-e-c', v => {
      let pin;
      try {
        pin = JSON.parse(decodeURIComponent(v)).cipher.pin;
      } catch (e) {}
      return pin;
    }]],
  ];
  const newCookieOption = JD_COOKIE_OPTION.map(cookieOption => {
    // TODO 后续可能要支持更新 loginConfig.headers
    const {cookies, loginConfig} = cookieOption;
    const oldCookie = new Cookie(cookies);
    const newCookies = result.map(o => {
      const cookie = new Cookie('');
      o.request.header.headers.forEach(({name, value}) => {
        name = name.toLowerCase();
        if (name === 'cookie') {
          cookie.add(value);
        } else {
          cookie.set(name, value);
        }
      });
      return cookie;
    }).filter(cookie => cookieKeys.find(keys =>
      !_.isEqual(...[cookie, oldCookie].map(c => c.get(keys[1]))) /* 相同则无需更新 */
      && keys.some(k => {
        const [key, getValFn = v => v] = _.concat(k);
        const [v1, v2] = [cookie.get(key), oldCookie.get(key) || loginConfig.headers[key]].map(getValFn);
        return v1 && v1 === v2;
      })))
    .map(cookie => _.pick(cookie.toObject(), _.flatten(cookieKeys.map(array => _.filter([array[0], array[1]])))));
    if (_.isEmpty(newCookies)) {
      return {};
    }
    return {cookies: _.merge({}, ...newCookies)};
  });
  if (newCookieOption.every(_.isEmpty)) {
    console.log('没有新数据, 无需更新');
    return;
  }
  const data = {JD_COOKIE_OPTION: newCookieOption};
  writeFileJSON(data, '../../../.env.new.json', __dirname);
  console.log(require('util').inspect(data, {depth: null}));
  console.log('成功写入文件 .env.new.json');
  console.log('执行sendNewEnvByMail');
  await exec('npm run shell:sendNewEnvByMail');
  await sleep(5);
  console.log('5s后执行updateEnvFromMail');
  await exec('npm run shell:updateEnvFromMail');
  await sleep(2);
  console.log('执行ChangeCK');
  await exec('npm run build:ChangeCK');
}

updateNewEnvByCharles().then();
