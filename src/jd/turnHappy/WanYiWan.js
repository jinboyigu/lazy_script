const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class WanYiWan extends Template {
  static scriptName = 'WanYiWan';
  static scriptNameDesc = '玩一玩(领奖券)';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {version: 1},
    appid: 'signed_wh5',
  });
  static keepIndependence = true;
  static times = 1;
  static activityEndTime = '2024-08-31';
  static defaultShareCodes = [
    'viGYOhReBJUC6LNg7lfsawciIw_5kulBiDFMoQg8_lr8SA',
    '7HfNa05aB9hHgrBeqkzVCE26Gmc',
    '-HD0TEQLXdBTgO9SyW_sRI-CSbHKx-ZAlP5PlVQA1Isb11S-',
    '5XDxSWsncMVYh-p9yEL1REpXGBnQwG5Mt21o7PcmwArgJYp5q8M',
    '5XDxPkZfC8IItL5bqE6jCyg0M0Mvuo1CfHERp3zwMmCcgKU9cKbemHU',
  ];

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'referer': 'https://pro.m.jd.com/mall/active/3fcyrvLZALNPWCEDRvaZJVrzek8v/index.html?stath=47&navh=44&tttparams=II5EwO1beyJnTGF0IjoiMjIuOTQzMTA1Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDMxMDUiLCJwb3NMbmciOiIxMTMuNDc0NzE4IiwiZ3BzX2FyZWEiOiIwXzBfMF8wIiwibG5nIjoiMC4wMDAwMDAiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn80%3D&hideAnchorBottomTab=1&babelChannel=ttt16&hybrid_err_view=1&hideTopFoot=1&topNavStyle=1&commontitle=no&jwebprog=0&disablePageSticky=1&transparent=1',
          'x-referer-page': 'https://pro.m.jd.com/mall/active/3fcyrvLZALNPWCEDRvaZJVrzek8v/index.html',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        wanyiwan_home: {appId: 'c81ad'},
        wanyiwan_sign: {appId: 'd12dd'},
        wanyiwan_do_task: {appId: '89db2'},
        wanyiwan_assist: {appId: 'ba505'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);
    const exchange = _.get(self._command, 0);

    if (exchange) {
      await handleExchange(exchange);
    } else {
      await handleDoTask();
    }

    async function handleDoTask() {
      const {signBoard, taskBoard} = await api.doFormBody('wanyiwan_home', {
        'outsite': 0,
        'firstCall': 0,
        'lbsSwitch': false,
      }).then(_.property('data.result'));
      const notSign = signBoard.status === 0;
      if (notSign) {
        await api.doFormBody('wanyiwan_sign').then(data => {
          if (self.isSuccess(data)) {
            api.log(`签到成功, 获取奖券: ${_.get(data, 'data.result.getScore')}`);
          } else {
            api.log(`签到失败, ${JSON.stringify(data)}`);
          }
        });
      }

      for (const {
        encryptAssignmentId: assignmentId,
        taskDetail,
        taskType,
        subtitle,
        status,
        finishTimes
      } of taskBoard || []) {
        const isShareTask = /助力/.test(subtitle);
        const enableDoShare = notSign;
        if (/下单|开启定位权限/.test(subtitle)) continue;
        if (isShareTask) {
          if (enableDoShare) {
            const currentShareCode = taskDetail[0].itemId;
            for (const inviteCode of self.defaultShareCodes.filter(v => v !== currentShareCode)) {
              const data = await api.doFormBody('wanyiwan_assist', {inviteCode});
              if (self.isSuccess(data)) {
                api.log(`助力成功`);
                break;
              } else {
                const bizMsg = _.get(data, 'data.bizMsg');
                const bizCode = _.get(data, 'data.bizCode');
                api.log(`助力失败: ${bizMsg}(${bizCode})`);
                if ([-8003, -8006, -8008].includes(bizCode)) {
                  // 没有助力次数
                  break;
                }
              }
            }
          }
          if (status === 2) {
            for (let i = 0; i < finishTimes; i++) {
              await handleReceive();
              await sleep();
            }
          }
        }

        const waitDuration = +_.get(subtitle.match(/\d/), 0, 0);
        for (let {itemId, status} of taskDetail || []) {
          if (status === 3) continue;
          const _doTask = (actionType = 1) =>
            api.doFormBody('wanyiwan_do_task', {
              itemId,
              taskType,
              assignmentId,
              actionType,
            }).then(data => self.isSuccess(data));
          if (status === 1 && !isShareTask) {
            let isSuccess = await _doTask(waitDuration ? 1 : 0);
            if (isSuccess && waitDuration) {
              await sleep(waitDuration);
              isSuccess = await _doTask(0);
            }
            isSuccess && ++status;
          }
          if (status === 2) {
            await handleReceive();
          }
        }

        async function handleReceive() {
          await api.doFormBody('wanyiwan_task_receive_award', {taskType, assignmentId}).then(data => {
            if (self.isSuccess(data)) {
              api.log(`获得奖券: ${_.get(data, 'data.result.rewardCount')}`);
            }
          });
        }
      }
    }

    async function handleExchange(reward) {
      const {
        hotExchanges,
        moreExchanges,
      } = await api.doFormBody('wanyiwan_exchange_page').then(_.property('data.result'));
      const target = hotExchanges.concat(moreExchanges).find(o => o.rewardType === 1 && o.rewardName.startsWith(reward));
      if (target) {
        await api.doFormBody('wanyiwan_exchange', {
          assignmentId: target.assignmentId,
          type: target.rewardType,
        }).then(data => {
          if (self.isSuccess(data)) {
            api.logBoth(`兑换成功: ${_.get(data, 'data.result.rewardName')}`);
          } else {
            api.logBoth(`兑换失败: ${JSON.stringify(data)}`);
          }
        });
      } else {
        api.logBoth(`未找到: ${reward} 红包`);
      }
    }
  }
}

singleRun(WanYiWan).then();

module.exports = WanYiWan;
