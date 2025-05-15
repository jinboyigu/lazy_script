const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, matchMiddle, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const JDJRValidator = require('../../lib/JDJRValidator');
const {getEnv} = require('../../lib/env');
const {formatPasteData} = require('../../lib/charles');

const reqSources = ['h5', 'weapp'];
const indexUrl = 'https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html';

class Joy extends Template {
  static scriptName = 'Joy';
  static scriptNameDesc = '宠汪汪';
  static shareCodeTaskList = [];
  static commonParamFn = () => {
    const reqSource = this.getReqSource();
    return {
      ...this.isInWx() ? {
        appid: 'choujiangyingyong',
        client: 'iOS 17.5',
        clientVersion: '8.0.50',
      } : {
        appid: 'jdchoujiang_h5',
        client: 'iOS',
        clientVersion: '15.1.20',
      },
      body: {reqSource},
    };
  };
  static times = 2;
  static keepIndependence = true;
  static concurrent = true;
  static concurrentOnceDelay = 10;
  static needInApp = false;

  static getReqSource() {
    return reqSources[this.currentTimes - 1];
  }

  static isInWx() {
    return this.getReqSource() === 'weapp';
  }

  static apiOptions() {
    return {
      options: this.isInWx() ? {
        uri: 'https://api.m.jd.com/',
        headers: {
          referer: 'https://servicewechat.com/wxccb5c536b0ecd1bf/892/page-frame.html',
          origin: 'https://h5.m.jd.com',
          'Lottery-Access-Signature': 'wxccb5c536b0ecd1bf1537237540544h79HlfU',
          LKYLToken: '1eaa2a7e31d5448b831433f82d1c4c9d',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003237) NetType/WIFI Language/zh_CN',
        },
      } : {
        uri: 'https://api.m.jd.com/api',
        headers: {
          referer: indexUrl,
          origin: 'https://h5.m.jd.com',
        },
      },
      async formatDataFn(data, options) {
        const self = this;
        const {errorCode, errorMessage} = data;
        if (errorCode === 'H0001' || (errorMessage || '').match('验证')) {
          return handleValidate();
        }

        async function handleValidate() {
          let validate;
          for (let i = 0; i < 5; i++) {
            try {
              validate = (await new JDJRValidator().run() || {}).validate;
            } catch (e) {
              console.log('JDJRValidator error:');
              console.log(e);
            }
            if (validate) break;
          }
          if (!validate) return Promise.resolve(data);
          options.qs.body = JSON.stringify(_.assign(JSON.parse(options.qs.body), {validate}));
          return Promise.resolve(await self.commonDo(options));
        }

        return data;
      },
    };
  }

  static apiExtends = {
    requestFnName: 'doGetBody',
  };

  static isSuccess(data) {
    return this._.property('success')(data);
  }

  static async beforeRequest(api) {
    const self = this;

    const originConfig = require('./originConfig.json');

    const config = {};
    Object.values(originConfig).forEach(o => {
      const appId = o[`bussinessId_${self.isInWx() ? 'WX' : 'H5'}`];
      config[o.functionId] = {appId};
    });

    self.injectEncryptH5st(api, {
      config,
      // signFromKEDAYA: true,
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const doGetBody = (functionId, body, options) => api.doGetBody(functionId, body, options);
    const doPostBody = (functionId, body, options) => api.doGetBody(functionId, body, {...options, method: 'POST'});

    if (!self.isInWx()) {
      await handleRace();
      await handleFeed();
    }
    if (self.getNowHour() >= 9) {
      await handleDoShare();
    }
    await handleDoTask();
    if (self.getNowHour() >= 12) {
      await handleHelpFriends();
    }
    if (self.isLastLoop()) {
      await log();
    }

    async function handleFeed() {
      const {petFood, lastFeedTime} = await doPostBody('petEnterRoom').then(_.property('data'));
      if (getMoment(lastFeedTime + 3 * 60 * 60 * 1000).isAfter(getMoment())) {
        return api.log('目前还无需喂养');
      }

      await _feed(+(self.getCurrentEnv('JD_JOY_FEED_INDEX') || (petFood >= 400 ? 3 : 2))); // 按需喂养

      // 喂食
      async function _feed(index = 0) {
        if (index < 0) return;
        const allFeedCount = [10, 20, 40, 80];
        const feedCount = allFeedCount[index];
        await api.doGetBody('feed', {feedCount}).then(data => {
          if (data.errorCode === 'feed_ok') {
            api.log(`喂食成功, 消耗${feedCount}g狗粮`);
            return;
          }
          if (data.errorCode === 'food_insufficient') {
            return _feed(--index);
          }
        });
      }
    }

    async function handleDoTask() {
      const data = await doPostBody('petGetPetTaskConfig', {
        'jztAdReq': {
          'imei': '',
          'aid': '',
          'opType': 1,
          'idfa': '',
          'openudid': 'c6993893af46e44aa14818543914768cf2509fbf',
          'userId': '122270672.1745890369106414970953.1745890369.1747282159.1747288793.135',
          'appInfo': '1170*2259^apple^iPhone13,3^17.5^15.1.20^wifi',
          'unionId': '',
          'openId': '',
          'locationInfo': '19-1601-36953',
          'media_siteset_id': 802,
        },
      });

      // 限时货架
      const deskGoods = [] || await doGetBody('getDeskGoodDetails').then(data => _.property('data.deskGoods')(data)) || [];

      const taskList = _.property('datas')(data) || [];
      if (!_.isEmpty(deskGoods)) {
        const deskGoodList = deskGoods.filter(o => !o.status).map(o => ({
          taskType: 'ScanDeskGood',
          sku: o.sku,
        }));
        taskList.push({
          joinedCount: 0,
          taskType: 'ScanDeskGood',
          deskGoodList: deskGoodList,
          taskChance: deskGoodList.length,
        });
      }
      for (let {
        taskChance: maxTimes,
        joinedCount: times,
        receiveStatus,
        waitDuration = 5,
        taskType,
        scanMarketList,
        followShops,
        followChannelList,
        followGoodList,
        deskGoodList,
        jztAdInfo,
        realTaskType,
      } of taskList) {
        // 收集狗粮
        // 包含三餐签到
        if (receiveStatus === 'unreceive') {
          await getFood(api, taskType);
          continue;
        }

        const enableTaskTypes = ['ScanDeskGood', 'ViewVideo', 'race', 'ScanMarket', 'FollowShop', 'FollowChannel', 'FollowGood', 'SignEveryDay'];
        if (!enableTaskTypes.includes(realTaskType || taskType)) continue;

        if (taskType === 'SignEveryDay') {
          const openId = getEnv('WX_OPENID', api.currentCookieIndex);
          // TODO 获取 code
          let code = '';
          const LKYLToken = '';
          const doSign = (loop = true) => {
            return api.doGetUrl(`https://like2.jd.com//api/turncard/sign?openId=${openId}&petSign=true&turnTableId=131&source=JDDOG&appId=wxccb5c536b0ecd1bf`, {
              method: 'POST',
              headers: {
                referer: 'https://servicewechat.com/wxccb5c536b0ecd1bf/659/page-frame.html',
                'App-Id': 'wxccb5c536b0ecd1bf',
                openId,
                'Lottery-Access-Signature': 'wxccb5c536b0ecd1bf1537237540544h79HlfU',
                LKYLToken,
              },
              body: {
                'fp': '',
                'eid': '2E31231AC103A5956C8B0934943733EB0FC1551B',
              },
            }).then(async data => {
              if (data.errorMessage) {
                api.log(`签到失败: ${data.errorMessage}`);
              } else {
                api.log(`签到成功`);
              }
              if (code && data.errorCode === 'L0001' && loop) {
                // 重新登录
                await api.commonDo({
                  url: 'https://api.m.jd.com/?functionId=userAdd',
                  form: formatPasteData(`appid\tchoujiangyingyong
                    functionId\tuserAdd
                    body\t{"code":"${code}","source":"UNKNOWN","type":"","channel":"","appId":"wxccb5c536b0ecd1bf"}
                    t\t1724205780819
                    forcebot\t
                    loginType\t2
                    uuid\t16651940518001682881757
                    eid\tjdd01w4AMZIAWBLEYMR54Z65WC3CL4TRPMCUWGIURJPV3K3JC7FQWGBC5MEV2ZYFSWF5AQ3CO2MRS5OBDBM3CJUTGEC77NIG4QOF5W3WSZZKXHVDAPFAPQTNUZEH4BW5LKTXDGQG
                    client\tios
                    osVersion\tiOS 17.5
                    screen\t390*844
                    d_brand\tiPhone
                    sdkVersion\t3.5.4
                    networkType\twifi
                  `),
                  headers: {
                    referer: 'https://servicewechat.com/wxccb5c536b0ecd1bf/892/page-frame.html',
                    'App-Id': 'wxccb5c536b0ecd1bf',
                    openId,
                    'Lottery-Access-Signature': 'wxccb5c536b0ecd1bf1537237540544h79HlfU',
                    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003239) NetType/WIFI Language/zh_CN',
                  },
                });
                return doSign(false);
              }
            });
          };
          if (LKYLToken && openId && self.isInWx()) {
            await doSign();
          }
          continue;
        }

        if (taskType === 'HelpFeed') {
          if (receiveStatus === 'chance_left') {
            let friendList = await getFriends(api);
            if (_.isEmpty(friendList)) friendList = await getFriends(api);
            const enableHelpList = friendList.filter(o => o['status'] === 'not_feed' && o['points']);
            let helpFeedTimes = 1;
            for (const {friendPin} of enableHelpList) {
              if (helpFeedTimes === 0) return;
              await doGetBody('helpFeed', {friendPin}).then(data => {
                if (!self.isSuccess(data)) return;
                helpFeedTimes--;
              });
            }
          }
          continue;
        }

        times = times || void 0;
        maxTimes = maxTimes || void 0;
        const sid = '66594924';

        let list = (scanMarketList || followShops || followChannelList || followGoodList || deskGoodList || []).filter(o => !o.status).map(o => {
          return _.assign({}, scanMarketList ? {
            marketLink: o.marketLinkH5,
            taskType,
          } : (followChannelList ? {
            channelId: o.channelId,
            taskType,
            sid,
          } : (followGoodList ? {sku: o.sku} : (deskGoodList ? o : {shopId: o.shopId}))));
        });

        if (jztAdInfo) {
          times = 0;
          maxTimes = 1;
          const sku = _.get(jztAdInfo, 'taskInfo.sku');
          const marketId = _.get(jztAdInfo, 'taskInfo.marketId');
          list = _.filter([
            sku && {
              sku, paramVO: {
                realTaskType,
                activityType: '1',
                targetUrl: jztAdInfo.targetUrl,
              },
            },
            marketId && {
              paramVO: {
                marketLink: marketId,
                marketId,
                taskType,
                sid,
                realTaskType,
                activityType: '1',
                targetUrl: jztAdInfo.targetUrl,
              },
            },
          ]);
        }

        if (taskType === 'ViewVideo') {
          list = [];
          for (let i = times || 0; i < maxTimes; i++) {
            list.push({taskType});
          }
        }

        if (_.isEmpty(list)) continue;

        for (const o of list) {
          const newO = _.assign({}, o);
          delete newO.taskType;
          if (!_.isEmpty(newO)) {
            await handleIconClick(taskType === 'ScanDeskGood' ? 'follow_good_desk' : _.snakeCase(taskType), _.values(newO)[0]);
          }
          const notScan = ['FollowShop', 'FollowGood', 'jzt_scan_market', 'jzt_follow_good'].includes(taskType);
          const functionId = notScan ? _.camelCase(taskType === 'jzt_scan_market' ? 'jzt_scan' : (taskType === 'FollowShop' ? 'followShopColor' : taskType)) : 'scan';
          await sleep(waitDuration);
          await doPostBody(functionId, o);
          if (++times >= maxTimes) {
            break;
          }
        }
      }

      async function handleIconClick(iconCode, linkAddr) {
        return doGetBody('clickIcon', {iconCode, linkAddr});
      }
    }

    async function handleDoShare() {
      const {pin} = await doPostBody('petEnterRoom').then(_.property('data'));
      self.updateShareCodeFn(pin);
      if (!self.isInWx()) {
        return;
      }
      const index = _.indexOf(self.shareCodeTaskList, pin);
      const shareCodes = [];
      for (let i = 1; i < 4; i++) {
        let nextIndex = index + i;
        if (nextIndex > self.shareCodeTaskList.length - 1) {
          nextIndex -= self.shareCodeTaskList.length;
        }
        shareCodes.push(self.shareCodeTaskList[nextIndex]);
      }
      for (const friendPin of shareCodes) {
        await doGetBody('helpFriend', {friendPin});
        await sleep();
        // 助力竞赛
        await doPostBody('help', {friendPin});
        await sleep();
      }
    }

    // 参赛
    async function handleRace() {
      const nowHour = self.getNowHour();
      if (nowHour < 9) return;
      await doGetBody('combatDetail', {help: false}).then(async data => {
        const {petRaceResult, winCoin} = _.property('data')(data) || {};
        if (petRaceResult === 'not_participate') {
          // 只参加双人赛跑
          await doGetBody('combatMatch', {teamLevel: 2}).then(data => {
            if (!self.isSuccess(data)) return;
            api.log('参赛成功');
          });
        } else if (petRaceResult === 'unreceive') {
          await doGetBody('combatReceive').then(data => {
            if (!self.isSuccess(data)) return api.log(data);
            api.log(`获取到积分: ${winCoin}`);
          });
          return handleRace();
        }
      });
    }

    // 去其他人房间
    async function handleHelpFriends() {
      const friends = await getFriends(api);
      for (const {friendPin, stealStatus} of friends) {
        if (stealStatus !== 'can_steal') continue;
        const body = {friendPin};
        const {stealFood, friendHomeCoin} = await doGetBody('enterFriendRoom', body).then(_.property('data'));
        // 偷食物
        if (stealFood) {
          await sleep(5);
          await doPostBody('getRandomFood', body).then(data => {
            if (data.errorCode.endsWith('_ok')) {
              api.log(`成功偷取狗粮: ${data.data}`);
            }
          });
        }
        // 偷积分
        if (friendHomeCoin) {
          await sleep(5);
          await doPostBody('getFriendCoin', body).then(data => {
            if (data.errorCode.endsWith('_ok')) {
              api.log(`成功偷取积分: ${data.data}`);
            }
          });
        }
        await sleep(5);
      }
    }

    async function log() {
      const data = await doPostBody('petEnterRoom');
      if (!self.isSuccess(data)) return;
      const {petCoin, petFood, petLevel} = data.data || {};
      api.log(`现有积分: ${petCoin}, 现有狗粮: ${petFood}, 宠物等级: ${petLevel}`);
    }
  }
}

async function getFood(api, taskType) {
  return api.doGetBody('getFood', {taskType}, {method: 'POST'}).then(data => {
    data.errorCode === 'received' && api.log(`获得${data.data}g狗粮`);
  });
}

async function getFriends(api) {
  return api.doGetBody('getH5Friends', {itemsPerPage: 20, currentPage: '1'}).then(data => data['datas'] || []);
}

singleRun(Joy, ['start', 'cron']).then();

module.exports = Joy;
