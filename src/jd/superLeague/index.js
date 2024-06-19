const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class SuperLeague extends Template {
  static scriptName = 'SuperLeague';
  static scriptNameDesc = '抽超市卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'linkId': 'kKf0fO1O_28HF2Ff0hucCw'},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.1.0',
  });
  static keepIndependence = true;
  static times = 1;
  static needInAppDynamicTime = true;
  static needOriginProMd = true;
  static activityEndTime = '2024-06-20';

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        superLeagueHome: {appId: 'b7d17'},
        superLeagueLottery: {appId: '60dc4'},
        apsDoTask: {appId: '54ed7'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();

    const {remainTimes} = await api.doFormBody('superLeagueHome').then(_.property('data'));
    for (let i = 0; i < remainTimes; i++) {
      await api.doFormBody('superLeagueLottery').then(data => {
        api.log(`抽奖获得 ${_.get(data, 'data.codeDesc') || '空气'}(${_.get(data, 'data.prizeDesc')})`);
      });
      await sleep(2);
    }

    async function handleDoTask() {
      const taskList = await api.doFormBody('apTaskList').then(_.property('data'));
      for (const {
        id: taskId,
        taskType,
        taskTitle,
        taskLimitTimes: maxTimes,
        taskDoTimes: times,
        taskFinished
      } of taskList) {
        if (taskFinished || /助力/.test(taskTitle) || ['FOLLOW_CHANNEL'].includes(taskType)) continue;
        const channel = 4;
        const {taskItemList} = await api.doFormBody('apTaskDetail', {
          taskType,
          taskId,
          channel,
        }).then(_.property('data'));
        await self.loopCall(taskItemList, {
          times,
          maxTimes,
          async firstFn({itemId}) {
            await sleep(2);
            return api.doFormBody('apsDoTask', {taskType, taskId, channel, itemId});
          },
        });
      }
    }
  }
}

singleRun(SuperLeague).then();

module.exports = SuperLeague;
