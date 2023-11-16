const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class RichTree extends Template {
  static scriptName = 'RichTree';
  static scriptNameDesc = '摇钱树(极简模式)';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'linkId': '_LN1l_4Nv5mTEsWhs3hIMA'},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '12.1.0',
    'x-api-eid-token': 'jdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMKQ6EXMLIAAAAADTMR36FLEQGPGAX',
  });
  static keepIndependence = true;
  static needInAppComplete1 = true;
  static times = 1;
  static activityEndTime = '2023-12-31';

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://h5platform.jd.com',
          'referer': 'https://h5platform.jd.com/swm-stable/BVersion-rich-tree/index?activityId=_LN1l_4Nv5mTEsWhs3hIMA&channel=1&sid=&un_area=19_1601_36953_50400',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        richTreeHome: {appId: '34e92'},
        richTreeWater: {appId: '34e92'},
        richTreeOpen: {appId: '34e92'},
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
    const {richTree, drawLotteryNum} = await api.doFormBody('richTreeHome').then(_.property('data'));
    for (let i = 0; i < drawLotteryNum; i++) {
      await api.doFormBody('richTreeOpen').then(result => {
        if (result.success) {
          result.data.prizeDesc && api.log(`获得 ${result.data.prizeDesc} ${result.data.amount}`);
        } else {
          api.log(result);
        }
      });
      await sleep(2);
    }
    api.log(`当前等级: ${richTree.nowStep}`);

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

  }

  static async doCron(api) {
    const self = this;

    await self.beforeRequest(api);
    await handleDoWater(api);
  }
}


async function handleDoWater(api) {
  const currentCapacity = await api.doFormBody('richTreeHome').then(_.property('data.kettle.currentCapacity'));
  currentCapacity && await api.doFormBody('richTreeWater', {'waterNum': currentCapacity, 'type': 0}).then(result => {
    if (result.success) {
      api.log(`成功浇水 ${result.data.waterNum}`);
    } else {
      api.log(result);
    }
  });
}

singleRun(RichTree, ['start', 'cron']).then();

module.exports = RichTree;
