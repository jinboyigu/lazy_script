const Template = require('../base/template');
const {updateEnv} = require('../../lib/env');
const {getEnv} = require('../../lib/env');
const {getMoment} = require('../../lib/moment');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');

const indexUrl = 'https://carry.m.jd.com/babelDiy/Zeus/3KSjXqQabiTuD1cJ28QskrpWoBKT/index.html';

class Fruit extends Template {
  static scriptName = 'Fruit';
  static scriptNameDesc = '东东农场';
  static times = 1;
  static needInAppComplete1 = true;
  static commonParamFn = () => ({
    appid: 'signed_wh5',
    client: 'apple',
    clientVersion: '12.3.1',
    body: {'version': 26, 'channel': 1, 'babelChannel': '522'},
    // 'x-api-eid-token': 'jdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMM3CHBK5YAAAAACER4GOXVSX6BVQX',
  });
  static apiOptions = {
    options: {
      headers: {
        referer: indexUrl,
      },
    },
    formatDataFn(data) {
      const amountLog = data => {
        if ('assistFriendList' in data) return;
        _.pick(data, ['amount', 'addEnergy', 'addWater']);
        const amount = _.first(_.values(_.pick(data, ['amount', 'addEnergy', 'addWater'])));
        amount && this.log(`获取的水滴数: ${amount}`);
      };
      amountLog(data);
      return data;
    },
  };

  static isSuccess(data) {
    return _.property('code')(data) === '0';
  }

  static async doApiInitForFarm(api, shareCode) {
    return api.doFormBody('initForFarm', {shareCode});
  }

  static async handleDoShare(api, shareCodes) {
    const self = this;
    for (const shareCode of shareCodes) {
      await sleep(2);
      await self.doApiInitForFarm(api, shareCode).then(data => {
        const {helpResult} = data;
        if (self.isSuccess(helpResult)) {
          api.log(`给 ${_.property('masterUserInfo.nickName')(helpResult) || 'unknown'} 助力成功`);
        }
      });
    }
  }

  static async beforeRequest(api) {
    // 从 https://storage.360buyimg.com/babel/00600381/1456188/production/dev/app.dee901ec.js 中获取
    const originConfig = {
      'initForFarm': '8a2af',
      'taskInitForFarm': 'fcb5a',
      'browseAdTaskForFarm': '53f09',
      'firstWaterTaskForFarm': '0cf1e',
      'waterFriendGotAwardForFarm': 'd08ff',
      'ddnc_getTreasureBoxAward': '67dfc',
      'totalWaterTaskForFarm': '102f5',
      'gotThreeMealForFarm': '57b30',
      'waterGoodForFarm': '0c010',
      'choiceGoodsForFarm': '5f4ca',
      'gotCouponForFarm': 'b1515',
      'gotStageAwardForFarm': '81591',
      'followVenderForBrand': '71547',
      'gotWaterGoalTaskForFarm': 'c901b',
      'gotNewUserTaskForFarm': 'de8f8',
      'orderTaskGotWaterForFarm': 'eed5c',
      'clockInForFarm': '32b94',
      'clockInFollowForFarm': '4a0b4',
      'waterFriendForFarm': '673a0',
      'awardFirstFriendForFarm': '9b655',
      'awardInviteFriendForFarm': '2b5ca',
      'awardCallOrInviteFriendForFarm': 'b0b03',
      'userMyCardForFarm': '86ba5',
      'getCallUserCardForFarm': '2ca57',
      'deleteFriendForFarm': 'eaf91',
      'gotLowFreqWaterForFarm': '8172b',
      'getFullCollectionReward': '5c767',
      'getOrderPayLotteryWater': 'ef089',
      'receiveStageEnergy': '15507',
      'exchangeGood': '52963',
      'farmAssistInit': '92354',
      'myCardInfoForFarm': '157b6',
      'gotPopFirstPurchaseTaskForFarm': 'd432f',
      'limitWaterInitForFarm': '6bdc2',
      'ddnc_surpriseModal': 'e81c1',
      'friendInitForFarm': 'a5a9c',
      'clockInInitForFarm': '08dc3',
      'guideTaskAward': '59bc4',
      'myExchangeInfoForFarm': '61809',
      'qryCompositeMaterials': 'a5243',
    };
    const config = {};
    Object.entries(originConfig).forEach(([key, appId]) => {
      config[key] = {appId};
    });
    this.injectEncryptH5st(api, {
      config,
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;
    const waterToMature = _.get(self._command, 0); // node src/jd/fruit/index.js start 0 1
    // 快速浇水默认关闭
    const enableFastWater = _.get(self._command, 1);
    // 收获兑换成红包
    let getHongBao = _.get(self._command, 2);
    _.isNil(getHongBao) && (getHongBao = waterToMature);
    // 强制浇水到收获
    const forceHarvest = _.get(self._command, 3);
    const waterTimes = 0;

    await self.beforeRequest(api);
    // 指定浇水次数
    if (waterTimes) await handleWaterGoodForFarm(waterTimes);
    // 浇水到成熟
    if (waterToMature) {
      api.clog('开始自动浇水至成熟');
      return logFarmInfo(true);
    }

    const {
      farmUserPro,
      funCollectionHasLimit,
      canGotNewUserToday,
    } = await handleInitForFarm();

    if (!farmUserPro) {
      return api.log('farm 请求出错');
    }

    const {shareCode: currentShareCode, treeState} = farmUserPro;

    // 新手任务获取水滴
    if (canGotNewUserToday) {
      await api.doFormBody('gotNewUserTaskForFarm');
    }

    patchShareCodeWithDefault();

    !funCollectionHasLimit && await getFullCollectionReward();
    await handleGetShareFinished();
    await handleDoTaskList();
    await handleDoShare();
    await handleClockIn();
    // 默认使用水滴翻倍卡
    await handleUseCard({type: 'doubleCard', maxTimes: Infinity});
    await logFarmInfo();

    // 增加默认助力码
    function patchShareCodeWithDefault() {
      if (getEnv('JD_FRUIT_DO_DEFAULT_SHARE_LAST') && !self.lastTimeInTheDay()) return;
      shareCodes = getShareCodesByDefault();
    }

    function getShareCodesByDefault(onlyDefault = false) {
      const defaultShareCodes = [
        '9675151b3f1645d2afea9afb44c44716',
        '2886e4326e104eecb117f7a32732cda3',
        '599767762e104f77a3980598fab16a99',
        '4569adc9a868457fb35c14e8db3572a1',
        '1e3d7edad2854ef8b24af27df550bf19',
      ];
      const otherDefaultShareCodes = defaultShareCodes.filter(code => code !== currentShareCode);
      if (onlyDefault) return otherDefaultShareCodes;
      return _.uniq(shareCodes.concat(otherDefaultShareCodes));
    }

    async function handleDoShare() {
      // 仅执行一次
      if (self.doneShareTask && !self.lastTimeInTheDay()) return;
      await self.handleDoShare(api, shareCodes);
    }

    async function handleUseCard(targetCards) {
      if (!targetCards) return;
      if (_.isString(targetCards)) {
        targetCards = {type: targetCards, maxTimes: 1};
      }
      targetCards = _.concat(targetCards);
      const cardData = await api.doFormBody('myCardInfoForFarm');
      const {cardInfos = []} = cardData;
      const result = [];
      for (const {type, maxTimes, returnLimit} of targetCards) {
        const card = cardInfos.find(o => o.type === type);
        if (type === 'doubleCard') {
          const totalEnergy = await handleInitForFarm().then(_.property('farmUserPro.totalEnergy'));
          if (totalEnergy && totalEnergy < 100) {
            api.log('当前水壶水滴低于100g, 请大于再进行使用翻倍卡');
            continue;
          }
        }
        if (!card) continue;
        const {useTimesInDay} = card;
        const limit = _.min([maxTimes || Infinity, cardData[type], useTimesInDay === -1 ? Infinity : useTimesInDay]);
        if (returnLimit) {
          result.push({type, limit});
          continue;
        }
        for (let i = 0; i < limit; i++) {
          const data = await api.doFormBody('userMyCardForFarm', {cardType: type, type: ''});
          if (!self.isSuccess(data)) break;
          await sleep(2);
        }
      }

      return result;
    }

    // 获取助力人数满的奖励
    async function handleGetShareFinished() {
      if (treeState === 2) return;
      const {amount = 0, assistFriendList, assistStageList} = await api.doFormBody('farmAssistInit');
      if (amount > 0) {
        await api.doFormBody('receiveStageEnergy');
        return handleGetShareFinished();
      }
      const assistStageStr = assistStageList.map(o => `${o['assistNum']}人(总计)/${o['waterEnergy']}水滴(每阶段)`).join(', ');
      api.log(`当前助力人数为: ${assistFriendList.length}, 收集奖励为${assistStageStr}`);
    }

    // 任务列表
    async function handleDoTaskList() {
      const taskData = await api.doFormBody('taskInitForFarm');
      const {
        // TODO orderInit 获取水滴
        // TODO treasureBoxInit 获取水滴
        signInit: {todaySigned},
        gotBrowseTaskAdInit: {userBrowseTaskAds},
        firstWaterInit: {firstWaterFinished},
        totalWaterTaskInit: {totalWaterTaskTimes, totalWaterTaskLimit, totalWaterTaskFinished},
      } = taskData;

      if (!todaySigned) {
        // TODO 接口不可用, 先屏蔽
        // await api.doFormBody('signForFarm');
      }

      if (!firstWaterFinished) {
        self.doneShareTask = false;
      }

      for (const {advertId, time, limit, hadFinishedTimes} of userBrowseTaskAds) {
        if (limit === hadFinishedTimes) continue;
        await handleBrowse(advertId, time || 6);
      }
      const wxForm = {channel: 2, babelChannel: 0};
      const wxTaskData = await api.doFormBody('taskInitForFarm', wxForm);
      for (const {
        advertId,
        time,
        limit,
        hadFinishedTimes
      } of _.get(wxTaskData, 'gotBrowseTaskAdInit.userBrowseTaskAds', [])) {
        if (limit === hadFinishedTimes) continue;
        await handleBrowse(advertId, time || 6, wxForm);
      }

      // 只有种植且未成熟才需要浇水
      if (treeState === 1) {
        const waterTimes = totalWaterTaskLimit - totalWaterTaskTimes;
        waterTimes > 0 && await handleWaterGoodForFarm(waterTimes);
        !firstWaterFinished && await api.doFormBody('firstWaterTaskForFarm');
        !totalWaterTaskFinished && await api.doFormBody('totalWaterTaskForFarm');
      }

      await handleWaterRain(taskData);
      await handleWaterFriendForFarm(taskData);
      await handleGotThreeMeal(taskData);

      async function handleBrowse(advertId, time, form) {
        await api.doFormBody('browseAdTaskForFarm', {advertId, type: time ? 0 : 1, ...form});
        if (!time) return;
        await sleep(time);
        await api.doFormBody('browseAdTaskForFarm', {advertId, type: 1, ...form});
      }

      // 采集雨滴, 一天两次
      async function handleWaterRain(taskData) {
        const {
          waterRainInit: {winTimes, config: {maxLimit}},
        } = taskData;
        if (winTimes < maxLimit) {
          await api.doFormBody('waterRainForFarm', {type: 1, hongBaoTimes: 100});
        }
      }

      // 给好友浇水
      async function handleWaterFriendForFarm(taskData) {
        let {
          waterFriendTaskInit: {waterFriendCountKey, waterFriendMax, waterFriendGotAward},
        } = taskData;
        if (waterFriendGotAward) return;
        // 优先给 default shareCode 浇水
        for (const shareCode of getShareCodesByDefault(true)) {
          await handleWaterFriend(shareCode);
        }

        if (waterFriendCountKey >= waterFriendMax) {
          await api.doFormBody('waterFriendGotAwardForFarm');
        }

        async function handleWaterFriend(shareCode) {
          if (waterFriendCountKey >= waterFriendMax) return;
          await sleep(2);
          return api.doFormBody('waterFriendForFarm', {shareCode}).then(data => {
            if (!self.isSuccess(data)) return;
            ++waterFriendCountKey;
          });
        }
      }

      // 三餐签到
      async function handleGotThreeMeal(taskData) {
        const {gotThreeMealInit: {f: threeMealFinished}} = taskData;
        !threeMealFinished && await api.doFormBody('gotThreeMealForFarm');
      }
    }

    // 连续签到
    async function handleClockIn(isLast = false) {
      await api.doFormBody('clockInInitForFarm').then(async data => {
        if (!self.isSuccess(data)) return;

        const {todaySigned, totalSigned, gotClockInGift, themes, signCardUseTimesLimit, signCard} = data;

        // 限时关注得水滴
        for (const {id, hadGot} of themes) {
          if (hadGot) continue;
          await api.doFormBody('clockInFollowForFarm', {id, type: 'theme', step: 1});
          await sleep(2);
          await api.doFormBody('clockInFollowForFarm', {id, type: 'theme', step: 2});
        }

        if (!todaySigned) {
          await api.doFormBody('clockInForFarm', {type: 1});
          return handleClockIn();
        }

        // 总签到获取水滴
        if (totalSigned === 7 && !gotClockInGift) {
          await api.doFormBody('clockInForFarm', {type: 2});
        }

        // TODO 这里的逻辑待确认. 先屏蔽
        if (0 && !signCardUseTimesLimit && signCard > 0 && !isLast) {
          await handleUseCard('signCard');
          return handleClockIn(true);
        }
      });
    }

    // 输出日志
    async function logFarmInfo(autoWater = false, fromCache) {
      return handleInitForFarm(fromCache).then(async data => {
        const {
          farmUserPro: {treeEnergy, treeTotalEnergy, totalEnergy, treeState},
          farmWinGoods,
          funCollectionHasLimit,
        } = data;
        if (treeState === 2) {
          if (getHongBao) {
            return api.doFormBody('gotCouponForFarm').then(data => {
              if (self.isSuccess(data)) {
                const {balance, endTime} = _.get(data, 'hongbaoResult.hongBao');
                api.logBoth(`收获成功, 获取红包: ${balance}, 过期时间为: ${getMoment(endTime).format()}`);
                return logFarmInfo(autoWater, false);
              } else {
                api.logBoth(`收获失败, 可能是今天已兑换过, data: ${JSON.stringify(data)}`);
              }
            });
          }
          return api.log('当前水果已经成熟, 请在app中兑换红包');
        }
        if (treeState === 3) {
          // 种植水果
          const targetGood = _.maxBy(farmWinGoods, 'prizeLevel');
          targetGood && await handleChoiceGoodsForFarm(targetGood.type);
          return logFarmInfo(autoWater, false);
        }
        const remainEnergy = treeTotalEnergy - treeEnergy;
        let msg = `需要总水滴数为: ${treeTotalEnergy}, 收成还差水滴数: ${remainEnergy}, 当前水滴数: ${totalEnergy}`;
        const canHarvest = remainEnergy <= totalEnergy;
        canHarvest && (msg += ', 可以收成了!!!');
        api.log(msg);
        if (autoWater && canHarvest) {
          if (!forceHarvest && 0/* TODO 找不到具体的判断逻辑 */) {
            return api.logBoth('今天已经兑换了, 请明天再来');
          }
          const maxTimes = Math.floor(remainEnergy / 100);
          const formatFinishTime = number => getMoment().add(number * 3.2, 's').format();
          if (maxTimes > 0 && enableFastWater) {
            const card = {type: 'fastCard', maxTimes, returnLimit: true};
            const [{limit}] = await handleUseCard(card);
            if (limit > 0) {
              delete card.returnLimit;
              api.logBoth(`使用快速浇水卡 ${limit} 次, 在 ${formatFinishTime(limit)} 之后可以完成`);
              await handleUseCard(card);
              return logFarmInfo(true, false);
            }
          }
          const waterTimes = remainEnergy / 10;
          api.logBoth(`完成需浇水 ${waterTimes} 次, 在 ${formatFinishTime(waterTimes)} 之后可以完成`);
          await handleWaterGoodForFarm(waterTimes);
          // 兑换红包
          return logFarmInfo(false, false);
        }
      });
    }

    // 点小鸭子
    async function getFullCollectionReward() {
      return api.doFormBody('getFullCollectionReward', {type: 2}).then(data => {
        if (self.isSuccess(data)) return getFullCollectionReward();
      });
    }

    async function handleWaterGoodForFarm(times) {
      if (process.env.JD_FRUIT_WATER_DISABLE) return;
      let successTimes = 0;
      for (let i = 0; i < times; i++) {
        await sleep(2);
        const canNext = await api.doFormBody('waterGoodForFarm').then(async data => {
          if (self.isSuccess(data)) {
            successTimes++;
            if ([1].includes(data.treeEnergy / 10)) {
              await api.doFormBody('gotStageAwardForFarm', {type: 1}).then(data => {
                api.log(`浇水阶段性奖励: ${JSON.stringify(data)}`);
                return data;
              });
            }
            return true;
          }
        });
        if (!canNext) return;
      }
      successTimes && api.log(`成功浇水 ${successTimes} 次`);
    }

    async function handleInitForFarm(fromCache = true) {
      if (fromCache && api.cacheFarm) {
        return api.cacheFarm;
      }
      let farmData = {};
      for (let i = 0; i < 3; i++) {
        farmData = await self.doApiInitForFarm(api);
        if (self.isSuccess(farmData)) {
          api.cacheFarm = farmData;
          break;
        }
        if (farmData.code === '6') {
          api.logBoth('太火爆了');
          throw '';
        }
        const is404 = farmData.code === '404';
        if (i === 1 && is404) break;
        await sleep(is404 ? 30 : 5);
      }
      if (_.get(farmData, 'farmUserPro.shareCode')) {
        updateEnv('JD_FRUIT_SELF_SHARE_CODE', _.get(farmData, 'farmUserPro.shareCode'), api.getPin());
      }
      if (_.get(farmData, 'todayGotWaterGoalTask.canPop')) {
        // 被水滴砸中
        await api.doFormBody('gotWaterGoalTaskForFarm', {type: 3});
      }
      return farmData;
    }

    // 种树
    async function handleChoiceGoodsForFarm(goodsType) {
      // 如果没有, 则种植最高等级的
      if (!goodsType) {
        const {prizeLevelList} = await api.doFormBody('getExchangeLevelList');
        const {hasPlant, currentGoodList} = _.maxBy(prizeLevelList, 'prizeLevel');
        if (hasPlant) return;
        goodsType = currentGoodList[0].goodsType;
      }
      return api.doFormBody('choiceGoodsForFarm', {
        'imageUrl': '',
        'nickName': '',
        'shareCode': '',
        goodsType,
        'type': '0',
      }).then(async data => {
        if (self.isSuccess(data)) {
          const {name, prizeLevel} = data.farmUserPro;
          api.log(`"${name}" 种植成功(等级: ${prizeLevel})`);
          if (data.choiceEnergy) {
            await api.doFormBody('gotStageAwardForFarm', {type: 4});
          }
        } else {
          api.log(JSON.stringify(data));
        }
      });
    }
  }
}

singleRun(Fruit).then();

module.exports = Fruit;
