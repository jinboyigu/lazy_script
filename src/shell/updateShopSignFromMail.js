/**
 * @description 从邮件中更新 shopGift.url 并自动运行 start:ShopGift
 */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const {search} = require('../lib/mailer');
const {getMoment} = require('../lib/moment');
const {updateProcessEnv} = require('../lib/env');
const {exec} = require('../lib/common');

async function updateShopSignFromMail() {
  const since = getMoment().subtract(2, 'day');
  const text = await search({since}).then(messages => _.map(messages, 'text').join('\n'));
  if (!text) return console.log(`没有找到相应数据(${since.formatDate()}~至今)`);
  console.log(`开始从邮件内容中更新 shopGift.url`);
  fs.writeFileSync(path.resolve(__dirname, '../jd/wq/shopGift.url'), text);
  exec('npm run start:ShopGift');
}

updateProcessEnv();
updateShopSignFromMail();
