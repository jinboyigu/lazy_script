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
      options: {},
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
      '10.21': ['31', '山东'],
      '10.22': ['皮革', '无邪'],
      '10.23': ['意大利'],
      '10.24': ['85'],
      '10.25': ['两'],
      '10.26': ['2'],
      '10.27': ['白开水'],
      '10.28': ['榴莲'],
      '10.29': ['3000'],
      '10.30': ['年轮'],
      '10.31': ['海阔天空'],
      '11.01': ['风浪越大鱼越贵！'],
      ...todayAnswers && {[getMoment().format('MM.DD')]: `${todayAnswers}`.split(',')},
    };
    await api.doFormBody('atop_channel_question_list').then(async data => {
      const taskList = _.get(data, 'data.floorData.items[0].dateGroupQuestionList');
      for (const {dateQuestionList} of taskList.reverse()) {
        for (const [i, {encryptAssignmentId, startDateStr, question, completionFlag}] of dateQuestionList.entries()) {
          if (completionFlag) continue;
          const answer = answers[startDateStr][i];
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
