const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const _ = require('lodash');

const {smallBean} = require('../../../charles/api');

// 活动入口
const indexUrl = 'https://h5.m.jd.com/rn/42yjy8na6pFsq1cx9MJQ5aTgu3kX/index.html';

class BeanSmallBean extends Template {
  static scriptName = 'BeanSmallBean';
  static scriptNameDesc = '豆小豆';
  static times = 1;
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'signed_wh5_ihub',
  });
  static keepIndependence = true;
  static needInApp = false;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          referer: 'https://pro.m.jd.com/mall/active/43mNbs4F53FUMVin65VHVYYKB94f/index.html?stath=47&navh=44&babelChannel=ttt1&tttparams=2ZWJOeIeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMjMuMDc0MTIxIiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicmZzIjoiMDAwMCIsInBvc0xuZyI6IjExMy40NzQ4MDEiLCJncHNfYXJlYSI6IjE5XzE2MDFfNTAyODNfNTAzODYiLCJsbmciOiIxMTMuNDIzNzIwIiwidWVtcHMiOiIwLTAtMCIsImdMbmciOiIxMTMuNDc0ODAxIiwibW9kZWwiOiJpUGhvbmUxMywzIiwiZExuZyI6Ii7J9',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        beanDoTask: {appId: '8f011'},
        findBeanSceneNew: {appId: 'ed9a2'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api) {
    const self = this;

    await self.beforeRequest(api);
    const getTaskList = () => api.doFormBody('beanTaskList', {
      'beanVersion': 1,
      'newList': '1',
    }, {appid: 'ld'}).then(data => _.property('data.taskInfos')(data) || []);
    const getTaskById = taskId => getTaskList().then(taskList => taskList.find(o => o['taskId'] === taskId));

    const taskList = await getTaskList();
    for (let {taskId, status, subTitleName, maxTimes, times, subTaskVOS, waitDuration = 0} of taskList) {
      const {title} = subTaskVOS[0] || {};
      if (maxTimes === times || status === 2 || ['下单抵现', '双签领豆'].includes(title)) continue;
      waitDuration = waitDuration || _.last(subTitleName.match(/(\d+)s/));
      for (let i = times; i < maxTimes; i++) {
        const taskInfo = _.property('subTaskVOS')(await getTaskById(taskId));
        if (!taskInfo) continue;
        const [{taskToken}] = taskInfo;
        await doTask(taskToken, +waitDuration);
      }
    }

    await findBeanScene();

    async function doTask(taskToken, waitDuration) {
      const _do = (actionType = 0) => api.doFormBody('beanDoTask', {actionType, taskToken});
      await _do(waitDuration ? 1 : void 0);
      if (!waitDuration) return;
      await sleep(waitDuration);
      await _do();
    }

    async function findBeanScene() {
      return api.doFormBody('findBeanSceneNew', {
        'requestSource': 'normal',
        'babelChannel': 'ttt1',
      }).then(data => {
        const {curScene} = data.data || {};
        if (!curScene) return;
        const {growth, level, sceneLevelConfig: {growthEnd, beanNum}} = curScene;
        const msg = [
          `当前成长值: ${growth}`,
          `等级: ${level}`,
          `下一个目标为: ${growthEnd}, 将得到豆豆: ${beanNum}`,
        ];
        api.log(msg.join(', '));
      });
    }
  }
}

singleRun(BeanSmallBean).then();

module.exports = BeanSmallBean;
