const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod, addMosaic} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

let helpCompleted = false;

class Fission1 extends Template {
  static scriptName = 'Fission1';
  static scriptNameDesc = '100豆';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static linkId = 'xtOvTHVt_TBrdVhwSZO6zg';
  static defaultShareCodes = [
    'CeymEOdTGnhBzMjmwC12IA',
    'i47xTSBS86MoV47MrC276w',
  ];
  static commonParamFn = () => ({
    body: {linkId: this.linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.2.0',
  });
  static keepIndependence = true;
  static needInApp = false;
  static helpPin = '';
  static helped = [];

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'referer': 'https://prodev.m.jd.com/mall/active/4SJgvbvkFsTLRLhZqGU5ASjt1ahB/index.html?stath=47&navh=44&from=kouling&wegameVersion=3&activityChannel=jdapp&tttparams=AJ5LwIUleyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDI5MDYiLCJyZnMiOiIwMDAwIiwicG9zTG5nIjoiMTEzLjQ3NDgwMSIsImdwc19hcmVhIjoiMF8wXzBfMCIsImxuZyI6IjAuMDAwMDAwIiwidWVtcHMiOiIwLTAtMCIsImdMbmciOiIxMTMuNDc0ODAxIiwibW9kZWwiOiJpUGhvbmUxMywzIiwiZExuZyI6Ii8J9&wegameInviteId=CeymEOdTGnhBzMjmwC12IA&wegameLinkid=xtOvTHVt_TBrdVhwSZO6zg',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        fissionHome: {appId: '973a9'},
        fissionHelp: {appId: '36d93'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    self.initShareCodeTaskList(shareCodes || []);
    await self.beforeRequest(api);

    const openShareIndex = _.first(self._command) || 0;

    const fissionHome = (manual = false, helpPin = '') => api.doFormBody('fissionHome', {
      'isJDApp': true,
      manual,
      helpPin,
    }).then(_.property('data'));

    await handleDoTask();

    if (helpCompleted) return;
    const {currentCookieIndex} = api;
    if (currentCookieIndex === openShareIndex) {
      let {status, buttonStatus, sharePin, stillNeedHelpNum} = await fissionHome();
      self.helpPin = sharePin;
      if (status === 0) {
        let {needHelp, awardResult: {amount, prizeDesc}} = await fissionHome(true);
        api.log(`需要 ${needHelp} 人助力(${amount} ${prizeDesc})`);
      }
      if (status === 2 && stillNeedHelpNum === 0) {
        // 不需要再助力
        helpCompleted = true;
        api.log('已完成助力任务');
      }
    } else {
      const helpPin = self.helpPin || self.getShareCodeFn()[0];
      if (helpPin && !self.helped[currentCookieIndex]) {
        await api.doFormBody('fissionHelp', {popType: 1, helpPin}).then(data => {
          if (_.get(data, 'data.helpResult')) {
            self.helped[currentCookieIndex] = 1;
            api.log(`助力 ${addMosaic(helpPin)} 成功`);
          } else {
            api.log(`助力 ${addMosaic(helpPin)} 失败(${_.get(data, 'data.failMsg', '未知原因')})`);
          }
        });
      }
    }

    // 打卡任务
    async function handleDoTask() {
      const doFormBody = (functionId, body) => api.doFormBody(functionId, _.assign({
        linkId: '',
        'activityId': '4SJgvbvkFsTLRLhZqGU5ASjt1ahB',
        'pageId': '5169335',
        'scene': '1',
        'applyKey': 'babel',
        'reqSrc': 'mainActivity',
        'encryptProjectId': '2JfaxPyHnzGgHS4bKHtW8Xr7LZzy',
        'sourceCode': 'acedigital3c',
      }, body), {
        appid: 'digital3c',
        area: '19_1601_36953_50400',
        client: 'wh5',
        clientVersion: '8.4.4',
      }, {
        headers: {
          origin: 'https://pro.m.jd.com',
          referer: 'https://pro.m.jd.com/mall/active/4SJgvbvkFsTLRLhZqGU5ASjt1ahB/index.html?stath=54&navh=44&babelChannel=ttt16&tttparams=UczMweyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTc5IiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI3NzI1ODMyNjUyIiwibGF0IjoiMjIuOTY4MTY3IiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicG9zTG5nIjoiMTEzLjQ3NDgwMSIsImdwc19hcmVhIjoiMTlfMTYwMV8zNjk1M181MDQwMCIsImxuZyI6IjExMy40ODgxODUiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ4MDEiLCJtb2RlbCI6ImlQaG9uZTE1LDIiLCJkTG5nIjoiIn50%3D',
        },
      });
      const {assignmentList} = await doFormBody('queryInteractiveInfo', {
        'encryptAssignmentIds': ['2C3Tw3vPWZdu3SsKen6Sn2GcS6aM'],
      });
      for (const {completionFlag, encryptAssignmentId} of assignmentList) {
        if (completionFlag) continue;

        await doFormBody('doInteractiveAssignment', {
          encryptAssignmentId,
          'completionFlag': true,
        }).then(data => {
          const {rewardsInfo: {successRewards, failRewards}} = data;
          api.log(_.isEmpty(successRewards) ? `打卡失败: ${failRewards[0].msg}` : `打卡成功 ${_.flatten(_.values(successRewards)).map(o => `${o.rewardName}(${o.quantity}个)`).join(' ')}`);
        });
      }
    }
  }
}

singleRun(Fission1).then();

module.exports = Fission1;
