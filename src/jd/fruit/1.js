const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const {getEnv} = require('../../lib/env');

// 等级
const levelWaters = [
  0,
  0,
  [0, 60, 300, 400, 12500],
  [0, 60, 300, 400, 20000],
];

class Fruit1 extends Template {
  static scriptName = 'Fruit1';
  static scriptNameDesc = '东东农场(新)';
  static dirname = __dirname;
  static shareCodeTaskList = [
    'ycXdOf_k-w7OCRBTc8CtQiYT5DyYnQ',
    'ycXdOa2yrl-UDRM9GMrtRA',
    'ycXdObm1l3ieXEkWIqjxcAzm3sG1MT8',
    'ycXdOaS1kn2xcGQDKa_0X1nw7Ccqm1No',
    'ycXdOaS1kgqcCB8EeZygeZENbtC109cBtg',
  ];
  static commonParamFn = () => ({
    appid: 'signed_wh5',
    client: 'apple',
    clientVersion: '13.6.2',
    'x-api-eid-token' : 'jdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMS3MH5UIAAAAAADBKH7G44EP47M4X',
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 2;

  static apiOptions() {
    return {
      options: {
        repeatFn: async data => {
          if ([405].includes(+data.code)) {
            await sleep(5);
            return true;
          }
        },
        headers: {
          'x-referer-page': 'https://h5.m.jd.com/pb/015686010/Bc9WX7MpCW7nW9QjZ5N3fFeJXMH/index.html',
          referer: 'https://h5.m.jd.com/',
          'x-rp-client': 'h5_1.0.0',
          'request-from': 'native',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    const configs = [
      {functionId: 'qryCompositeMaterials', businessId: 'a5243'},
      {functionId: 'farm_home', businessId: 'c57f6'},
      {functionId: 'farm_prize_exchange_board', businessId: '39a66'},
      {functionId: 'farm_task_receive_award', businessId: '33e0f'},
      {functionId: 'farm_assist_receive_award', businessId: 'c4332'},
      {functionId: 'farm_orderPay_receive_award', businessId: 'ee382'},
      {functionId: 'farm_rain_round_icon', businessId: 'c57f6'},
      'farm_water', 'farm_do_task', 'farm_assist',
    ];
    const config = {
      apsDoTask: {appId: '54ed7'},
      wheelsHome: {appId: 'c06b7'},
      wheelsLottery: {appId: 'bd6c8'},
      dongDongFarmSignHome: {appId: 'deba1'},
      dongDongFarmSignIn: {appId: '65f9d'},
      farm_rain_round_icon: {appId: 'c57f6'},
      farm_rain_page: {appId: 'c57f6'},
      farm_rain_reward: {appId: 'c57f6'},
    };
    for (const item of configs) {
      const {functionId, businessId: appId} = _.isString(item) ? {functionId: item, businessId: '28981'} : item;
      config[functionId] = {appId};
    }
    self.injectEncryptH5st(api, {
      config,
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    self.initShareCodeTaskList(shareCodes || []);
    await self.beforeRequest(api);
    const doFormBody = (functionId, body) => api.doFormBody(functionId, _.assign({
      version: 7,
      channelParam: '1',
    }, body));

    const waterToMature = _.get(self._command, 0);
    const waterTimes = _.get(self._command, 1);

    const {currentCookieIndex} = api;
    let plantId = getEnv('JD_FRUIT1_PLANT_SKU_ID', currentCookieIndex);
    let {
      treeFullStage,
      treeCurrentState,
      skuName,
      bottleWater,
      farmHomeShare: {inviteCode},
    } = await doFormBody('farm_home').then(_.property('data.result'));
    self.isFirstLoop() && self.updateShareCodeFn(inviteCode);
    const isFull = treeFullStage === 5;
    if (isFull) {
      api.logBoth('已经成功领取优惠券, 请在 app 中查看!');
    } else {
      if (waterToMature || waterTimes) {
        if (self.isFirstLoop()) {
          if (waterToMature) {
            await log(waterToMature);
          } else if (waterTimes) {
            await handleWater(waterTimes, true);
          }
        }
        return;
      }
    }
    await handlePlant(treeCurrentState === 1 || isFull, isFull);


    if (self.isFirstLoop()) {
      if (self.getNowHour() < 10) {
        await handleDoSign();
        await handleDoShare();
      }
      await handleRain();
      await handleDoTask();
    } else if (self.isLastLoop()) {
      await handleReceiveAssit();
      await log();
    }

    // 种植
    async function handlePlant(needPlant, twice = false) {
      if (!needPlant) return;
      const farmTreeLevels = await doFormBody('farm_tree_board', {boardType: 'sku'}).then(_.property('data.result.farmTreeLevels'));
      // pc: https://item.jd.com/skuId.html
      // h5: https://item.m.jd.com/product/skuId.html
      if (!plantId) {
        // 随机种植一个
        plantId = farmTreeLevels[2].farmLevelTrees[currentCookieIndex].skuId;
      }
      for (const {farmLevelTrees, level, needDays} of farmTreeLevels) {
        const target = farmLevelTrees.find(o => o.skuId === `${plantId}`);
        if (target) {
          if (twice) {
            await doFormBody('farm_plant_tree', {level, type: 'plantLevel'});
          }
          await doFormBody('farm_plant_tree', {uid: target.uid, type: 'plantSku'}).then(data => {
            if (self.isSuccess(data)) {
              api.log(`种植成功, 名称: ${target.skuName}, 等级: ${level}, 需要天数: ${needDays}`);
            } else {
              api.log(`种植失败, ${data.data.bizMsg}`);
            }
          });
          break;
        }
      }
      bottleWater = await doFormBody('farm_home').then(_.property('data.result.bottleWater'));
    }

    async function handleDoTask() {
      const taskList = await doFormBody('farm_task_list', {
        'channel': 0,
        'babelChannel': 'ttt7',
        'lbsSwitch': true,
      }).then(_.property('data.result.taskList')) || [];
      for (const {
        mainTitle,
        taskId,
        taskType,
        taskInsert = false,
        taskDoTimes,
        taskLimitTimes,
        timePeriod,
        taskStatus,
        taskSourceUrl
      } of taskList) {
        const receive = () => doFormBody('farm_task_receive_award', {taskType, taskId, 'channel': 0}).then(data => {
          api.log(`获得水滴: ${_.get(data, 'data.result.taskAward[0].awardValue')}`);
          return data;
        });
        if (taskStatus === 2) {
          for (let i = 0; i < taskDoTimes; i++) {
            const data = await receive();
            if (_.get(data, 'data.bizCode') === 6007) break;
            await sleep(2);
          }
          continue;
        }
        if (/助力|下单/.test(mainTitle) || taskStatus === 3) continue;

        if (/浇水/.test(mainTitle)) {
          const remainTimes = taskLimitTimes - taskDoTimes;
          if (remainTimes * 10 <= bottleWater) {
            await handleWater(remainTimes);
            await receive();
          }
          continue;
        }

        let detailList = [];
        if (taskSourceUrl) {
          detailList.push({itemId: taskSourceUrl, taskInsert});
        } else if (['BROWSE_CHANNEL', 'FOLLOW_CHANNEL'].includes(taskType)) {
          detailList = await doFormBody('farm_task_detail', {
            taskType,
            taskId,
            'channel': 0,
          }).then(_.property('data.result.taskDetaiList')) || [];
        }
        let times = taskDoTimes || 0;
        for (const {itemId, taskInsert} of detailList.reverse()) {
          await sleep(timePeriod);
          await doFormBody('farm_do_task', {
            taskType,
            taskId,
            taskInsert,
            itemId: taskType === 'FOLLOW_CHANNEL' ? 'ODQy' : new Buffer.from(itemId).toString('base64'),
            'channel': 0,
          }).then(async data => {
            if (self.isSuccess(data)) {
              await receive();
            }
          });
          if (++times >= taskLimitTimes) break;
        }
      }
    }

    async function handleRain() {
      const {
        rainType,
        nextRoundStartCountDown,
        curRoundToken: token,
      } = await doFormBody('farm_rain_round_icon').then(_.property('data.result'));
      if (rainType === 1 && !nextRoundStartCountDown) {
        const {roundDuration} = await doFormBody('farm_rain_page', {token}).then(_.property('data.result'));
        if (roundDuration) {
          await sleep(roundDuration);
          await doFormBody('farm_rain_reward', {token, 'bcc': 52, 'scc': 0}).then(data => {
            if (self.isSuccess(data)) {
              api.log(`收集雨滴成功, ${_.get(data, 'data.result.waterRainPrize', []).map(o => `${o.value} ${o.prizeDesc}`).join(', ')}`);
            } else {
              api.log(`收集雨滴失败, ${data.data.bizMsg}`);
            }
          });
        }
      }
    }

    // 签到
    async function handleDoSign() {
      const doFormBody = (functionId, body) => api.doFormBody(functionId, _.assign({'linkId': 'LCH-fV7hSnChB-6i5f4ayw'}, body),
        {
          appid: 'activities_platform',
          client: 'ios',
        },
        {
          headers: {
            origin: 'https://pro.m.jd.com',
            referer: 'https://pro.m.jd.com/mall/active/37KFb2rZywRxkAeiCGrE57oring8/index.html?stath=47&navh=44&tttparams=JDIOIG6DeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMjMuMDc0MTIxIiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicmZzIjoiMDAwMCIsInBvc0xuZyI6IjExMy40NzQ4MDEiLCJncHNfYXJlYSI6IjE5XzE2MDFfNTAyODNfNTAzODYiLCJsbmciOiIxMTMuNDIzNzIwIiwidWVtcHMiOiIwLTAtMCIsImdMbmciOiIxMTMuNDc0ODAxIiwibW9kZWwiOiJpUGhvbmUxMywzIiwiZExuZyI6Ii8J9',
          },
        });
      const signInFlag = await doFormBody('dongDongFarmSignHome').then(_.property('data.signInFlag'));
      if (signInFlag === 0) {
        await doFormBody('dongDongFarmSignIn');
      }
    }

    async function handleDoShare() {
      let inviteCodes = self.getShareCodeFn();
      if (_.isEmpty(inviteCodes)) {
        inviteCodes = [...self.shareCodeTaskList];
      }
      for (const inviteCode of inviteCodes.reverse()) {
        const data = await doFormBody('farm_assist', {
          inviteCode,
          'shareChannel': 'ttt19',
          'assistChannel': '',
        }).then(_.property('data')) || {};
        const {bizCode, bizMsg} = data || {};
        api.log(`助力 ${inviteCode} 结果: ${bizCode === 0 ? '成功' : bizMsg}`);
        if ([0/* 成功 */, 5004/* 没次数 */].includes(bizCode)) break;
      }
    }

    // 浇水
    async function handleWater(times, showFinish = false) {
      let finishTimes = 0;
      showFinish && api.logBoth(`准备浇水次数: ${times}, 预计在 ${getMoment().add(times * 3, 's').format()} 后完成`);
      for (let i = 0; i < times; i++) {
        const stop = await doFormBody('farm_water', {
          'waterType': 1,
          'babelChannel': 'ttt7',
          'lbsSwitch': true,
        }).then(async data => {
          if (self.isSuccess(data)) {
            ++finishTimes;
            const {bottleWater, stagePrize, treeFullStage} = data.data.result;
            if (stagePrize) {
              api.logBoth(`完成${treeFullStage - 1}阶段获得奖励: ${stagePrize.map(o => `${o.value}${o.prizeDesc}`).join(', ')}`);
            }
          } else if (showFinish && ['404', '405'].includes(data.code)) {
            // 活动太火爆了， 请稍后再试~
            await sleep(5);
          } else {
            return true;
          }
        });
        if (stop) {
          break;
        }
        await sleep();
      }
      api[showFinish ? 'logBoth' : 'log'](`成功浇水次数: ${finishTimes}`);
    }

    async function handleReceiveAssit() {
      const assistStageList = await doFormBody('farm_assist_init_info').then(_.property('data.result.assistStageList')) || [];
      for (const {stageStaus} of assistStageList) {
        if (stageStaus === 2) {
          await doFormBody('farm_assist_receive_award').then(data => {
            api.log(`获得助力水滴: ${_.get(data, 'data.result.amount')}`);
          });
        }
      }
    }

    async function log(waterToMature) {
      const {
        treeFullStage,
        treeLevel,
        skuName,
        waterTips,
      } = await doFormBody('farm_home').then(_.property('data.result'));
      let msg = `当前进度: ${waterTips}(stage: ${treeFullStage}), 剩余水滴: ${bottleWater}, 名称: ${skuName || '未知'}, 等级: ${treeLevel}`;
      const target = levelWaters[treeLevel];
      let canHarvest;
      let waterTimes = 0;
      if (target) {
        let remainWater = target[treeFullStage] * +waterTips.match(/\d+\.?\d+/)[0] / 100;
        remainWater += _.sum(_.takeRight(target, target.length - 1 - treeFullStage));
        const harvestWater = remainWater - bottleWater;
        canHarvest = harvestWater <= 0;
        waterTimes = Math.ceil(remainWater / 10);
        msg += canHarvest ? `, 可以收获了(再浇水${waterTimes}次)!` : `, 还差水滴: ${harvestWater}`;
      }
      if (waterToMature) {
        api.clog(msg);
        if (canHarvest) {
          await handleWater(waterTimes, true);
        } else {
          api.clog('当前还不能收获, 请过几天再尝试');
        }
      } else {
        api.log(msg);
      }
    }
  }
}

singleRun(Fruit1).then();

module.exports = Fruit1;
