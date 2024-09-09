const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod, addMosaic} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Fission1 extends Template {
  static scriptName = 'Fission1';
  static scriptNameDesc = '2元团';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static linkId = 'RAXK1uc0RfxJl7dS25LI6g';
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
          'referer': 'https://pro.m.jd.com/mall/active/kqDEevEoa7PKjhFphP71YXEewNR/index.html?stath=54&navh=44&from=kouling&wegameVersion=3&activityChannel=jdapp&tttparams=CGUzITbGIeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTc5IiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI2MTQ0NTAwNTg5IiwibGF0IjoiMjIuOTY4MTY3IiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicG9zTG5nIjoiMTEzLjQ3NDgwMSIsImdwc19hcmVhIjoiMTlfMTYwMV8zNjk1M181MDQwMCIsImxuZyI6IjExMy40ODgxODUiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ4MDEiLCJtb2RlbCI6ImlQaG9uZTE1LDIiLCJkTG5nIjoiIn90%3D&wegameInviteId=CeymEOdTGnhBzMjmwC12IA&wegameLinkid=RAXK1uc0RfxJl7dS25LI6g',
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

    const {currentCookieIndex} = api;
    if (currentCookieIndex === openShareIndex) {
      let {status, buttonStatus, sharePin} = await fissionHome();
      self.helpPin = sharePin;
      if (buttonStatus === '3') {
        let {needHelp, awardResult: {amount, prizeDesc}} = await fissionHome(true);
        api.log(`需要 ${needHelp} 人助力(${amount} ${prizeDesc})`);
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
  }
}

singleRun(Fission1).then();

module.exports = Fission1;
