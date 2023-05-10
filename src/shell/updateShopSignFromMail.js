/**
 * @description 从邮件中更新 shopGift.url 并自动运行 start:ShopGift
 */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const {search} = require('../lib/mailer');
const {getMoment} = require('../lib/moment');
const {updateProcessEnv} = require('../lib/env');

async function updateShopSignFromMail() {
  const text = await search({
    since: getMoment().subtract(2, 'day').toDate(),
  }).then(messages => _.map(messages, 'text').join('\n'));
  if (!text) return;
  console.log(`开始从邮件内容中更新 shopGift.url`);
  fs.writeFileSync(path.resolve(__dirname, '../jd/wq/shopGift.url'), text);
  require('child_process').spawn('npm', ['run', 'start:ShopGift'], {stdio: 'inherit'});
}

updateProcessEnv();
updateShopSignFromMail();
