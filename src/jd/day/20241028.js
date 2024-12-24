const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Day20241028 extends Template {
  static scriptName = 'Day20241028';
  static scriptNameDesc = '答题抽超市卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'jd-super-market',
    client: 'm',
    body: {
      'bizCode': 'cn_retail_jdsupermarket',
      'scenario': 'free_order',
      'babelActivityId': '01718639',
      'babelChannel': 'ttt2',
      'isJdApp': '1',
      'isWx': '0',
    },
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 1;
  static needOriginProMd = true;

  static apiOptions() {
    return {
      options: {
        frequencyLimit: {max: 4},
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        atop_channel_question_list: {appId: '35fa0'},
        atop_channel_submit_answer: {appId: '35fa0'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const todayAnswers = _.first(self._command);

    // 需手动更新答案
    const answers = {
      '12.19': '想',
      '12.20': ['五', '北斗'],
      '12.21': ['小狗'],
      '12.22': ['青花瓷'],
      '12.23': ['兰亭序'],
      '12.24': ['2'],
      ...todayAnswers && {[getMoment().format('MM.DD')]: `${todayAnswers}`.split(',')},
    };
    await api.doFormBody('atop_channel_question_list').then(async data => {
      const taskList = _.get(data, 'data.floorData.items[0].dateGroupQuestionList');
      for (const {dateQuestionList} of taskList.reverse()) {
        for (const [i, {encryptAssignmentId, startDateStr, question, completionFlag}] of dateQuestionList.entries()) {
          if (completionFlag) continue;
          const answer = _.concat(answers[startDateStr])[i];
          if (!answer) return api.clog(`${question}(${startDateStr}) 当前无答案!`);
          await api.doFormBody('atop_channel_submit_answer', {encryptAssignmentId, answer}).then(data => {
            let msg = `${question}(${startDateStr}) ${data.message}`;
            if (data.success) {
              const {rewardType, hongbaoAmount} = _.get(data, 'data.interactiveRewardVO');
              msg += `, 获得 ${rewardType ? rewardType === 35 ? `超市卡: ${hongbaoAmount}` : '优惠券' : '空'}`;
            }
            api.logBoth(msg);
          });
          await sleep(2);
        }
      }
    });
  }
}

singleRun(Day20241028).then();

module.exports = Day20241028;
