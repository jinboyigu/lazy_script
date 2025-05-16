const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');

class PlantBean extends Template {
  static scriptName = 'PlantBean';
  static scriptNameDesc = '种豆得豆';
  static shareCodeTaskList = [];
  static times = 2;
  static concurrent = false;
  static needInApp = false;
  static defaultShareCodes = [
    'i7zarrja6jbtvgu2smlqd24e7y3h7wlwy7o5jii',
    'hxpwjlakoy4pxmtejjqf4gpvke',
  ];
  static commonParamFn = () => ({
    appid: 'signed_wh5',
    body: {
      'channel': 'baibaoxiang',
      'monitor_source': 'plant_m_plant_index',
      'monitor_refer': '',
      'version': '9.2.4.5',
    },
  });

  static apiOptions = {
    options: {
      frequencyLimit: {max: 4},
      repeatFn: async data => {
        if (data.code === '413' || _.get(data, 'data.nutrState') === '5') {
          await sleep(5);
          return true;
        }
      },
      headers: {
        referer: 'https://plantearth.m.jd.com/',
      },
    },
  };

  static isSuccess(data) {
    return _.property('code')(data) === '0';
  };

  static async beforeRequest(api) {
    const monitorReferConfig = {
      plantBeanIndex: '',
      shopTaskList: 'plant_shopList',
      collectHistoryByFriend: 'collectHistoryByFriend',
      shopNutrientsTask: 'plant_shopNutrientsTask',
      productNutrientsTask: 'plant_productNutrientsTask',
      productTaskList: 'plant_productTaskList',
      plantFriendList: 'plantFriendList',
      collectUserNutr: 'collectUserNutr',
      cultureBean: 'plant_index',
      receivedBean: 'receivedBean',
    };
    this.injectEncryptH5st(api, {
      config: {
        plantBeanIndex: {appId: 'd246a'},
        cultureBean: {appId: '6a216'},
        receiveNutrients: {appId: 'b56b8'},
        receiveNutrientsTask: {appId: 'd22ac'},
        plantChannelNutrientsTask: {appId: '2424e'},
        shopNutrientsTask: {appId: '19c88'},
        productTaskList: {appId: '7351b'},
        productNutrientsTask: {appId: 'a4e2d'},
        collectUserNutr: {appId: '14357'},
      },
      signFromSecurity: true,
      beforeEncryptFn: (functionId, form) => {
        if (functionId in monitorReferConfig) {
          form.body = {monitor_refer: monitorReferConfig[functionId], ...form.body};
        }
        return form;
      },
    });
  }


  static async handleUpdateCurrentShareCode(api) {
    const self = this;

    const shareUrl = await api.doFormBody('plantBeanIndex').then(data => _.get(data, 'data.jwordShareInfo.shareUrl'));
    if (shareUrl) {
      self.updateShareCodeFn(new URL(shareUrl).searchParams.get('plantUuid'));
    }
  }

  static async handleDoShare(api) {
    const self = this;

    for (const plantUuid of self.getShareCodeFn()) {
      await api.doFormBody('plantBeanIndex', {plantUuid}).then(data => {
        const msg = _.get(data, 'data.helpShareRes.promptText', '失败');
        api.log(`[${plantUuid}] 助力结果: ${msg}`);
      });
    }
  }

  static apiNamesFn() {
    const self = this;

    return {
      // 获取任务列表
      getTaskList: {
        name: 'plantBeanIndex',
        successFn: async (data, api) => {
          // writeFileJSON(data, 'plantBeanIndex.json', __dirname);

          if (!self.isSuccess(data)) return [];

          const result = [];

          const taskList = _.property('data.taskList')(data) || [];
          // self.isFirstLoop() && self.firstTimeInTheDay() && taskList.push({
          //   taskType: 7,
          //   taskName: '金融双签',
          //   totalNum: 1,
          //   gainedNum: 0,
          // });
          for (let {
            isFinished: status,
            taskType, taskName,
            totalNum: maxTimes,
            gainedNum: times,
            waitDuration,
          } of taskList) {
            if (status === 1 || [1/*每日签到*/, 2/*邀请好友*/].includes(taskType) || ['好友助力', '评价商品', '免费水果'/* TODO 后续看下如何完成*/].includes(taskName)) continue;

            maxTimes = +maxTimes;
            times = +times;
            let list = [];
            const option = {maxTimes, times, waitDuration};
            const itemFinishedFn = o => _.property('taskState')(o) === '2';
            const taskConfig = [
              // 浏览店铺
              [3, 'shopTaskList', ({data}) => _.filter(_.concat(data.goodShopList, data.moreShopList), itemFinishedFn).map(o => _.pick(o, ['shopId', 'shopTaskId'])), 'shopNutrientsTask'],
              // 挑选商品
              [5, 'productTaskList', ({data}) => _.filter(_.filter(data.productInfoList).map(array => array && array[1]), itemFinishedFn).map(o => _.pick(o, ['skuId', 'productTaskId'])), 'productNutrientsTask'],
              // 关注频道
              [10, 'plantChannelTaskList', ({data}) => _.filter(_.concat(data.goodChannelList || [], data.normalChannelList), itemFinishedFn).map(o => _.pick(o, ['channelId', 'channelTaskId'])), 'plantChannelNutrientsTask'],
            ].find(o => o[0] === taskType);

            if (taskConfig) {
              const [_taskType, listFunctionId, listFn, taskFunctionId] = taskConfig;
              list = await api.doFormBody(listFunctionId).then(listFn);
              _.assign(option, {
                firstFn: async o => {
                  const isSuccess = api.doFormBody(taskFunctionId, o).then(data => ({isSuccess: _.property('data.nutrState')(data) === '1'}));
                  if (_taskType === 3) {
                    await api.delShopFavByTimes(1);
                  } else if (_taskType === 5) {
                    await api.delShopFavByTimes(1);
                  }
                  return isSuccess;
                },
              });
            } else {
              // 其他任务
              _.assign(option, {
                firstFn: async o => {
                  await api.doFormBody('receiveNutrientsTask', {awardType: `${taskType}`});
                },
              });
            }

            result.push({list, option});
          }

          return result;
        },
      },
      doRedeem: {
        name: 'plantBeanIndex',
        successFn: async (data, api) => {
          if (!self.isSuccess(data)) return false;
          const {roundId, bubbleInfos = [], growth} = getCurrentRound(data.data);
          let stop = false;
          for (const {nutrientsType} of bubbleInfos) {
            await api.doFormBody('cultureBean', {roundId, nutrientsType}).then(data => {
              if (!self.isSuccess(data)) {
                stop = true;
              }
            });
          }
          stop = stop || _.isEmpty(bubbleInfos);
          if (stop) {
            api.log(`成长值为: ${growth}`);
            return false;
          }
        },
        repeat: true,
      },
    };
  };

  static async doCron(api) {
    const self = this;

    await self.beforeRequest(api);

    const plantBeanIndexData = await api.doFormBody('plantBeanIndex');
    const data = _.get(plantBeanIndexData, 'data', {});
    const {roundList = []} = data;

    if (_.isEmpty(roundList)) {
      return api.log(plantBeanIndexData);
    }

    const {roundId} = getCurrentRound(data);

    if (!roundId) {
      return api.log('获取 roundId 出错');
    }

    // 收集定时豆液
    if (+_.property('timeNutrientsRes.nutrCount')(data) > 0) {
      await handleReceiveNutrients();
    }

    // 获取豆豆
    if (self.getNowHour() >= 10) {
      for (const {roundId, awardState, dateDesc} of roundList) {
        if (awardState !== '5') continue;
        await api.doFormBody('receivedBean', {roundId}).then(data => api.log(`${dateDesc} 获得的豆豆: ${_.property('data.awardBean')(data)}`));
      }
    }
    if (self.getNowHour() >= 22) {
      // 协助朋友采集豆液
      await collectFriendBean();
      // 收集本身豆液
      await self.doApi(api, 'doRedeem');
    }

    async function collectFriendBean() {
      const friendInfoList = await api.doFormBody('plantFriendList', {'pageNum': '1'}).then(data => _.property('data.friendInfoList')(data).filter(o => o.nutrCount));
      if (_.isEmpty(friendInfoList)) return;
      for (const {paradiseUuid} of friendInfoList) {
        const loop = await api.doFormBody('collectUserNutr', {
          roundId,
          paradiseUuid,
        }).then(data => _.property('collectResult')(data) === '1');
        if (!loop) break;
      }
    }

    async function handleReceiveNutrients(maxTimes = 2) {
      if (maxTimes <= 0) return;
      return api.doFormBody('receiveNutrients', {roundId}).then(data => {
        if (!self.isSuccess(data)) return handleReceiveNutrients(--maxTimes);
        const nutrients = _.get(data, 'data.nutrients');
        nutrients && api.log(`收集到营养液: ${nutrients}`);
      });
    }
  }
}

function getCurrentRound(data) {
  const {roundList = []} = data;
  return roundList.find(o => o['roundState'] === '2') || {};
}

singleRun(PlantBean, ['start', 'cron']).then();

module.exports = PlantBean;
