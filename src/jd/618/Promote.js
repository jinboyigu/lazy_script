const Template = require('../base/template');

const {sleep, writeFileJSON, readFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const _ = require('lodash');
const {genParamsSign, convertHex} = require('../../lib/security');
const {getMoment} = require('../../lib/moment');

const indexUrl = 'https://wbbny.m.jd.com/pb/014710620/mTPLZGkAcayB5UvZ6uZCtL3M6ca/index.html?babelChannel=syxview&sid=50d1da03cda6a41d924acc93160a1a3w&un_area=19_1601_36953_50400#/pages/home/index/index';

const baseForm = {
  appid: 'signed_wh5',
  clientVersion: '11.4.4',
  client: 'apple',
};
const chlsjData = readFileJSON('./promote.chlsj', __dirname, []);

const maxEncryptTimes = 3;/*使用 3 次就失效*/
const encryptionList = _.flatten([
  ...chlsjData.map(o => {
    const text = _.get(o, 'request.body.text', '');
    if (!text) return;
    const searchParams = new URL(`http://test.cn?${text}`).searchParams;
    return {joyLog: searchParams.get('joylog'), xApiEidToken: searchParams.get('x-api-eid-token')};
  }).filter(v => v),
].map(v => Array(maxEncryptTimes).fill(v)));

class Promote extends Template {
  static scriptName = 'Promote';
  static scriptNameDesc = '拆快递';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static needInAppComplete1 = true;
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
    api.joyLogTimes = 0;
    _.get(chlsjData, '[0].request.header.headers').map(({name, value}) => {
      if (name === 'cookie') {
        // TODO 可能使用里面的 pt_key
        if (!value.match(/pt_key=|pt_pin=/)) {
          api.cookieInstance.set(value);
        }
      }
    });
    // 暂时不需要 h5st
    const needH5st = false;
    let paramsSign;
    if (needH5st) {
      paramsSign = genParamsSign({userAgent: api.options.headers['user-agent'], appId: '2a045'});
    }
    replaceObjectMethod(api, 'doFormBody', async ([functionId, body, signData, options]) => {
        if (['promote_collectScore', ''].includes(functionId)) {
          const t = getMoment().valueOf();
          options = options || {};
          if (needH5st) {
            const {h5st} = await paramsSign.sign({functionId, ...baseForm, t, body: convertHex(body)});
            _.merge(options, {form: {h5st}});
          }
          const {joyLog, xApiEidToken} = encryptionList.shift() || {};
          if (joyLog) {
            ++api.joyLogTimes;
            if (encryptionList.filter(o => o.joylog === joyLog).length === maxEncryptTimes - 1) {
              // 使用过一次就需更新原文件
              chlsjData.shift();
              writeFileJSON(chlsjData, './promote.chlsj', __dirname);
            }
          } else {
            // TODO 可能要停止执行
            console.log('joylog 数量不够了!!!');
          }
          _.merge(options, {
            form: {
              t,
              ...joyLog && {
                'x-api-eid-token': xApiEidToken,
                joylog: joyLog,
              },
            },
          });
        }
        return [functionId, body, signData, options];
      },
    );
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    let needStop = false;

    await handleDoTask();

    if (!needStop) {
      console.log(`${[api.getPin()]} 执行完毕`);
    }
    console.log(`joylog 加密次数: ${api.joyLogTimes}`);

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
          if (needStop) {
            doneTask = false;
            // TODO 需要正确 joylog 才行
            console.log(`${[api.getPin()]} 运行有异常, 请手动执行`);
            break;
          }
          if (times === maxTimes) break;
          await doTask(taskId, taskToken, waitDuration);
          times++;
        }
        if (needStop) break;
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
          if (data.code !== 0) {
            api.log(data.msg);
            needStop = true;
            return;
          }
          if (data.data.bizCode === 0) {
            doneTask = true;
          }
        });
        if (needStop) return;
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
