const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod, matchMiddle} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

let linkId = '';

class SuperLeague extends Template {
  static scriptName = 'SuperLeague';
  static scriptNameDesc = '抽超市卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.1.0',
  });
  static keepIndependence = true;
  static times = 1;
  static needInAppDynamicTime = true;
  static needOriginProMd = true;

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    const originUrl = `https://prodev.m.jd.com/mall/active/2tCyuWWrv9h7KbVMZaUs4madVg93/index.html?stath=47&navh=44&utm_term=8c91d6fc08224bddbadb55253ab7df0c&utm_source=lianmeng__2__kong&utm_campaign=t_1003272801_&utm_medium=jingfen&tttparams=iiOY4tXWeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDI5MDYiLCJwb3NMbmciOiIxMTMuNDc0ODAxIiwiZ3BzX2FyZWEiOiIwXzBfMF8wIiwibG5nIjoiMC4wMDAwMDAiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ4MDEiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn80%3D&cu=true`;
    await api.doGetUrl(originUrl).then((data => {
      const newLinkId = matchMiddle(data, {reg: /"linkId":"([^"']*)"/});
      if (newLinkId === linkId) return;
      linkId = newLinkId;
    }));

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

    if (!linkId) {
      return api.log('没找到 linkId');
    }

    const stop = await handleDoTask();

    if (stop) {
      return api.log(`linkId(${linkId})无效`);
    }
    await handleLottery();

    async function handleDoTask() {
      const taskList = await api.doFormBody('apTaskList').then(_.property('data'));
      if (!taskList) return true;
      for (const {
        id: taskId,
        taskType,
        taskTitle,
        taskLimitTimes: maxTimes,
        taskDoTimes: times,
        taskFinished
      } of taskList || []) {
        if (taskFinished || /助力/.test(taskTitle) || ['FOLLOW_CHANNEL'].includes(taskType)) continue;
        const channel = 4;
        const {taskItemList} = await api.doFormBody('apTaskDetail', {
          taskType,
          taskId,
          channel,
        }).then(_.property('data')) || {};
        taskItemList && await self.loopCall(taskItemList, {
          times,
          maxTimes,
          async firstFn({itemId}) {
            await sleep(2);
            return api.doFormBody('apsDoTask', {taskType, taskId, channel, itemId});
          },
        });
      }
    }

    async function handleLottery() {
      const {remainTimes} = await api.doFormBody('superLeagueHome').then(_.property('data'));
      for (let i = 0; i < remainTimes; i++) {
        await api.doFormBody('superLeagueLottery').then(data => {
          api.log(`抽奖获得 ${_.get(data, 'data.codeDesc') || '空气'}(${_.get(data, 'data.prizeDesc')})`);
        });
        await sleep(2);
      }
    }
  }
}

singleRun(SuperLeague).then();

module.exports = SuperLeague;
