const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Machine extends Template {
  static scriptName = 'Machine';
  static scriptNameDesc = '全民大乐透';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '12.2.2',
    loginType: 2,
    loginWQBiz: 'wegame',
    body: {'linkId': 'p_HAvgmOZnWOyRb-2ZJkVA'},
  });
  static keepIndependence = true;
  static needInAppComplete1 = true;
  static times = 1;
  static activityEndTime = '2023-11-18';

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://prodev.m.jd.com',
          referer: 'https://prodev.m.jd.com/mall/active/2iAtHEAYAEDiQy6RyH7wNCsiMPr3/index.html?utm_campaign=t_1003272801_&utm_term=493bf588327a4628957baab4e19052f3&utm_medium=jingfen&tttparams=i6Mc5jFieyJnTGF0IjoiMjIuOTQzMTA1IiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMjMuMDc0MTIxIiwicG9zTGF0IjoiMjIuOTQzMTA1IiwicG9zTG5nIjoiMTEzLjQ3NDcxOCIsImdwc19hcmVhIjoiMF8wXzBfMCIsImxuZyI6IjExMy40MjM3MjAiLCJ1ZW1wcyI6IjAtMC0yIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn80%3D&utm_source=kong&cu=true',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        lotteryMachineHome: {appId: 'd7439'},
        lotteryMachineDraw: {appId: 'd7439'},
        apsDoTask: {appId: '54ed7'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();
    await handleLottery();

    async function handleDoTask() {
      const taskList = await api.doFormBody('apTaskList').then(_.property('data'));

      for (const {id: taskId, taskType, taskDoTimes, taskLimitTimes, taskTitle} of taskList) {
        if (taskTitle.match('下单') || taskDoTimes === taskLimitTimes) continue;
        const baseBody = {taskType, taskId, 'channel': 4, 'checkVersion': true};
        const taskItemList = await api.doFormBody('apTaskDetail', baseBody).then(_.property('data.taskItemList'));
        let i = taskDoTimes;
        for (const {itemId} of taskItemList) {
          await api.doFormBody('apsDoTask', {
            ...baseBody,
            'taskInsert': false,
            itemId,
          });
          await sleep(2);
          i++;
          if (i >= taskLimitTimes) break;
        }
      }
    }

    async function handleLottery() {
      const remainTimes = await api.doFormBody('lotteryMachineHome').then(_.property('data.remainTimes'));
      for (let i = 0; i < remainTimes; i++) {
        const {prizeConfigName} = await api.doFormBody('lotteryMachineDraw').then(_.property('data'));
        api.log(`抽中 ${prizeConfigName ? prizeConfigName : '空气'}`);
        await sleep(5);
      }
    }
  }
}

singleRun(Machine).then();

module.exports = Machine;
