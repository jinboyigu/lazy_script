const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const {getEnv} = require('../../lib/env');
const md5 = require('js-md5');

// 等级
const levelWaters = [
  0,
  0,
  [0, 60, 300, 400, 12500],
  [0, 60, 300, 400, 25000],
];
const getWaterTipsNumber = s => +s.match(/\d+\.?\d+/)[0] / 100;

const clientVersion = '13.6.2';
const frequencyLimit = {max: 4, wait: 60};

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
    clientVersion,
    // 'x-api-eid-token': 'jdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMS75L7ZOIAAAAADUWEC4MQ567K7EX',
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 2;

  static apiOptions() {
    return {
      options: {
        frequencyLimit,
        repeatFn: async (data, functionId) => {
          const code = +data.code;
          if ([405].includes(code)) {
            await sleep(5);
            return true;
          } else if (code === 404 && functionId === 'farm_water') {
            // 运行环境异常
            await sleep(5 * 60);
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
      const farmTreeLevels = await doFormBody('farm_tree_board', {version: 3}).then(_.property('data.result.farmTreeLevels'));
      // pc: https://item.jd.com/skuId.html
      // h5: https://item.m.jd.com/product/skuId.html
      if (!plantId) {
        // 随机种植一个
        plantId = farmTreeLevels[2].farmLevelTrees[currentCookieIndex].skuId;
      }
      for (const {farmLevelTrees, level, needDays} of farmTreeLevels) {
        const target = farmLevelTrees.find(o => o.skuId === `${plantId}`);
        if (target) {
          await doFormBody('farm_plant_tree', {version: 3, uid: target.uid}).then(data => {
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
      const waitWaterSecond = 1;
      let firstTips;
      const logToFinish = (num, msg = '预估') => api.logBoth(`${msg}准备浇水次数: ${num}, 预计在 ${getMoment().add(num * 1.5 + num / frequencyLimit.max * (frequencyLimit.wait + 5), 's').format()} 后完成`);
      showFinish && logToFinish(times);
      for (let i = 0; i < (showFinish ? Infinity : times); i++) {
        const stop = await doFormBody('farm_water', {
          'waterType': 1,
          'babelChannel': 'ttt7',
          'lbsSwitch': true,
        }).then(async data => {
          if (self.isSuccess(data)) {
            ++finishTimes;
            const {bottleWater, stagePrize, treeFullStage, waterTips} = data.data.result;
            if (treeFullStage === 4 && showFinish) {
              firstTips = firstTips || waterTips;
              if (i === 1) {
                const remainWatter = 10 / (getWaterTipsNumber(firstTips) - getWaterTipsNumber(waterTips)) * getWaterTipsNumber(waterTips);
                logToFinish(Math.ceil(remainWatter / 10), '实际');
                if (remainWatter > bottleWater) {
                  api.log(`还差 ${Math.ceil(remainWatter - bottleWater)} 滴水才能收获`);
                  return true;
                }
              }
            }
            if (stagePrize) {
              api.logBoth(`完成${treeFullStage - 1}阶段获得奖励: ${stagePrize.map(o => `${o.value}${o.prizeDesc}`).join(', ')}`);
            }
            if (treeFullStage === 5) {
              return true;
            }
          } else {
            return true;
          }
        });
        if (stop) {
          break;
        }
        // TODO 应该是无效请求
        // await _report(api);
        await sleep(waitWaterSecond);
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
        let remainWater = target[treeFullStage] * getWaterTipsNumber(waterTips);
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

async function _report(api) {
  return report2({
    'event_id': 'Babel_dev_other_NewFarm_Main_Water',
    'event_param': '{"aid":"01568601","babelChannel":"ttt6","newfarm_watercount":"10","newfarm_stage":"4","newfarm_label":"3","newfarm_round":"5"}',
    'psn': '5a44015a5e835b3dcb903c9a6b9d66573473c14d|1316',
    'psq': '1',
    'page_id': 'NewFarm_Main',
    'page_name': 'https://h5.m.jd.com/pb/015686010/Bc9WX7MpCW7nW9QjZ5N3fFeJXMH/index.html',
    'page_param': 'babelChannel=ttt7',
    'pv_sid': '306',
    'pv_seq': '3',
    'ma_is_sparse': '0',
    'ma_b_group': '-1',
  });

  async function report2(p) {
    let ts = new Date().getTime().toString();
    let token = md5(ts + '5YT%aC89$22OI@pQ');
    let pin = api.getPin();
    let json = {
      'pin_sid': '4d10dd0fce8ec6dd4f3bfa21b3aef59w',
      'report_ts': ts,
      'scr': '375x667',
      'token': token,
      'ut': 's',
      'clt': 'web',
      'jvr': '3.0.12',
      'std': 'MO-J2011-1',
      'tpc': 'traffic-jdm.cl',
      'uuid': '1718552076019430492770',
      'cli': 'IOS-M',
      'osv': '',
      'uid': '',
      'biz': 'mba',
      'mba_muid': '1718552076019430492770',
      'mba_sid': '22',
      'proj_id': '3',
      'reserved3': '122270672.1718552076019430492770.1718552076.1718552076.1718615329.2_122270672_kong_t_1000582354__jingfen_bd5c3117144f4c7ea91e8de1a3ec02f7_1718374977703_122270672.13.1718552076019430492770_2.1718615329__122270672.13.1718552076019430492770_2.1718615329___JF8EAIJnNSttCx5QVxkCGxQQTlgDWw8OH0cLbzMMAQlYG1ZRSQMYRRZ7XlVdWBRKEB9vYhRXXlNIVw4fBCsiEEpcVVpUC0kTBl9XDVwzREsZTFZPViITS21Vbm0JexcFX2EEXFxYTVQ1KwMrEyBKbRYwBl0lE1c4blZTX11KAFFOClYiEXte',
      'osp': 'iphone',
      'data': [{
        'ma_route_ready': '1',
        'ma_log_id': '1718552076019430492770-1718617041919-1540707312',
        'ma_pv_log_id': '1718552076019430492770-1718617035844-1342850999',
        'ref': 'MyJdMTAManager',
        'ctm': new Date().getTime().toString(),
        'pin': pin,
        'ctp': 'https://h5.m.jd.com/pb/015686010/Bc9WX7MpCW7nW9QjZ5N3fFeJXMH/index.html',
        'par': 'babelChannel=ttt7',
        'usc': 'kong',
        'umd': 'jingfen',
        'utr': 'bd5c3117144f4c7ea91e8de1a3ec02f7',
        'ucp': 't_1000582354_',
        'jdv': '122270672|kong|t_1000582354_|jingfen|bd5c3117144f4c7ea91e8de1a3ec02f7|1718374977703',
        'vts': 2,
        'seq': 13,
        'browser_ver': '0',
        'browser': 'JDAPP',
        'fst': 1718552076,
        'pst': 1718552076,
        'vct': 1718615329,
        'clr': '32-bit',
        'bsl': 'zh-cn',
        'bsc': 'UTF-8',
        'jav': 0,
        'flv': '',
        'tit': '东东农场',
        'hash': '',
        'tad': '1',
        'dataver': '0.1',
        'is_wq': 0,
        'chan_type': 6,
        'rpd': 'MyJD_Main',
        'app_device': 'IOS',
        'pap': `JA2015_311210|${clientVersion}|IOS`,
        'typ': 'cl',
        'lgt': 'cl',
        'tar': '',
        'apv': clientVersion,
        'mba_seq': '4',
        'event_id': 'Babel_dev_other_NewFarm_Main_Resource2',
        'event_param': '{"aid":"01568601","babelChannel":"ttt7","newfarm_jump_link":"https://lotterydraw-new.jd.com/?id=VssYBUKJOen7HZXpC8dRFA"}',
        'psn': '713528612071b94e23fcd28144db476f856f9fc5|82',
        'psq': '2',
        'page_id': 'NewFarm_Main',
        'page_name': 'https://h5.m.jd.com/pb/015686010/Bc9WX7MpCW7nW9QjZ5N3fFeJXMH/index.html',
        'page_param': 'babelChannel=ttt7',
        'pv_sid': '22',
        'pv_seq': '4',
        'ma_is_sparse': '0',
        'ma_b_group': '-1',
        'unpl': 'JF8EAIJnNSttCx5QVxkCGxQQTlgDWw8OH0cLbzMMAQlYG1ZRSQMYRRZ7XlVdWBRKEB9vYhRXXlNIVw4fBCsiEEpcVVpUC0kTBl9XDVwzREsZTFZPViITS21Vbm0JexcFX2EEXFxYTVQ1KwMrEyBKbRYwBl0lE1c4blZTX11KAFFOClYiEXte',
        'mjds': '',
        'mode_tag': '0',
      }],
    };
    json = {...json, ...p};
    await api.commonDo({
      url: 'https://uranus.jd.com/log/m?std=MO-J2011-1',
      cookie: '',
      method: 'POST',
      body: json,
      headers: {
        referer: 'https://lotterydraw-new.jd.com/?id=VssYBUKJOen7HZXpC8dRFA',
        'user-agent': `jdapp;iPhone;${clientVersion};;;M/5.0;appBuild/169370;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22DzOzDJS4DtOyCNcnYtu0ZJSzZwDuCtqnDNHuYtG3DwY4DJZwEWZtDG%3D%3D%22%2C%22sv%22%3A%22CJUkDy41%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1718615435%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 15_7_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;`,
      },
    });
  }
}

singleRun(Fruit1).then();

module.exports = Fruit1;
