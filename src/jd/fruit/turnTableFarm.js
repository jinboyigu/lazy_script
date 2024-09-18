const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const _ = require('lodash');
const {getEnv} = require('../../lib/env');

const TASK_DO = 1;
const TASK_DONE = 2;

class TurntableFarm extends Template {
  static scriptName = 'TurntableFarm';
  static scriptNameDesc = '东东农场-天天红包';
  static shareCodeTaskList = [];
  static commonParamFn = () => ({'version': 24, 'channel': 1});

  static apiOptions = {
    signData: {appid: 'wh5'},
    formatDataFn: data => data,
  };

  static isSuccess(data) {
    return _.property('code')(data) === '0';
  }

  static async beforeRequest(api) {
    // 从 https://storage.360buyimg.com/babel/00600381/1456188/production/dev/app.dee901ec.js 中获取
    const originConfig = {
      'initForFarm': '8a2af',
    };
    const config = {};
    Object.entries(originConfig).forEach(([key, appId]) => {
      config[key] = {appId};
    });
    this.injectEncryptH5st(api, {
      config,
      signFromKEDAYA: true,
    });
  }

  static apiNamesFn() {
    const self = this;

    return {
      // 获取任务列表
      getTaskList: {
        name: 'initForTurntableFarm',
        paramFn: self.commonParamFn,
        successFn: async (data, api) => {
          // writeFileJSON(data, 'initForTurntableFarm.json', __dirname);

          if (!self.isSuccess(data)) {
            throw data.message;
          }

          const result = [];

          const taskList = _.property('turntableBrowserAds')(data) || [];
          for (let {
            adId,
            status,
            gotStatus,
            totalTimes: maxTimes,
            times,
            browserTimes: waitDuration,
          } of taskList) {
            if (status && gotStatus) continue;

            let list = [];

            list.push(_.assign({
              adId, type: status ? TASK_DONE : TASK_DO,
            }, self.commonParamFn()));

            status && (waitDuration = 0);
            result.push({list, option: {maxTimes, times, waitDuration}});
          }

          const initForFarm = (body = {}) => api.doFormBody('initForFarm', {'version': 26, 'channel': 1, 'babelChannel': '522', ...body}, {
            appid: 'signed_wh5',
            client: 'apple',
            clientVersion: '12.3.1',
            body: {'version': 26, 'channel': 1, 'babelChannel': '522'},
          }, {
            headers: {
              referer: 'https://carry.m.jd.com/babelDiy/Zeus/3KSjXqQabiTuD1cJ28QskrpWoBKT/index.html',
            },
          });

          const {shareCodeAddOn} = data;
          const farmShareCode = getEnv('JD_FRUIT_SELF_SHARE_CODE', api.getPin()) || await initForFarm().then(_.property('farmUserPro.shareCode'));
          if (!farmShareCode) {
            return result;
          }
          const currentShareCode = `${farmShareCode}${shareCodeAddOn}`;
          !self.shareCodeTaskList.includes(currentShareCode) && self.shareCodeTaskList.push(currentShareCode);

          let list = self.getShareCodeFn();

          list.length && result.push({
            list,
            option: {
              firstFn: (shareCode) => {
                return initForFarm({shareCode});
              },
            },
          });

          return result;
        },
      },
      doTask: {
        name: 'browserForTurntableFarm',
        paramFn: o => o,
      },
      doWaitTask: {
        name: 'browserForTurntableFarm',
        paramFn: o => {
          o.type = TASK_DONE;
          return o;
        },
      },
      doRedeem: {
        name: 'lotteryForTurntableFarm',
        paramFn: () => _.assign({type: 1}, self.commonParamFn()),
        successFn: async (data, api) => {
          const {addWater, remainLotteryTimes, beanCount} = data;
          if (!self.isSuccess(data) || remainLotteryTimes === 0) return false;
          await sleep(5);
          const number = addWater || beanCount;
          if (number) {
            api.log(`获得${addWater ? '水滴' : '豆豆'}: ${number}`);
          }
        },
        repeat: true,
      },
    };
  };

  static async doCron(api) {
    const self = this;

    await api.doFormBody('timingAwardForTurntableFarm');
    await self.doApi(api, 'doRedeem');
  }
}

singleRun(TurntableFarm).then();

module.exports = TurntableFarm;
