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
    let fp = '';
    let appId = '';
    let needH5st = false;
    if (self.needEncrypt) {
      if (self.isFirstLoop() && api.currentCookieIndex === 0) {
        // 初始化
        initCharlesData(self.functionIdPrefix());
      }
      const charlesData = allCharlesData.filter(o => JSON.stringify(o).match(`pt_pin=${api.getPin()}`));
      encryptionList = _.flatten(charlesData.map(o => ({
        joyLog: getJoyLogFromCharles(o),
        xApiEidToken: getFormValue('x-api-eid-token', o),
        headers: o.request.header.headers,
      })).filter(v => v.joyLog).map(v => Array(maxEncryptTimes).fill(v)));
      if (charlesData[0]) {
        needH5st = true;
        const h5stList = getFormValue('h5st', charlesData[0]).split(';');
        fp = h5stList[1];
        appId = h5stList[2];
      }
    }
    let paramsSign;
    if (needH5st) {
      paramsSign = genParamsSign({
        userAgent: api.options.headers['user-agent'],
        appId,
        fp,
      });
    }
    api.joyLogTimes = 0;
    replaceObjectMethod(api, 'doFormBody', async ([functionId, body, signData, options]) => {
      const oldFunctionId = functionId;
      const encryptFunctions = ['collectScore', 'grade_award'];
      if ([...encryptFunctions, 'getTaskDetail', 'getFeedDetail', 'floating_layer'].includes(oldFunctionId)) {
        functionId = `${self.functionIdPrefix()}_${oldFunctionId}`;
      }
      if (encryptFunctions.includes(oldFunctionId) && self.needEncrypt) {
        const t = getMoment().valueOf();
        options = options || {};
        if (needH5st) {
          const {h5st} = await paramsSign.sign({functionId, ...self.baseForm, t, body: convertHex(body)});
          _.merge(options, {form: {h5st}});
        }
        const {joyLog, xApiEidToken, headers} = encryptionList.shift() || {};
        if (joyLog) {
          headers.forEach(({name, value}) => {
            if (name === 'cookie') {
              api.cookieInstance.add(value);
            }
            if (['user-agent', 'x-referer-page', 'x-rp-client', 'referer'].includes(name)) {
              api.options.headers[name] = value;
            }
          });
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

    const userInfo = {
      score: 0,
    };

    await handleDoTask(false, 3/*jd app*/);
    await handleDoTask(false, 2/*小程序*/);
    await handleDoTask(false, 4/*jr app*/);
    await handleDoTask(true/*助力按需运行*/, 3/*jd app*/);

    // 按需运行
    // await handleReward();

    api.log(`current score: ${userInfo.score}`);
    console.log(`${[api.getPin()]} 执行完毕`);
    console.log(`joylog 加密次数: ${api.joyLogTimes}`);

    async function handleDoTask(isFirst, appSign = 3) {
      let doneTask = false;
      const {taskVos, inviteId, parentUserScore} = await api.doFormBody('getTaskDetail', {
        'taskId': '',
        appSign,
      }).then(_.property('data.result')) || {};
      userInfo.score = parentUserScore;
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
        if ([23/*早起打卡*/, 25/*去首页浮层进入活动*/, 28/*去品牌墙浏览更多权益*/].includes(taskId)) {
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
          return handleDoTask(void 0, appSign);
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
      return api.doFormBody('collectScore', data).then(async result => {
        if (result.code !== 0) {
          // 忽略报错, 重复调用
          api.log(result.msg);
          return collectScore(data);
          throw new Error(`${[api.getPin()]} 运行有异常, 请手动执行`);
        }
        return result;
      });
    }

    async function handleReward() {
      const years = [];
      for (let i = 2004; i <= 2023; i++) {
        years.push(i);
      }
      for (const sceneId of years) {
        await sleep(5);
        const {
          gradeList,
          sceneList,/*years*/
        } = await api.doFormBody('floating_layer', {sceneId}).then(_.property('data.result')) || {};
        for (const {id: gradeId, status} of gradeList) {
          if (status === 1) {
            await sleep(2);
            await api.doFormBody('grade_award', {gradeId});
          }
        }
      }
    }
  }
}

// helpers
function initCharlesData(name) {
  charlesDataFilePath = path.resolve(__dirname, `./${name}/all.json`);

  const dirPath = path.resolve(__dirname, name);
  !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
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
