/**
 * @description 将cookie的 wskey(有效期未知, 需从app捕获) 转换为 pt_key(有效期1天)
 *
 */

const Template = require('../base/template');

const {sleep, readFileJSON, writeFileJSON, singleRun} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {uploadProductEnvToAction, getProductEnv} = require('../../lib/env');
const _ = require('lodash');

class ChangeCK extends Template {
  static scriptName = 'ChangeCK';
  static scriptNameDesc = '转换cookie';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({});
  static activityEndTime = '';
  static times = 1;
  static needChangeCK = false;

  static apiOptions = {
    options: {},
  };

  static async doMain(api, shareCodes) {
    const self = this;

    if (!self.oldCookieOption) {
      self.oldCookieOption = _.get(getProductEnv(), 'JD_COOKIE_OPTION');
    }

    await self.changeCK(api, true);
  }

  static async afterAllDone() {
    const self = this;
    await uploadProductEnvToAction();
    const newCookieOption = _.get(getProductEnv(), 'JD_COOKIE_OPTION');
    const changed = newCookieOption.map(({cookies}, i) => {
      const newCookies = {};
      Object.entries(cookies).forEach(([key, value]) => {
        if (self.oldCookieOption[i].cookies[key] !== value) {
          newCookies[key] = value;
        }
      });
      if (!_.isEmpty(newCookies)) {
        newCookies['wskey'] = cookies['wskey'];
      }
      return {cookies: newCookies};
    });
    if (_.every(changed, o => _.isEmpty(o.cookies))) return console.log('无需发送邮件');
    require('../../lib/mailer').sendNewEnv({'JD_COOKIE_OPTION': changed});
  }
}

singleRun(ChangeCK).then();

module.exports = ChangeCK;
