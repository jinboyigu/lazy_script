const _ = require('lodash');
const {getProductEnv} = require('./src/lib/env');
const jdCookieOption = getProductEnv().JD_COOKIE_OPTION;

console.log('未登录账号有:', _.filter(jdCookieOption.map((o, i) => !o.cookies.pt_key && `jd${i}/${o.cookies.pt_pin}`)).join(' '));
