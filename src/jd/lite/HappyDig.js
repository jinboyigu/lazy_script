const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const _ = require('lodash');

const appid = 'activities_platform';
const linkId = 'Bn1VWXtvgTv5ewPoMR-X8A';
const origin = 'https://bnzf.jd.com';

class LiteHappyDig extends Template {
  static scriptName = 'LiteHappyDig';
  static scriptNameDesc = '欢乐淘金';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {linkId},
    appid,
    client: 'ios',
    clientVersion: '13.1.1',
  });
  static needInApp = false;
  static shareCodeUniqIteratee = o => o['inviter'];
  static doneShareTask = this.getNowHour() < 22;

  static apiOptions = {
    options: {
      uri: 'https://api.m.jd.com/api',
      headers: {
        origin,
        referer: `${origin}/?activityId=${linkId}`,
      },
    },
  };

  static async beforeRequest(api) {
    const self = this;

    this.injectEncryptH5st(api, {
      config: {
        happyDigHome: {appId: 'ce6c2'},
        happyDigHelp: {appId: '8dd95'},
        apDoTask: {appId: 'cd949'},
        happyDigDo: {appId: 'f7674'},
        superRedBagList: {appId: 'f2b1d'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;
    await self.beforeRequest(api);

    // 需要先消耗一波生命值, 不然可能会有上限
    await handlePlayGame();
    await handleDoShare();
    await handleDoTask();
    await handlePlayGame();

    if (self.isLastLoop()) {
      await handleExchange();
      await handleCash();
    }

    async function handlePlayGame(maxBlood = 1) {
      const homeData = await api.doGetBody('happyDigHome');
      const {roundList, curRound: round, blood} = _.get(homeData, 'data', {});
      if (!roundList) {
        api.log(`happyDigHome data ${homeData}`);
        return;
      }
      if (blood <= maxBlood) return;
      const targetRound = roundList.find(o => o.round === round);
      if (!targetRound) return api.log('找不到指定的round');
      const {chunks} = targetRound;
      const filterChunks = _.filter(chunks, o => !o.state);
      if (_.isEmpty(filterChunks)) return api.log(`当前${round}已经全部挖完`);
      // 随机获取哪个格
      const {rowIdx, colIdx} = filterChunks[_.random(filterChunks.length - 1)];
      await sleep(3);
      await api.doGetBody('happyDigDo', {round, rowIdx, colIdx}).then(data => {
        const chunk = _.get(data, 'data.chunk');
        if (!chunk) return api.log(data);
        const {type, value} = chunk;
        const msgList = [
          `[round:${round}]`,
        ];
        const typeName = {
          1: '优惠券',
          2: '红包',
          3: '现金',
          4: '炸弹',
        };
        const name = typeName[type];
        if (name) {
          msgList.push(`挖到${name} ${value || ''}`);
        } else {
          msgList.push(`挖到${JSON.stringify(chunk)}`);
        }
        api.log(msgList.join(' '));
      });
      return handlePlayGame(maxBlood);
    }

    async function handleDoShare() {
      if (self.doneShareTask) return;
      const {markedPin, inviteCode} = await api.doGetBody('happyDigHome').then(_.property('data')) || {};
      if (!markedPin) return;
      self.updateShareCodeFn({inviter: markedPin, inviteCode});
      // 只有一次助力机会
      const body = _.first(self.getShareCodeFn());
      if (!body) return;
      await api.doGetBody('happyDigHelp', body).then(data => {
        if (!data.success) return api.log(data.errMsg);
        api.log('助力成功');
      });
      await sleep(10);
    }

    async function handleExchange() {
      if (self.getNowHour() < 22) return;
      const {curRound: round, blood, manuallyExchanged} = await api.doGetBody('happyDigHome').then(_.property('data'));
      if (blood !== 1 || manuallyExchanged === 2) return;
      return api.doGetBody('happyDigExchange', {round});
    }

    async function handleDoTask(getTaskBlood = false) {
      const {data: taskList} = await api.doGetBody('apTaskList');
      const channel = '4';
      let blood = 0;
      for (const {
        id: taskId,
        taskShowTitle,
        taskType,
        taskSourceUrl: itemId,
        taskDoTimes: times,
        taskLimitTimes: maxTimes,
        configBaseList,
        taskFinished
      } of taskList) {
        if (taskFinished || taskShowTitle.match(/下单|购券|买一元/)) continue;
        blood += _.reduce(configBaseList.map(o => +o['awardGivenNumber']), (a, b) => a + b);
        if (getTaskBlood) continue;
        if (taskShowTitle.match(/玩一玩/) && maxTimes > 1) {
          await handleDoTaskDetail(taskType, taskId);
        } else {
          for (let i = times; i < maxTimes; i++) {
            await doTask({taskType, taskId, itemId});
          }
        }
      }

      return blood;

      async function doTask({taskType, taskId, itemId}) {
        await api.doGetBody('apDoTask', {
          taskType, taskId, itemId, checkVersion: false, channel,
        });
      }

      async function handleDoTaskDetail(taskType, taskId) {
        const {
          status: {finished},
          taskItemList,
        } = await api.doGetBody('apTaskDetail', {taskType, taskId, channel}).then(_.property('data'));
        if (finished) return;
        for (const {itemId} of taskItemList) {
          await doTask({taskType, taskId, itemId});
          await sleep(5);
        }
      }
    }

    async function handleCash() {
      /* TODO 暂时未用到 */
      return;
      await api.doGetBody('spring_reward_list', {
        'pageNum': 1,
        'pageSize': 10,
      }).then(async data => {
        const items = _.property('data.items')(data) || [];
        if (items.some(o => o['state'] === 1)) return;
        const cashes = items.filter(o => o['prizeType'] === 4 && o['state'] === 0);
        if (_.isEmpty(cashes)) return;
        // 一次只能同时提现一个
        for (const cash of cashes) {
          await apCashWithDraw(cash);
          await sleep(60 * 5);
        }
      });

      async function apCashWithDraw({id, poolBaseId, prizeGroupId, prizeBaseId, prizeType}) {
        return api.doFormBody('apCashWithDraw', {
          'businessSource': 'happyDiggerH5Cash',
          'base': {
            id, poolBaseId, prizeGroupId, prizeBaseId, prizeType,
            'business': 'happyDigger',
          },
        }).then(data => {
          const amount = _.get(data, 'data.record.amount');
          if (amount) {
            api.log(`正在提现${amount}`);
          } else {
            api.log(data.data);
          }
        });
      }
    }
  }
}

singleRun(LiteHappyDig).then();

module.exports = LiteHappyDig;
