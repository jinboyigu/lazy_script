const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {sleepTime} = require('../../lib/cron');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class SuperRedBagDraw extends Template {
  static scriptName = 'SuperRedBagDraw';
  static scriptNameDesc = '摇一摇';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'linkId': 'aE-1vg6_no2csxgXFuv3Kg'},
    appid: 'activity_platform_se',
    client: 'ios',
    clientVersion: '13.1.1',
    loginType: 2,
    loginWQBiz: 'wegame',
  });
  static needInApp = false;
  static keepIndependence = true;
  static times = 1;
  static activityEndTime = '2024-08-31';
  static needOriginProMd = true;
  static concurrent = true;
  static concurrentOnceDelay = 20;

  static isSuccess(data) {
    return data['code'] === 0;
  }

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        superRedBagHome: {appId: '5be1b'},
        superRedBagDraw: {appId: '89cfe'},
        // 本地加密会报错
        // superRedBagList: {appId: 'f2b1d'},
        apCashWithDraw: {appId: '73bca'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);
    if (self.getNowHour() === 19) {
      const nextLeftTime = await api.doFormBody('superRedBagHome').then(_.property('data.nextLeftTime'));
      if (!nextLeftTime) {
        api.logBoth('当前无活动');
        return;
      } else {
        api.logBoth(`需等待 ${nextLeftTime} 后执行`);
      }
      if (api.currentCookieTimes === 0) {
        console.log(`等待19点30分后执行`);
      }
      await sleepTime([19, 30]);
      await superRedBagDraw();
    }
    // TODO 提现暂关闭
    // await handleExchange();

    // 1 分钟摇一摇
    async function superRedBagDraw(isContinue = true) {
      const data = await api.doFormBody('superRedBagDraw');
      if (!self.isSuccess(data)) {
        api.log(data.errMsg);
        if (isContinue) {
          await sleep(4);
          return superRedBagDraw(false);
        }
        return;
      }
      const {data: {shakeLeftTime, prizeDrawVo}} = data;
      if (prizeDrawVo) {
        api.logBoth(`获得 ${prizeDrawVo.amount} ${prizeDrawVo.prizeDesc}`);
      } else {
        api.logBoth(`获得空气`);
      }
      if (shakeLeftTime > 0) {
        await sleep(4);
        return superRedBagDraw();
      }
    }

    // 提现
    async function handleExchange() {
      const prizeData = await api.doFormBody('superRedBagList', {
        'pageNum': 1,
        'pageSize': 20,
        'associateLinkId': '',
        'business': 'superRedEnvelope',
      }).then(data => _.get(data, 'data.items', []).find(o => o.prizeType === 4 && o.state === 0));
      if (prizeData) {
        await api.doFormBody('apCashWithDraw', {
          'businessSource': 'NONE',
          'base': {
            'business': 'superRedEnvelope',
            ..._.pick(prizeData, ['id', 'poolBaseId', 'prizeGroupId', 'prizeBaseId', 'prizeType', 'activityId']),
          },
          'channel': '1',
        }).then(data => {
          const amount = _.get(data, 'data.record.amount');
          if (amount) {
            api.log(`正在提现${amount}`);
          } else {
            api.log(data.data);
          }
        });
      }
    }
  }
}

singleRun(SuperRedBagDraw).then();

module.exports = SuperRedBagDraw;
