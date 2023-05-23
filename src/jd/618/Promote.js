const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const _ = require('lodash');
const {genParamsSign, convertHex} = require('../../lib/security');
const {getMoment} = require('../../lib/moment');

const baseForm = {
  appid: 'signed_wh5',
  clientVersion: '11.4.4',
  client: 'apple',
};
const appid = 'signed_wh5';

class Promote extends Template {
  static scriptName = 'Promote';
  static scriptNameDesc = 'Promote';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static needInAppComplete = true;
  static times = 1;
  static commonParamFn = () => ({});
  static skipTaskIds = [1/*邀请好友助力*/, 14/*成功入会并浏览可得快递箱*/, 24/*浏览并下单可以得快递箱*/, 44/*成功激活白条领立减券*/];

  static apiOptions = {
    options: {
      headers: {
        origin: 'https://wbbny.m.jd.com',
        referer: 'https://wbbny.m.jd.com/',
      },
      form: baseForm,
    },
  };

  static async beforeRequest(api) {
    const paramsSign = genParamsSign({userAgent: api.options.headers['user-agent'], appId: '2a045'});
    replaceObjectMethod(api, 'doFormBody', async ([functionId, body, signData, options]) => {
      const t = getMoment().valueOf();
      if (['promote_collectScore', ''].includes(functionId)) {
        const {h5st} = await paramsSign.sign({functionId, ...baseForm, t, body: convertHex(body)});
        options = options || {};
        _.merge(options, {form: {h5st, t}});
      }
      return [functionId, body, signData, options];
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();

    async function handleDoTask() {
      let doneTask = false;
      const {taskVos} = await api.doFormBody('promote_getTaskDetail', {
        'taskId': '',
        'appSign': 3,
      }).then(_.property('data.result')) || {};
      if (!taskVos) return;
      for (const task of taskVos) {
        let {taskId, status, times, maxTimes, waitDuration, subTitleName} = task;
        waitDuration = waitDuration || _.last(subTitleName.match(/(\d+)s/));
        if (self.skipTaskIds.includes(taskId) || status === 2) continue;
        let list = getList(task);
        if (_.isEmpty(list)) {
          const feedTask = await api.doFormBody('promote_getFeedDetail', {taskId}).then(data => _.property('data.result.addProductVos[0]')(data) || _.property('data.result.taskVos[0]')(data));
          list = getList(feedTask);
        }
        if (taskId === 28) {
          list.forEach(o => {
            o.status = 1;
          });
        }
        list = list.filter(o => o.status === 1);
        for (const {taskToken} of list) {
          if (times === maxTimes) break;
          await doTask(taskId, taskToken, waitDuration);
          times++;
        }
        if (doneTask) {
          return handleDoTask();
        }
      }

      async function doTask(taskId, taskToken, waitDuration) {
        await api.doFormBody('promote_collectScore', {
          taskId,
          taskToken,
          'actionType': waitDuration ? 1 : 0,
        }).then(data => {
          if (data.data.bizCode === 0) {
            doneTask = true;
          }
        });
        if (waitDuration) {
          await sleep(waitDuration);
          await api.doFormBody('promote_collectScore', {taskId, taskToken, 'actionType': 0});
        }
      }

      function getList(object) {
        object = object || {};
        let taskList = [];
        for (const key in object) {
          if (key.match(/Vo(s)?$/) && key !== 'scoreRuleVos') {
            taskList = [].concat(object[key]);
            break;
          }
        }
        return taskList;
      }
    }
  }
}

singleRun(Promote).then();

module.exports = Promote;
