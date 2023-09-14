const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Lhb4b extends Template {
  static scriptName = 'Lhb4b';
  static scriptNameDesc = '开红包(极简模式)';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'linkId': 'l-yLvQMhLwCqYy6_nXUBgg'},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '12.1.0',
  });
  static keepIndependence = true;
  static needInAppComplete1 = true;
  static times = 1;
  static activityEndTime = '2023-12-31';

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'x-referer-page': 'https://pro.m.jd.com/mall/active/49CfTHN1tUanwyZ6mVHo26hGiqiY/index.html',
          'referer': 'https://pro.m.jd.com/mall/active/49CfTHN1tUanwyZ6mVHo26hGiqiY/index.html?tttparams=VsuiEz5eyJnTGF0IjoiMjIuOTQzMTA1IiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMjMuMDc0MTIxIiwicG9zTGF0IjoiMjIuOTQzMTA1IiwicG9zTG5nIjoiMTEzLjQ3NDcxOCIsImdwc19hcmVhIjoiMTlfMTYwMV81MDI4M181MDM4NiIsImxuZyI6IjExMy40MjM3MjAiLCJ1ZW1wcyI6IjItMC0yIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn70%3D&babelChannel=ttt2&jumpFrom=1',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        lhb4b_home: {appId: 'd5a39'},
        lhb4b_open: {appId: '7af4f'},
        apsDoTask: {appId: '54ed7'},
        apTaskDrawAward: {appId: '6f2b6'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();
    const {ongoingOpenState, remainChance} = await api.doFormBody('lhb4b_home').then(_.property('data'));
    for (let i = 0; i < remainChance; i++) {
      await handleOpen();
    }
    // 开启 30s 抢红包
    if (ongoingOpenState === 1) {
      await handleOpen1();
    }
    const {totalAward} = await api.doFormBody('lhb4b_home').then(_.property('data'));
    const awardTypes = {
      1: '优惠券',
      2: '红包',
      4: '现金',
    };
    const awardLabel = totalAward.map(o => `${awardTypes[o.prizeType]}(${o.amount})`);
    api.log(`总收益: ${awardLabel.join(', ')}`);

    async function handleDoTask() {
      const taskList = await api.doFormBody('apTaskList').then(_.property('data'));
      for (const {
        id: taskId,
        taskType,
        taskSourceUrl: itemId,
        taskTitle,
        taskFinished,
        canDrawAwardNum
      } of taskList || []) {
        if (taskTitle.match('下单') || taskFinished) continue;
        const body = {
          taskType,
          taskId,
          itemId,
        };
        await api.doFormBody('apsDoTask', body);
      }
    }

    async function handleOpen1() {
      await handleOpen(1);
      const {ongoingOpenState} = await api.doFormBody('lhb4b_home').then(_.property('data'));
      if (ongoingOpenState === 2) {
        return handleOpen1();
      }
    }

    async function handleOpen(openMode = 0) {
      await api.doFormBody('lhb4b_open', {openMode}).then(result => {
        // TODO 自动提现
        if (result.success) {
          const received = _.get(result, 'data.received');
          received && received.prizeDesc && api.log(`获得 ${received.prizeDesc} ${received.prizeValue}`);
        } else {
          api.log(result);
        }
      });
      await sleep();
    }
  }
}

singleRun(Lhb4b).then();

module.exports = Lhb4b;
