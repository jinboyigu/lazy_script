// 自动执行的脚本
require('../../shell/updateDayLogPath');

const _ = require('lodash');

const Api = require('../api');
const UserAgent = require('./UserAgent');
const Cookie = require('../../lib/cookie');
const {sleep, printLog, parallelRun, addMosaic, formatJSONOutput} = require('../../lib/common');
const {getMoment, getNextHour, getNowHour} = require('../../lib/moment');
const {sleepDate} = require('../../lib/cron');
const {processInAC, getProductEnv, updateProductEnv, uploadProductEnvToAction, getEnv} = require('../../lib/env');

// 本地运行无需主动更新
let initiativeChangeCkMaxTimes = processInAC() ? 1 : 0;
let needUpdateAction = false;

// 注册全局变量
global._ = _;

// [app,client,clientVersion,uuid;wifi;...]
const appCompleteUserAgent = 'jdapp;iPhone;10.1.6;14.8;c6993893af46e44aa14818543914768cf2509fbf;network/wifi;model/iPhone13,3;addressid/682688717;appBuild/167841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1';
const appUserAgentNotUUID = 'jdapp;iPhone;11.4.4;;;M/5.0;appBuild/168500;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22YzY5EJC4EJDrZtG2ZJG0YWOnDNqnENU0CzunDNc2EQDwCtUmEWZsZq%3D%3D%22%2C%22sv%22%3A%22CJYkDM4n%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1684977588%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 16_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;';

class Base {
  /**
   * @deprecated
   */
  static _ = _;
  // 当前循环的cookie下标
  static currentCookieTimes = 0;
  // 当前循环次数, 不可更改
  static currentTimes = 1;
  // 脚本名称(用于获取相关属性)
  static scriptName = 'scriptName';
  // 脚本名称(用于日志输出)
  static scriptNameDesc = '';
  // 循环次数
  static times = 1;
  // request 参数
  static isWh5 = false; // 添加signData
  static needInApp = true; // 添加 userAgent
  static needInAppComplete = false; // 添加 userAgent
  static needInAppComplete1 = false; // 添加 userAgent
  static appCompleteUserAgent = appCompleteUserAgent;
  static needInSpeedApp = false; // 添加 userAgent
  static needInJxApp = false; // 添加 userAgent
  static needOriginH5 = false; // 添加 headers.origin
  static needInPhone = false; // 添加 userAgent
  static needOriginProMd = false; // 添加 origin 和 referrer
  static apiOptions = {
    signData: {},
    options: {},
    formatDataFn: void 0,
  };
  // api 参数
  static apiExtends = {
    // 具体请求 functionName
    requestFnName: 'doFormBody',
    // 接口名称
    apiNames: [],
  };
  // 是否并发请求
  static concurrent = false;
  static concurrentOnceDelay = 2;

  // 各自运行各自的, 报错也不影响其他 cookie
  // TODO 后面都统一设置为 true
  static keepIndependence = true;

  // 活动开始和结束时间, 默认没有
  static activityStartTime = '';
  static activityEndTime = '';

  static cookieKeys = ['pt_pin', 'pt_key'];
  static needChangeCK = true;

  // apiNames的补充
  static apiNamesFn() {
    return {
      _test: {
        name: 'doTest',
        paramFn: _.noop,
        successFn: _.noop,
        errorFn: _.noop,
      },
    };
  }

  // 判断请求是否成功
  static isSuccess(data) {
    return _.property('data.bizCode')(data) === 0;
  };

  static async doMain(api, shareCodes) {
  }

  static async doCron(api, shareCodes) {
  }

  static async afterAllDone() {}

  static getName() {
    return this.scriptNameDesc || this.scriptName;
  }

  static getValue(key) {
    return _.isFunction(this[key]) ? this[key]() : this[key];
  }

  // helpers
  static log(output, fileName, label = this.currentCookieTimes, name = this.getName()) {
    output = `[${label}] ${_.isPlainObject(output) ? JSON.stringify(output) : output}`;
    printLog(name, fileName, output);
  }

  // 第一次循环
  static isFirstLoop() {
    return this.currentTimes === 1;
  }

  // 最后一次循环
  static isLastLoop() {
    return this.currentTimes === this.times;
  }

  static getNowHour = getNowHour;

  static firstTimeInTheDay() {
    return this.getNowHour() < 5;
  }

  static lastTimeInTheDay() {
    return this.getNowHour() >= 22;
  }

  static getCurrentEnv(key) {
    return getEnv(key, this.currentCookieTimes);
  }

  static getUUid(userAgent) {
    return new UserAgent(userAgent || this.appCompleteUserAgent).uuid;
  }

  static getListMatchVo(object) {
    object = object || {};
    let taskList = [];
    for (const key in object) {
      if (key.match(/Vo(s)?$/) && key !== 'scoreRuleVos') {
        taskList = [].concat(object[key]);
        break;
      }
    }
    return taskList;
  }

  static async loopCall(list = [], option) {
    let isDone = false;
    let {
      firstFn = _.noop, afterWaitFn = _.noop,
      isFinishFn = o => _.property('status')(o) === 2,
      getListFn = () => list,
      maxTimes = 1,
      times = 0,
      waitDuration = 0,
      needRealSuccessful = false, // 需要判断是否成功
    } = option || {};
    list = _.concat(await getListFn());
    list = list.filter(item => {
      const finished = isFinishFn(item);
      finished && maxTimes--;
      return !finished;
    });
    const loopTimes = maxTimes - times;
    let remainTimes = loopTimes;
    await doLoop(loopTimes);

    async function doLoop(loopTimes, index = 0) {
      for (; index < loopTimes; index++) {
        isDone = true;
        const item = list[index] || {};
        const data = await firstFn(item);
        if (!_.property('isSuccess')(data)) remainTimes++;
        if (waitDuration === 0) continue;
        await sleep(waitDuration + 2);
        await afterWaitFn(data, item);
      }
      // TODO 该逻辑是废弃的
      if (needRealSuccessful && (remainTimes > loopTimes)) {
        await doLoop(remainTimes, loopTimes);
      }
    }


    return isDone;
  }

  // 请求 apiNamesFn
  static async doApi(api, name, data, returnData) {
    const target = api[name];
    if (!target) return Promise.resolve();
    const {paramFn = _.noop, successFn = _.noop, errorFn, repeat = false} = this.apiNameOptions[name];

    const _do = () => {
      let next = target(...[].concat(paramFn(data, returnData))).then(async (data) => successFn(data, api));
      if (errorFn) next = next.catch(errorFn);
      return next;
    };

    const repeatFn = () => _do().then(needRepeat => {
      // 显示返回 false 才会停止
      if (needRepeat === false) return;
      return repeatFn();
    });

    if (repeat) {
      return repeatFn();
    }

    return _do();
  }

  static initApi(cookie) {
    const apiOptions = this.getValue('apiOptions');
    const {signData = {}, options = {}, formatDataFn = data => data} = apiOptions;
    const {requestFnName, apiNames = []} = this.apiExtends;

    this.isWh5 && _.assign(signData, {client: 'wh5', clientVersion: '1.0.0'});
    if (this.needInJxApp) {
      this.needInApp = false;
      _.merge(options, {headers: {'user-agent': 'jdpingou'}});
    }
    if (this.needInSpeedApp) {
      this.needInApp = false;
      _.merge(options, {headers: {'user-agent': 'jdltapp'}});
    }
    this.needInApp && _.merge(options, {headers: {'user-agent': 'jdapp'}});
    this.needInAppComplete && _.merge(options, {headers: {'user-agent': this.appCompleteUserAgent}});
    this.needInAppComplete1 && _.merge(options, {headers: {'user-agent': appUserAgentNotUUID}});
    this.needInPhone && _.merge(options, {headers: {'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'}});
    this.needOriginH5 && _.merge(options, {headers: {origin: 'https://h5.m.jd.com'}});
    this.needOriginProMd && _.merge(options, {
      headers: {
        origin: 'https://pro.m.jd.com',
        referrer: 'https://pro.m.jd.com/',
      },
    });

    const api = new Api(cookie, signData, options, formatDataFn);
    if (requestFnName) {
      let apiObject = _.isArray(apiNames) ? _.zipObject(apiNames, apiNames) : apiNames;
      this.apiNameOptions = this.apiNamesFn();
      _.assign(apiObject, _.zipObject(_.keys(this.apiNameOptions), _.map(_.values(this.apiNameOptions), 'name')));
      for (const [key, functionId] of Object.entries(apiObject)) {
        api[key] = (...args) => api[requestFnName](functionId, ...args);
      }
    }
    return api;
  }

  /**
   * @deprecated
   */
  static async beforeInit() {
  }

  static async changeCK(api, force = false) {
    const targetForm = require('../../../charles/api').common.genToken.find(o => o.body.match('plogin.m.jd.com'));
    const log = (output, fileName) => api.log(output, fileName, '转换cookie');
    if (!targetForm) return log('genToken form 没找到');

    const cPtPin = 'pt_pin';
    const cPtKey = 'pt_key';
    const cWskey = 'wskey';
    const currentPin = api.cookieInstance.get(cPtPin);
    const cookieOption = findCurrentCookieOption(getEnv('JD_COOKIE_OPTION'));
    const originCookie = new Cookie(cookieOption.cookies);

    if (!originCookie.get(cWskey)) {
      getNowHour() === 0 && log(`当前cookie没有${cWskey}, 无需更新`);
      return;
    }

    if (!force) {
      const ptKeyExpire = _.get(cookieOption, 'expire.pt_key');
      if (ptKeyExpire && getMoment().add(29, 'd').isBefore(ptKeyExpire)) {
        return console.log(`cookie(${ptKeyExpire})还未过期, 无需更新`);
      }

      const logged = await api.loginValid();
      if (logged) {
        return console.log('还在登录状态中, 无需更新');
      }
    }

    const commonHeaders = {
      'user-agent': 'JD4iPhone/168714%20(iPhone;%20iOS;%20Scale/3.00);jdmall;iphone;version/12.0.4;build/168714;network/wifi;screen/1170x2532;os/16.5',
    };
    const {tokenKey, url} = await handleGenToken();
    if (!tokenKey || !url) return;
    if (tokenKey.startsWith('@')) {
      api.log(`tokenKey: ${tokenKey}`);
      api.logSignOut();
    }
    return updateCookieOptions(tokenKey, url);

    async function handleGenToken() {
      //{
      // 	"code": "0",
      // 	"tokenKey": "tokenKey",
      // 	"url": "https://un.m.jd.com/cgi-bin/app/appjmp"
      // }
      return api.doForm('genToken', targetForm, {
        ignoreDefault: true,
        headers: {
          // j-e-c, j-e-h 需自行抓包
          ..._.pick(_.get(cookieOption, 'loginConfig.headers'), ['j-e-c', 'j-e-h']),
          cookie: originCookie.toString([cPtPin, cWskey]),
          ...commonHeaders,
        },
      });
    }

    async function updateCookieOptions(tokenKey, url) {
      await api.doGetUrl(url, {
        ignoreDefault: true,
        resolveWithFullResponse: true,
        followRedirect: false,
        qs: {
          tokenKey,
          to: JSON.parse(targetForm.body).to,
        },
        headers: {
          cookie: originCookie.toString([cPtPin, cPtKey]),
          ...commonHeaders,
        },
      }).then(({response}) => {
        const setCookie = response.headers['set-cookie'];
        const cookie = new Cookie(setCookie);
        const newPtKey = cookie.get(cPtKey);
        if (newPtKey && newPtKey.startsWith('app_')) {
          const fullPtKey = setCookie.find(str => str.match(cPtKey));
          // 无需输出
          // log(`完整的 ${fullPtKey}`);
          const expireTime = fullPtKey.split(';').map(str => str.trim()).find(str => str.match('EXPIRES=')).replace('EXPIRES=', '');
          const expire = getMoment(new Date(expireTime)).format();
          const oldPtKey = cookieOption.cookies[cPtKey];
          _.merge(cookieOption, {
            cookies: {
              [cPtKey]: newPtKey,
            },
            expire: {
              [cPtKey]: expire,
            },
          });
          if (oldPtKey !== newPtKey) {
            api.cookie = cookie.toString([cPtPin, cPtKey]);
            log(`${cPtKey}发生了变化, ${formatJSONOutput([oldPtKey, newPtKey])}`);
          } else {
            const msg = `转换成功! ${cPtKey}没有变化`;
            log(msg);
            console.log(`[${addMosaic(currentPin)}] ${msg}`);
          }
          const jsonData = getProductEnv();
          _.merge(findCurrentCookieOption(jsonData['JD_COOKIE_OPTION']), cookieOption);
          updateProductEnv(jsonData);
          needUpdateAction = true;
          console.log(`[${addMosaic(currentPin)}] 转换成功并成功写入文件`);
        } else {
          console.log(`[${addMosaic(currentPin)}] 转换失败, 请查看报错`);
          console.log(response);
        }
      });
    }

    function findCurrentCookieOption(cookieOptions) {
      return cookieOptions.find(o => o['cookies'][cPtPin] === currentPin);
    }
  }

  static async start(data) {
    for (this.currentTimes = 1; this.currentTimes <= this.times; this.currentTimes++) {
      this.currentCookieTimes = 0;
      await this.loopInit(data, false);
    }
    await sleep(2);
  }

  // 定时任务
  static async cron(data) {
    await this.loopInit(data, true);
    await sleep(2);
  }

  static loopHours = [];
  static loopOnTime = true;
  static getLoopMinute = () => 55;

  static async loopRun(nextFn) {
    const self = this;
    const targetHour = getNextHour(self.loopHours, self.loopOnTime ? 55 : 0);
    const targetMinute = self.getLoopMinute();
    const nextMoment = getMoment();
    nextMoment.set('h', targetHour).set('m', targetMinute);
    const splitStr = `---------------------`;
    console.log(splitStr);
    console.log(`${getMoment().format()} [${self.getName()}] 定时执行(${nextMoment.format()})`);
    await sleepDate(nextMoment);
    await nextFn();
    return self.loopRun(nextFn);
  }

  static async loopInit(data, isCron) {
    const self = this;
    self._command = self._command || [];
    let currentCookieTimes = 0;
    data = _.concat(data);

    const patchEndTime = v => v && !/:/.test(v) ? `${v} 23:59:59` : v;
    self['activityEndTime'] = patchEndTime(self['activityEndTime']);
    let {activityStartTime, activityEndTime} = self;
    if (activityStartTime || activityEndTime) {
      if (getMoment().isAfter(activityEndTime) || getMoment().isBefore(activityStartTime)) {
        self.log(`活动已结束(${activityStartTime || '无'}至${activityEndTime || '无'})`);
        return;
      }
    }

    const patchData = o => {
      const cookieConfig = getEnv('JD_COOKIE_CONFIG');
      if (_.isEmpty(cookieConfig)) return;
      const key = o.cookie['pt_pin'];
      if (_.has(cookieConfig, key)) {
        const {scriptName: scriptNameConfig} = _.get(cookieConfig, key, {});
        const {disable, enable, disableShareCode, defaultShareCode = {}} = scriptNameConfig || {};
        const scriptName = self.scriptName;
        if (!_.isNil(enable) && !_.concat(enable).includes(scriptName) || _.concat(disable).includes(scriptName)) {
          o.disabled = true;
        }
        if (_.concat(disableShareCode).includes(scriptName)) {
          o.shareCodes = [];
        }
        o.shareCodes = _.filter(_.concat(o.shareCodes, _.get(defaultShareCode, scriptName)));
      }
    };

    if (self.getValue('concurrent')) {
      return parallelRun({
        list: data,
        runFn: _do,
        onceNumber: 1,
        onceDelaySecond: self.concurrentOnceDelay,
      });
    }

    for (const item of data) {
      await _do(item);
    }

    if (needUpdateAction) {
      needUpdateAction = false;
      // TODO 确认本地更新的话是否需要上传
      await uploadProductEnvToAction(true);
    }
    --initiativeChangeCkMaxTimes;
    await self.afterAllDone();

    async function _do(data) {
      patchData(data);
      const {cookie, shareCodes, disabled} = data;
      self.currentCookieTimes = currentCookieTimes;
      await self.beforeInit();
      await init(cookie, self.isFirstLoop() ? _.filter(_.concat(shareCodes)) : void 0, isCron, disabled);
    }

    async function init(cookie, shareCodes, isCron = false, disabled) {
      const api = self.initApi(new Cookie(cookie).toString(self.cookieKeys));
      // TODO 并发的情况下 api 的赋值不可用
      self.api = api;
      if (currentCookieTimes === 0) {
        api.isFirst = true;
      }
      // TODO 先用 currentCookieIndex 后面再整体改名
      api.currentCookieIndex = api.currentCookieTimes = currentCookieTimes++;
      const pinLabel = addMosaic(cookie['pt_pin']);
      api.log = (output, fileName, name) => self.log(output, fileName, `${api.currentCookieTimes}] [${pinLabel}`, name);
      api.clog = (msg, output = true) => {
        const str = `[${pinLabel}] ${msg}`;
        if (!output) {
          return str;
        }
        console.log(str);
      };
      // 提示未登录, 抛出异常
      api.logSignOut = (throwMsg = true) => {
        const msg = '未登录';
        api.log(msg);
        if (throwMsg) {
          throw api.clog(msg, false);
        } else {
          api.clog(msg);
          throw '';
        }
      };
      if (self.needChangeCK && initiativeChangeCkMaxTimes > 0) {
        await self.changeCK(api, processInAC() && [7, 14, 18, 22].includes(getNowHour()));
      }
      // 停止运行该脚本
      if (disabled) return;

      try {
        if (isCron) {
          await self.doCron(api, shareCodes);
        } else {
          await self.doMain(api, shareCodes);
        }
      } catch (e) {
        if (self.keepIndependence) {
          /* 存在抛出异常但是不想输出到 error.log 的情况 */
          e && api.log((e.stack || e).replace(`[${pinLabel}] `, ''), 'error');
          console.error(e);
        } else {
          throw e;
        }
      }
    }
  }
}

module.exports = Base;
