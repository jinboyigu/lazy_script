const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, formatFullPath, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const CryptoJS = require('crypto-js');

const RSAEncrypt = {
  MD5KEY: 'e7c398ffcb2d4824b4d0a703e38eb0bb',
  NFMD5KEY: 'e9c398ffcb2d4824b4d0a703e38yffdd',
};

const indexUrl = 'https://prodev.m.jd.com/mall/active/eEcYM32eezJB7YX4SBihziJCiGV/index.html';

function encrypt(t, params = {}) {
  const array = _.filter(['id', 'taskType'].map(key => params[key]));
  array.push(t);
  array.push(RSAEncrypt.NFMD5KEY);
  return CryptoJS.MD5(array.join('')).toString();
}

class PointsGasStation extends Template {
  static scriptName = 'PointsGasStation';
  static scriptNameDesc = '积分加油站';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({});
  static times = 1;

  static apiOptions = {
    options: {
      uri: 'https://dwapp.jd.com',
      headers: {
        origin: new URL(indexUrl).origin,
        referer: indexUrl,
      },
    },
  };

  static isSuccess(data) {
    return data.code === 200;
  }

  static async beforeRequest(api) {
    const pathConfig = {
      user: [
        'dwSignInfo',
        'dwSign',
        {task: ['dwList', 'dwRecord', 'dwReceive']},
      ],
    };

    const encryptBody = body => {
      body = body || {};
      const t = getMoment().valueOf();
      const encStr = encrypt(t, body);
      _.assign(body, {t, encStr});
      return body;
    }

    replaceObjectMethod(api, 'doBodyPath', function ([functionId, body]) {
      body = encryptBody(body);
      functionId = formatFullPath(pathConfig, functionId);
      return [functionId, body];
    });
    replaceObjectMethod(api, 'doFormBody', async ([functionId, body, signData, options]) => {
      body = encryptBody(body);
      options = {
        uri: 'https://api.m.jd.com/api',
        form: {
          appid: 'h5-sep',
          client: 'm',
          clientVersion: '6.0.0',
        }
      };
      return [functionId, body, signData, options];
    });
  }

  static async doMain(api) {
    const self = this;

    await self.beforeRequest(api);
    const getData = _.property('data');

    await handleDoTask();
    await handleSign();

    async function handleSign() {
      let {signInfo: {signStatus}, totalNum} = await api.doBodyPath('dwSignInfo').then(getData);
      signStatus === 0 && await api.doFormBody('DATAWALLET_USER_SIGN').then(data => {
        totalNum = _.get(data, 'data.totalNum');
      });

      api.log(`当前积分: ${totalNum}`);
    }

    async function handleDoTask() {
      const taskList = await api.doFormBody('dwapp_task_dwList').then(getData);
      for (let {startDate, endDate, viewStatus, id, taskType} of taskList) {
        if (getMoment().isBefore(startDate) || getMoment().isAfter(endDate) || viewStatus === 1) continue;
        await api.doBodyPath('dwRecord', {
          id, taskType,
          'agentNum': 'm',
          'followChannelStatus': '',
        });
        await sleep(2);
        await api.doBodyPath('dwReceive', {id});
      }
    }
  }
}

singleRun(PointsGasStation).then();

module.exports = PointsGasStation;
