const Template = require('./1');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const {getEnv} = require('../../lib/env');

class Fruit1Wheels extends Template {
  static scriptName = 'Fruit1Wheels';
  static scriptNameDesc = '东东农场(新)-转盘';
  static dirname = __dirname;
  static times = 1;

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleWheels();

    // 转盘抽奖
    async function handleWheels() {
      const doFormBody = (functionId, body) => api.doFormBody(functionId, _.assign({'linkId': 'VssYBUKJOen7HZXpC8dRFA'}, body), {
        appid: 'activities_platform',
        client: 'ios',
      }, {
        headers: {
          origin: 'https://lotterydraw-new.jd.com',
          'x-referer-page': 'https://lotterydraw-new.jd.com/',
          referer: 'https://lotterydraw-new.jd.com/?id=VssYBUKJOen7HZXpC8dRFA',
        },
      });
      const taskList = await doFormBody('apTaskList').then(_.property('data')) || [];
      for (const {taskType, id: taskId, taskSourceUrl, taskFinished, taskDoTimes, taskLimitTimes} of taskList) {
        if (taskFinished || !taskSourceUrl) continue;
        for (let i = taskDoTimes; i < taskLimitTimes; i++) {
          await doFormBody('apsDoTask', {
            taskType,
            taskId,
            'channel': 4,
            'checkVersion': true,
            itemId: taskSourceUrl,
            'cityId': '1601', 'provinceId': '19', 'countyId': '36953',
          });
          await sleep(3);
        }
      }

      const lotteryChances = await doFormBody('wheelsHome').then(data => {
        console.log(data);
        return _.property(data, 'data.lotteryChances');
      }) || 0;
      for (let i = 0; i < lotteryChances; i++) {
        const stop = await doFormBody('wheelsLottery').then(data => {
          if (data.success) {
            api.log(`抽奖获得: ${data.data.prizeCode}`);
          } else if (data.errMsg) {
            api.log(`抽奖失败: ${data.errMsg}`);
          } else {
            return true;
          }
        });
        if (stop) break;
        await sleep(5);
      }
    }
  }
}

singleRun(Fruit1Wheels).then();

module.exports = Fruit1Wheels;
