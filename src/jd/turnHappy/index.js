const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, getLogFile, extractLogToObject} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class TurnHappy extends Template {
  static scriptName = 'TurnHappy';
  static scriptNameDesc = '翻一翻';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'linkId': 'CDv-TaCmVcD0sxAI_HE2RQ'},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.1.0',
  });
  static needInAppDynamicTime = true;
  static keepIndependence = true;
  static times = 1;
  static activityEndTime = '2024-08-31';
  static concurrent = true;
  static concurrentOnceDelay = 20;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'referer': 'https://pro.m.jd.com/mall/active/3fcyrvLZALNPWCEDRvaZJVrzek8v/index.html?stath=47&navh=44&tttparams=LwGnNRiMQeyJnTGF0IjoiMjIuOTQzMTA1Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDMxMDUiLCJwb3NMbmciOiIxMTMuNDc0NzE4IiwiZ3BzX2FyZWEiOiIwXzBfMF8wIiwibG5nIjoiMC4wMDAwMDAiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn90%3D&hideAnchorBottomTab=1&babelChannel=ttt16&hybrid_err_view=1&hideTopFoot=1&topNavStyle=1&commontitle=no&jwebprog=0&disablePageSticky=1&transparent=1',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        turnHappyDouble: {appId: '614f1'},
        turnHappyReceive: {appId: '25fac'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const fourTimes = _.first(self._command);

    let {leftTime, reachDayLimit, usable, joinTimes} = await api.doFormBody('turnHappyHome').then(_.property('data'));
    if (api.currentCookieTimes === 0) {
      console.log(`现在时间: ${getMoment().format()}`);
    }
    if (reachDayLimit > 0) {
      api.logBoth('今天翻倍次数已达上限');
      log();
      return;
    }
    if (leftTime > 0) {
      const seconds = Math.floor(leftTime / 1000 + 1);
      api.logBoth(`需等待${seconds / 60}分钟后再执行翻倍`);
      await sleep(seconds);
    }
    await sleep(2);
    await turnHappyDouble(usable, `${(fourTimes || '2,4')}`.split(',').map(v => +v).includes(joinTimes + 1) ? 2 : 1);
    await sleep(2);
    api.logBoth(`现有奖券: ${usable}`);

    async function turnHappyDouble(turnNum, times = 1) {
      if (turnNum === 0) {
        return;
      }
      if (turnNum > 100) {
        turnNum = 100;
      }
      const {
        rewardState,
        rewardValue,
      } = await api.doFormBody('turnHappyDouble', {turnNum: _.toString(turnNum)}).then(_.property('data'));
      --times;
      if (rewardState === 1) {
        if (times <= 0) {
          await api.doFormBody('turnHappyReceive').then(result => {
            if (result.success) {
              usable -= _.max([turnNum, 100]);
              usable += +rewardValue;
              api.logBoth(`成功翻倍获取 ${rewardValue}`);
            } else {
              api.logBoth(result);
            }
          });
        } else {
          // 第 2 次以上是传 -1
          await sleep();
          return turnHappyDouble(-1, times);
        }
      } else if (rewardState === 3) {
        usable -= _.max([turnNum, 100]);
        api.logBoth(`翻倍失败!`);
      }
    }

    function log() {
      const logData = _.filter(getLogFile('app', void 0, true).split(/[\n|\r]/)).map(extractLogToObject).filter(o => o && (o.name === self.scriptNameDesc) && o.cookieName === api.pinLabel);
      const totalData = logData.filter(o => o.msg.startsWith('现有奖券'));
      const reward = _.subtract(...[_.last(totalData), _.first(totalData)].map(o => +o.msg.match(/\d+/)));
      const doubleSuccess = logData.filter(o => o.msg.startsWith('成功翻倍')).length;
      const doubleFail = logData.filter(o => o.msg.startsWith('翻倍失败')).length;
      api.logBoth(`${_.last(totalData).msg}, 今天获得: ${reward}, 成功翻倍次数: ${doubleSuccess}(共${doubleSuccess + doubleFail}次)`);
    }
  }
}

singleRun(TurnHappy).then();

module.exports = TurnHappy;
