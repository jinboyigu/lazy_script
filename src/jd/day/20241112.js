const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Day20241112 extends Template {
  static scriptName = 'Day20241112';
  static scriptNameDesc = '连续签到领豆';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'signed_wh5_ihub',
    client: 'apple',
    clientVersion: '13.6.2',
    body: {'activityId': '2925'},
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 1;
  static needOriginProMd = true;

  static apiOptions() {
    return {
      options: {
        frequencyLimit: {max: 4},
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        deliverySign_home: {appId: 'e88fd'},
        deliverySign_sign: {appId: 'e88fd'},
        deliverySign_continue_award: {appId: 'e88fd'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const homeData = await api.doFormBody('deliverySign_home');
    if (_.get(homeData, 'data.result.signButton.status') !== 1) return;
    await api.doFormBody('deliverySign_sign').then(data => {
      if (self.isSuccess(data)) {
        // api.log(`签到成功(获得: ${_.get(data, 'data.result.value')})`);
        api.log(`签到成功(获得: ${JSON.stringify(data)})`);
      } else {
        api.log(`签到失败: ${JSON.stringify(data)}`);
      }
    });
    await api.doFormBody('deliverySign_continue_award').then(data => {
      api.log(`deliverySign_continue_award: ${JSON.stringify(data)}`);
    });
  }
}

singleRun(Day20241112).then();

module.exports = Day20241112;
