const Base = require('./index');

const {sleep, writeFileJSON, replaceObjectMethod} = require('../../lib/common');
const EncryptH5st = require('../../lib/EncryptH5st');
const {getMoment} = require('../../lib/moment');
const {genParamsSign} = require('../../lib/security');
const Algo = require('../../lib/others/kedaya');
const algoCaches = {};

class Template extends Base {
  static scriptName = 'Template';
  static dirname = __dirname;
  static times = 2;
  static shareCodeTaskList = [];
  // 更新助力码时使用, 一般用于区分Object
  static shareCodeUniqIteratee;
  // 默认助力码
  static defaultShareCodes = [];
  static maxTaskDoneTimes = 1;
  static doneShareTask = !this.firstTimeInTheDay();

  static updateShareCodeFn(shareCode, isCurrent = true) {
    const self = this;
    const shareCodeUniqIteratee = self.shareCodeUniqIteratee;
    let shareCodeTaskList = self.shareCodeTaskList;
    shareCodeTaskList.splice(isCurrent ? self.currentCookieTimes : shareCodeTaskList.length, 0, shareCode);
    if (shareCodeUniqIteratee) {
      shareCodeTaskList = shareCodeTaskList.map(code => _.isObject(code) ? code : {[shareCodeUniqIteratee]: code});
    }
    self.shareCodeTaskList = _.uniqBy(shareCodeTaskList, shareCodeUniqIteratee);
  }

  // 获取 shareCode
  static getShareCodeFn(api) {
    const self = this;
    const currentIndex = api ? api.currentCookieIndex : self.currentCookieTimes;
    return self.shareCodeTaskList.filter((o, index) => {
      if (self.isFirstLoop()) {
        return index < currentIndex;
      }
      if (self.isLastLoop()) {
        return index > currentIndex;
      }
    });
  }

  static apiOptions = {
    formatDataFn: data => data,
  };

  static apiNamesFn() {
    const self = this;

    return {
      // 获取任务列表
      getTaskList: {
        name: 'getTaskList',
        paramFn: _.noop,
        successFn: _.noop,
      },
      // 做任务
      doTask: {
        name: 'doTask',
        paramFn: _.noop,
        successFn: _.noop,
      },
      doWaitTask: {
        name: 'doWaitTask',
      },
      // 任务之后, 一般来说是兑换之类的
      doRedeem: {
        name: 'doRedeem',
        paramFn: _.noop,
        successFn: _.noop,
        repeat: true,
      },
    };
  }

  static initShareCodeTaskList(shareCodes) {
    const self = this;
    // 通用处理
    shareCodes.concat(self.defaultShareCodes).forEach(code => {
      self.updateShareCodeFn(code, false);
    });
    self.defaultShareCodes = [];
  }

  static async beforeRequest(api) {}

  static async handleUpdateCurrentShareCode(api) {}

  static async handleDoShare(api) {}

  // doMain一般不会被重载
  static async doMain(api, shareCodes) {
    const self = this;

    self.initShareCodeTaskList(shareCodes || []);

    const needStop = await self.beforeRequest(api);
    if (needStop === true) return api.log('活动已结束(beforeRequest)');

    await self.doApi(api, 'beforeGetTaskList');

    let taskDoneTimes = 0;
    await _doTask();

    if (!self.doneShareTask) {
      self.isFirstLoop() && await self.handleUpdateCurrentShareCode(api);
      await self.handleDoShare(api);
    }

    if (self.isLastLoop()) {
      await self.doApi(api, 'afterGetTaskList');
      await self.doApi(api, 'doRedeem');
    }

    async function _doTask() {
      const taskList = await self.doApi(api, 'getTaskList') || [];

      let isDone = false;
      for (const {list, option = {}} of taskList) {
        option.firstFn = option.firstFn || (item => self.doApi(api, 'doTask', item));
        option.afterWaitFn = option.afterWaitFn || ((data, item) => {
          return self.doApi(api, 'doWaitTask', item, data);
        });
        if (await self.loopCall(list, option)) {
          isDone = true;
        }
      }
      if (isDone && (++taskDoneTimes < self.maxTaskDoneTimes)) {
        await sleep(2);
        await _doTask();
      }
    }
  }

  // helpers
  static getFilePath(fileName) {
    return require('path').resolve(this.dirname || __dirname, fileName);
  }

  // 更新 wq_auth_token
  static async updateWqAuthToken(api, updateCookie = true, keepOrigin = false) {
    const authToken = await getAuthToken();
    if (authToken && updateCookie) {
      api.cookieInstance.set('wq_auth_token', authToken);
      if (!keepOrigin) {
        api.cookieInstance.remove('wq_uin');
        api.cookieInstance.remove('wq_skey');
      }
    }
    return authToken;

    // 获取 wq_auth_token
    async function getAuthToken() {
      return api.commonDo({
        uri: 'https://wq.jd.com/pinbind/GetTokenForWxApp',
        method: 'GET',
        qs: {biz: 'interact'},
        headers: {
          referer: 'http://wq.jd.com/wxapp/pages/hd-interaction/index/index',
        },
      }).then(_.property('token'));
    }
  }

  static injectEncryptH5st(api, {
    defaultData = this.commonParamFn(),
    config,
    removeEncryptKeys = ['_stk', '_ste'],
    replaceMethods = ['doFormBody', 'doGetBody'],
    beforeEncryptFn,
    afterEncryptFn = _.noop,
    signKeys = [],
    signFromSecurity = false,
    signFromKEDAYA = false,
    algoOptions = {},
    updateForm = true,
  }) {
    const origin = _.get(api, 'options.headers.origin');
    let algo;
    if (signFromKEDAYA) {
      const key = `${api.currentCookieIndex}${JSON.stringify(algoOptions)}`;
      if (algoCaches[key]) {
        algo = algoCaches[key];
      } else {
        algo = algoCaches[key] = Algo(algoOptions);
      }
    }

    replaceMethods.forEach(method => {
      replaceObjectMethod(api, method, async data => {
        let [functionId, body, signData, options = {}] = data;
        // TODO 优化这里的逻辑
        if (method === 'doGet') {
          options = signData || options;
          options.qs = options.qs || {};
          _.merge(options.qs, body);
          body = void 0;
        } else if (method === 'doUrl') {
          options = body || options;
          options.url = functionId;
          functionId = _.get(options, 'form.functionId');
          body = void 0;
        } else if (method === 'doGetBody') {
          options = signData || options;
        } else {
          options.form = options.form || {};
          _.merge(options.form, signData);
        }
        const t = getMoment().valueOf();
        let form = _.merge({}, defaultData, body && {body}, signFromKEDAYA ? {} : {t}, options.qs || options.form);
        if (signFromKEDAYA) {
          form = {
            // uuid: 'c6993893af46e44aa14818543914768cf2509fbf',
            // openudid: 'c6993893af46e44aa14818543914768cf2509fbf',
            client: 'apple',
            clientVersion: '13.1.0',
            ...form,
          };
        }
        beforeEncryptFn && (form = beforeEncryptFn(functionId, form));
        // TODO 整理成通用方法
        const needEncrypt = functionId && functionId in config;
        if (needEncrypt) {
          let {encryptH5st, appId, fingerprint, algoData, platform, disableAutoUpdate, version} = config[functionId];
          !encryptH5st && (config[functionId]['encryptH5st'] = encryptH5st = signFromKEDAYA ? algo : signFromSecurity ? genParamsSign({
            userAgent: api.options.headers['user-agent'],
            appId,
            fp: fingerprint,
          }) : new EncryptH5st({
            appId,
            origin,
            fingerprint,
            algoData,
            platform,
            version,
            disableAutoUpdate,
          }));
          let notSignForm = {};
          if (!_.isEmpty(signKeys)) {
            notSignForm = _.omit(form, signKeys);
            form = _.pick(form, signKeys);
          }
          /* TODO 可能只适用于 client=apple/android */
          if (signFromKEDAYA) {
            const result = await encryptH5st.sign({
              url: api.options.uri || api.options.url || options.url,
              appId,
              form: {
                functionId,
                ...form,
              },
            });
            form = _.merge(form, result.form);
            _.merge(options, {
              headers: {
                'user-agent': result.headers['user-agent'],
              },
            });
          } else if (signFromSecurity) {
            const result = await encryptH5st.sign({functionId, ...form});
            _.assign(form, _.pick(result, ['h5st', '_stk', '_ste']));
          } else {
            form = await encryptH5st.sign({functionId, ...form});
          }
          removeEncryptKeys.forEach(key => {
            delete form[key];
          });
          _.merge(form, notSignForm);
        } else {
          if (signFromKEDAYA) {
            _.merge(options, {
              headers: {
                'user-agent': algo.userAgent().app,
              },
            });
          }
        }
        await afterEncryptFn(form);
        const toQs = ['doGetBody', 'doGet'].includes(method);
        if (needEncrypt || updateForm) {
          _.merge(options, toQs ? {qs: form} : {form});
        }
        if (toQs) {
          return [functionId, void 0, options];
        } else if (method === 'doUrl') {
          return [options.url, options];
        }
        return [functionId, void 0, void 0, options];
      });
    });
  }
}

module.exports = Template;
