const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Day20241023 extends Template {
  static scriptName = 'Day20241023';
  static scriptNameDesc = '24年11.11科沃斯活动';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    client: 'iOS',
    clientVersion: '13.2.10',
    appid: 'jdchoujiang_h5',
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 1;
  static needOriginProMd = true;

  static apiOptions() {
    return {
      options: {
        errorTryMaxTimes: 0,
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        moduleGetActivity: {appId: '05b33'},
        moduleDoTask: {appId: 'bbfbd'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const configCode = '5097c062ec6242748f8f9b7385241b6a';
    await handleDoTask();

    async function handleDoTask() {
      let continueDoTask = false;
      const {dailyTask: {taskList}, moduleBaseInfo} = await api.doGetBody('moduleGetActivity', {
        configCode,
        'eid': 'M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3Q',
        'fp': 'fe5d3208b2ebe819d7d10690106e0d1b',
      }).then(_.property('data'));
      if (moduleBaseInfo.finish) {
        return api.log('活动已结束');
      }
      for (const {groupType, finishCount, taskCount, rewardQuantity, item: {itemId}} of taskList) {
        if (finishCount < taskCount) {
          await sleep(5);
          await api.doGetBody('moduleDoTask', {
            groupType,
            configCode,
            itemId,
            'eid': 'M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3Q',
            'fp': 'fe5d3208b2ebe819d7d10690106e0d1b',
          }, {method: 'POST'}).then(data => {
            if (data.success) {
              api.log(`任务成功: 获得豆${rewardQuantity}`);
              continueDoTask = true;
            } else {
              api.log(`任务失败: ${data.errorMessage}`);
            }
          });
          break;
        }
      }
      if (continueDoTask) {
        return handleDoTask();
      }
    }
  }
}

singleRun(Day20241023).then();

module.exports = Day20241023;
