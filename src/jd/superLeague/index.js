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

  static activityEndTime = '2024-06-20';

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    const originUrl = `https://pro.m.jd.com/mall/active/2uXu6yffAWogkJDsRkxFq5YiCfGT/index.html?stath=47&navh=44&inviter=vNsp7eclDGU79VZWwzuDLw&utm_term=c03ff960a30148359a9978cb86752c61&utm_source=kong&tttparams=IYIcwUeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI5NDIxMTMyNzE4IiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDI5MDYiLCJwb3NMbmciOiIxMTMuNDc0ODAxIiwiZ3BzX2FyZWEiOiIwXzBfMF8wIiwibG5nIjoiMC4wMDAwMDAiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ4MDEiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn60%3D&utm_medium=jingfen&cu=true&femobile=femobile&utm_campaign=t_1003272801_&__fr=deeplink&taskId=5101&activityChannel=jdapp`;
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
