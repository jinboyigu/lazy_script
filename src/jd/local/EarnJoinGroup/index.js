const Template = require('../../base/template');


const {sleep, writeFileJSON, readFileJSON, singleRun, replaceObjectMethod, addMosaic} = require('../../../lib/common');
const {getEnv} = require('../../../lib/env');
const {formatPasteData} = require('../../../lib/charles');
const _ = require('lodash');
const {getMoment} = require('../../../lib/moment');

// TODO 从邮件中获取
const groupConfig = [
  // {activeId: 'sfc_202407292124367148d'},
];

class EarnJoinGroup extends Template {
  static scriptName = 'EarnJoinGroup';
  static scriptNameDesc = '参团(小程序)';
  static dirname = __dirname;
  static times = 2;
  static commonParamFn = () => ({});
  static cookieKeys = ['wq_uin', 'wq_skey'];
  static needInApp = false;

  static apiOptions = {
    options: {
      uri: 'https://api.m.jd.com/superFission',
      qs: {
        g_ty: 'ls',
        g_tk: '1874212660',
      },
      form: {
        client: 'apple',
        clientVersion: '9.19.100',
        appid: 'hot_channel',
        loginType: 11,
      },
      headers: {
        referer: 'https://servicewechat.com/wx91d27dbf599dff74/755/page-frame.html',
        // TODO user-agent 应该是不用的, 先用着
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003137) NetType/WIFI Language/zh_CN',
      },
    },
  };

  static isSuccess(data) {
    return _.property('subCode')(data) === 0;
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        miniCenterQueryNormalConfig: {appId: '1ffca'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);
    const doPathBody = (functionId, body) => api.doPathBody(functionId, body, {functionId: `superFission_${functionId}`});

    const mainPageBody = (activeId, groupId = '') => ({
      activeId,
      groupId,
      'orderNo': '',
      'pdMiniappId': '',
      'pdVenderId': '',
      'pdProjectId': '',
      'pdTaskId': '',
      'venueUrl': '',
    });

    const shareCookieIndex = _.first(self._command) || getEnv('JD_EARNJOINGROUP_SHARE_COOKIE_INDEX', 0, -1);

    if (shareCookieIndex < 0) return api.logBoth('请手动指定 cookie index');
    if (self.isFirstLoop() && api.currentCookieIndex === shareCookieIndex) {
      await handleUpdateGroup();
      for (const groupData of groupConfig) {
        const {activeId} = groupData;
        const mainPageResult = await doPathBody('mainPage', mainPageBody(activeId));
        if (!self.isSuccess(mainPageResult)) {
          api.logBoth(`[${activeId}] mainPage 获取失败: ${mainPageResult['message']}`);
          continue;
        }
        const {groupId, groupStatus} = _.get(mainPageResult, 'data.basicGroupInfo', {});
        const canCreateGroup = _.get(mainPageResult, 'data.userInfo.canCreateGroup');
        // 已开团
        if (groupId && !canCreateGroup) {
          if (groupStatus !== 3) {
            groupData.groupId = groupId;
          }
          continue;
        }
        // 开团
        await doPathBody('openGroup', {
          activeId,
          'orderNo': '',
          'pdMiniappId': '',
          'pdVenderId': '',
          'pdProjectId': '',
          'pdTaskId': '',
        }).then(data => {
          if (self.isSuccess(data)) {
            groupData.groupId = data.data.groupId;
          }
        });
        await sleep(3);
      }
    }

    for (const groupData of groupConfig) {
      await handleJoinGroup(groupData);
    }

    async function handleJoinGroup(groupData) {
      const {activeId, groupId} = groupData;

      if (!activeId || !groupId) {
        return;
      }

      const mainPageResult = await doPathBody('mainPage', mainPageBody(activeId, groupId));
      if (!self.isSuccess(mainPageResult)) {
        return api.logBoth(`[${activeId}] mainPage 获取失败: ${mainPageResult['message']}`);
      }

      const {
        activityInfo: {
          shareInfo: {
            shareTitle,
          },
          showContent: {
            browseCreateTaskDuration,
            browseTaskDuration,
            taskStatus,
          },
        },
        groupInfo = {},
        basicGroupInfo: {
          groupStatus,
        },
        prizeEnough,
        prizeRemain,
        userInfo: {
          canJoinGroup,
          canJoinGroupUserLabel,
          noJoinGroupReason,
        },
      } = _.get(mainPageResult, 'data');

      const log = str => api.logBoth(`[${shareTitle}-${addMosaic(groupId, {prefix: 3, suffix: 3})}] ${str}`);

      if (groupStatus === 3) {
        return log(`已成功`);
      }
      const {groupType} = groupInfo;
      if ([1/*团长*/, 2/*团员*/].includes(groupType)) {
        return log(`已在团中, 无需重复参加`);
      }
      if (noJoinGroupReason === '1024' || canJoinGroup < canJoinGroupUserLabel || canJoinGroup === 0) {
        return log(`已没次数参加`);
      }
      await sleep(browseTaskDuration + 2);
      // 参团
      await doPathBody('joinGroup', {
        activeId,
        groupId,
        'pdMiniappId': '',
        'pdVenderId': '',
        'pdProjectId': '',
        'pdTaskId': '',
      }).then(data => {
        if (self.isSuccess(data)) {
          log('参团成功');
        } else {
          log(`参团失败(subCode: ${data.subCode}, message: ${data.message})`);
        }
      });
    }

    async function handleUpdateGroup() {
      const configIds = [
        1223,// 超级裂变清单-农场
        1159,// 超级裂变x校园
        1157,// 超级裂变清单
      ];
      for (const id of configIds) {
        await miniCenterQueryNormalConfig(id);
      }
      await update1();

      async function miniCenterQueryNormalConfig(id) {
        await api.doGetBody('miniCenterQueryNormalConfig', {id, 'operationFlag': false, 'type': '1'}, {
          uri: 'https://api.m.jd.com/miniCenterQueryNormalConfig',
          qs: {
            functionId: 'miniCenterQueryNormalConfig',
            ...api.options.form,
          },
          form: {},
        }).then(data => {
          const floors = _.get(data, 'data.pages[0].stepPages[0].floors');
          _.filter(floors.map(o => {
            const styleConfig = _.get(o, 'config.tagName') === 'MpmSuperfission' && _.get(o, 'config.styleConfig');
            if (!styleConfig) return;
            const {start, end} = styleConfig;
            if (getMoment().isAfter(end) || getMoment().isBefore(start)) return;
            return styleConfig.active_id;
          }))
          .forEach(activeId => {
            api.log(`新增 activeId: ${activeId}`);
            groupConfig.push({activeId});
          });
        });
      }

      // 社交圈 0.56
      async function update1() {
        const t = getMoment().valueOf();
        const supFissionId = await api.doGetUrl(`https://api.m.jd.com/shop/circle/mainPage?appid=hot_channel&functionId=miniShopCircle_mainPage&sign=&client=apple&clientVersion=9.19.240&t=${t}&body=%7B%22ref%22%3A%22share%22%2C%22source%22%3A%22sharekt%22%2C%22%24taroTimestamp%22%3A${t}%7D&loginType=11&loginWQBiz=mpmsku&channel=http-direct&clientType=wxapp&build=&osVersion=iOS%2017.5&screen=390*844&networkType=wifi&partner=&forcebot=&d_brand=iPhone&d_model=iPhone%2012%20Pro%3CiPhone13%2C3%3E&d_name=&lang=zh_CN&wifiBssid=&scope=&g_ty=ls&g_tk=1878487459`).then(_.property('data.supFissionId'));
        supFissionId && groupConfig.push({activeId: supFissionId});
      }
    }
  }

}

singleRun(EarnJoinGroup).then();

module.exports = EarnJoinGroup;
