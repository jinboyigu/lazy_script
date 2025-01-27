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
      ...todayAnswers && {[getMoment().format('MM.DD')]: `${todayAnswers}`.split(',')},
    };

    // 往期答案
    // https://kurl03.cn/7MR3UB
    const getAnswer = str => str.split('\n').map(v => v.trim()).filter(v => v).map(v => v.replace('：', ':').split('答案')[1].replace(/^:/, '').trim()).reverse();
    const answersList = {
      1: [
        '东海龙王',
        '风火轮',
        '翠果',
        '一丈红',
        '326',
        '枣泥',
        '宋',
        '小甜甜',
        '牛夫人',
        '蝎子',
        '青蛇',
        '2',
        '浙江',
        '江苏', '杭州', '雄黄', '卓傲', '蛇形', '大兴安岭', '河南', '风', '灶',
        '蛇',
        '4',
        '虎',
        '羊皮',
        '桃',
      ],
    };
    const format = v => +v < 10 ? `0${v}` : v;
    _.forEach(answersList, (array, month) => {
      array.forEach((v, i) => {
        answers[`${format(month)}.${format(i + 1)}`] = v;
      });
    });

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
