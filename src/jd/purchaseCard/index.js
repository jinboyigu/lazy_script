const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, getLogs} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const {formatPasteData} = require('../../lib/charles');

class PurchaseCard extends Template {
  static scriptName = 'PurchaseCard';
  static scriptNameDesc = '省省卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'month_card',
  });
  static needInApp = false;
  static keepIndependence = true;
  static times = 1;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://mcard.jd.com',
          'referer': 'https://mcard.jd.com/',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        vvipcocoon_purchaseCard_couponInfo: {appId: 'f173d'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleSign();

    async function handleSign() {
      const userRewards = await api.doFormBody('vvipcocoon_purchaseCard_couponInfo', {
        'cardIdEnc': '_vxHkMHQS98=',
        'tabCardIdEnc': '_vxHkMHQS98=',
        'invitorInfo': '',
        'paramData': {'platform': 1, 'pageClickKey': ''},
        'address': '',
        'channel': '314',
        'appVersion': '0',
      }).then(_.property('data.extraRightsDTO.userRewards')) || [];
      const target = userRewards.find(o => o.status === 2);
      if (!target) return api.log('今天已经领取或者未开通');
      await api.doFormBody('vvipcocoon_extraRightsDispatch', {
        'receiveKey': target.receiveKey,
        'channel': '314',
        'floorType': 5,
        'address': 'iOmxOgGJp10LNqUffyvPP+lrTLk7YNv0',
      }).then(data => {
        api.log(`${data.data.materialText} ${data.data.showAmount}`);
      });
    }
  }
}

singleRun(PurchaseCard).then();

module.exports = PurchaseCard;
