const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class HuaFei extends Template {
  static scriptName = 'HuaFei';
  static scriptNameDesc = '手机充值-话费签到';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {paramData: {'actKey': 'XCsAm9nJwnY=\n', 'channel': '01', 'traceId': '', 'type': '2'}},
    appid: 'feother',
    loginType: 2,
  });
  static keepIndependence = true;
  static times = 1;
  static needInAppComplete1 = true;
  static activityEndTime = '2023-12-31';

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://recharge-pro.pf.jd.com',
          referer: 'https://recharge-pro.pf.jd.com/',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        huafei_sign_in: {appId: '71c06'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const {
      currSignCursor,
      rechargeSignActCycleDTOList,
    } = await api.doGetBody('huafei_sgin_act').then(_.property('data'));
    if (rechargeSignActCycleDTOList.find(o => o.signCursor === currSignCursor && o.signStatus === -1)) {
      // 签到
      const rewardItemDTOList = await api.doGetBody('huafei_sign_in', {paramData: {currSignCursorList: `${currSignCursor}`}}).then(_.property('data[0].rewardItemDTOList'));
      for (const rewardItem of rewardItemDTOList || []) {
        if (rewardItem.signHongBaoDTO) {
          api.log(`签到成功, 获得 ${rewardItem.signHongBaoDTO.discount}(${rewardItem.signHongBaoDTO.activityName})`);
        } else {
          api.log(rewardItem);
        }
      }
    }
  }
}

singleRun(HuaFei).then();

module.exports = HuaFei;
