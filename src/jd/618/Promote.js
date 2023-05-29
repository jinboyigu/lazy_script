const Template = require('../base/template');

const {sleep, writeFileJSON, readFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const {genParamsSign, convertHex} = require('../../lib/security');
const {getMoment} = require('../../lib/moment');
const {getFormValue} = require('../../lib/charles');
const getJoyLogFromCharles = getFormValue.bind(0, 'joylog');

const maxEncryptTimes = 3;/*使用 3 次就失效*/
let charlesDataFilePath = '';
let allCharlesData = [];

class Promote extends Template {
  static scriptName = 'Promote';
  static scriptNameDesc = '拆快递';
  static dirname = __dirname;
  static shareCodeTaskList = [
    'ZXASTT018v_h1QhgY81XeKR6b1AFjRWnqS7zB55awQ',
    'ZXASTT0107a4gE0Ic8AFjRWnqS7zB55awQ',
    'ZXASTT019-akZNEhNqhCPQUKp84MFjRWnqS7zB55awQ',
    'ZXASTT0205KkcMWdhhwWERkeG8q5fFjRWnqS7zB55awQ',
  ];
  static needInAppComplete1 = true;
  static times = this.shareCodeTaskList.length ? 1 : 2; /* 设置好 shareCodeTaskList 之后就无需执行多次 */
  static keepIndependence = true;
  static commonParamFn = () => ({});
  static skipTaskIds = [1/*邀请好友助力*/, 14/*成功入会并浏览可得快递箱*/, 24/*浏览并下单可以得快递箱*/, 43/*绑卡成功可得快递箱*/, 44/*成功激活白条领立减券*/];

  // 需要被覆写
  static indexUrl = 'https://wbbny.m.jd.com/pb/014710620/mTPLZGkAcayB5UvZ6uZCtL3M6ca/index.html';
  static baseForm = {
    appid: 'signed_wh5',
    clientVersion: '11.4.4',
    client: 'apple',
  };

  // 是否加密数据
  static needEncrypt = true;

  // 自定义前缀
  static functionIdPrefix() { return this.scriptName.toLowerCase(); }

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: new URL(this.indexUrl).origin,
          referer: this.indexUrl,
        },
        form: this.baseForm,
      },
    };
  };

  static async beforeRequest(api) {
    const self = this;
    let encryptionList = [];
    if (self.needEncrypt) {
      if (self.isFirstLoop() && api.currentCookieIndex === 0) {
        // 初始化
        initCharlesData(self.functionIdPrefix());
      }
      const charlesData = allCharlesData.filter(o => JSON.stringify(o).match(`pt_pin=${api.getPin()}`));
      encryptionList = _.flatten(charlesData.map(o => ({
        joyLog: getJoyLogFromCharles(o),
        xApiEidToken: getFormValue('x-api-eid-token', o),
      })).filter(v => v.joyLog).map(v => Array(maxEncryptTimes).fill(v)));
      _.get(charlesData, '[0].request.header.headers', []).map(({name, value}) => {
        if (name === 'cookie') {
          api.cookieInstance.add(value);
        }
        if (name === 'user-agent') {
          api.options.headers['user-agent'] = value;
        }
      });
    }
    // 暂时不需要 h5st
    const needH5st = false;
    let paramsSign;
    if (needH5st) {
      paramsSign = genParamsSign({userAgent: api.options.headers['user-agent'], appId: '2a045'});
    }
    api.joyLogTimes = 0;
    replaceObjectMethod(api, 'doFormBody', async ([functionId, body, signData, options]) => {
      const oldFunctionId = functionId;
      if (['getTaskDetail', 'collectScore', 'getFeedDetail'].includes(oldFunctionId)) {
        functionId = `${self.functionIdPrefix()}_${oldFunctionId}`;
      }
      if (['collectScore'].includes(oldFunctionId) && self.needEncrypt) {
        const t = getMoment().valueOf();
        options = options || {};
        if (needH5st) {
          const {h5st} = await paramsSign.sign({functionId, ...self.baseForm, t, body: convertHex(body)});
          _.merge(options, {form: {h5st}});
        }
        const {joyLog, xApiEidToken} = encryptionList.shift() || {};
        if (joyLog) {
          ++api.joyLogTimes;
          if (encryptionList.filter(o => o.joyLog === joyLog).length === maxEncryptTimes - 1) {
            // 使用过一次就需更新原文件
            updateCharlesData(joyLog);
          }
        } else {
          throw new Error('joylog 数量不够, 请重新导入');
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
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask(true);

    console.log(`${[api.getPin()]} 执行完毕`);
    console.log(`joylog 加密次数: ${api.joyLogTimes}`);

    async function handleDoTask(isFirst) {
      let doneTask = false;
      const {taskVos, inviteId} = await api.doFormBody('getTaskDetail', {
        'taskId': '',
        'appSign': 3,
      }).then(_.property('data.result')) || {};
      if (isFirst) {
        const shareCodeTaskList = [].concat(self.shareCodeTaskList);
        _.remove(shareCodeTaskList, v => v === inviteId);
        self.updateShareCodeFn(inviteId);
        for (const inviteId of _.isEmpty(shareCodeTaskList) ? self.getShareCodeFn() : shareCodeTaskList) {
          await handleDoShareTask(inviteId);
        }
      }
      if (!taskVos) return;
      for (const task of taskVos) {
        let {taskId, status, times, maxTimes, waitDuration, subTitleName} = task;
        waitDuration = waitDuration || _.last(subTitleName.match(/(\d+)s/));
        if (self.skipTaskIds.includes(taskId) || status === 2) continue;
        let list = getList(task);
        if (_.isEmpty(list)) {
          const feedTask = await api.doFormBody('getFeedDetail', {taskId}).then(data => _.property('data.result.addProductVos[0]')(data) || _.property('data.result.taskVos[0]')(data));
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
        await collectScore({
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
          await collectScore({taskId, taskToken, 'actionType': 0});
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

    async function handleDoShareTask(inviteId) {
      await collectScore({
        inviteId,
        'actionType': 0,
      });
    }

    function collectScore(data) {
      return api.doFormBody('collectScore', data).then(data => {
        if (data.code !== 0) {
          api.log(data.msg);
          throw new Error(`${[api.getPin()]} 运行有异常, 请手动执行`);
        }
        return data;
      });
    }
  }
}

// helpers
function initCharlesData(name) {
  charlesDataFilePath = path.resolve(__dirname, `./${name}/all.json`);

  const dirPath = path.resolve(__dirname, name);
  const fileNames = fs.readdirSync(dirPath).filter(v => v.endsWith('.chlsj'));
  const defaultData = readFileJSON(charlesDataFilePath, void 0, []);
  if (_.isEmpty(fileNames)) {
    allCharlesData = defaultData;
    return;
  }

  const newData = _.flatten(fileNames.map(name => readFileJSON(name, dirPath, []))).filter(o => JSON.stringify(o).match('joylog='));
  // 移除旧文件
  fileNames.forEach(name => {
    fs.rmSync(path.resolve(dirPath, name));
  });

  writeFileJSON(allCharlesData = _.concat(defaultData, newData), charlesDataFilePath);
}

function updateCharlesData(removeJoyLog) {
  if (!charlesDataFilePath) return;
  const data = allCharlesData;
  removeJoyLog && _.remove(data, o => getJoyLogFromCharles(o) === removeJoyLog);
  writeFileJSON(data, charlesDataFilePath);
}

singleRun(Promote).then();

module.exports = Promote;
