const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const download = require('download');
const {getNowHour, getNowTime, getNowDate} = require('./moment');

const _sleep = require('util').promisify(setTimeout);
/**
 *
 * @param seconds {number}
 */
const sleep = (seconds = 1) => _sleep(seconds * 1000);

const formatJSONOutput = object => JSON.stringify(object, void 0, 2);

const logPath = path.resolve(__dirname, '../../logs');
const getLogFile = (fileName, date = getNowDate(), returnContent = false) => {
  const filePath = path.resolve(logPath, `${fileName}${date ? '.' : ''}${date || ''}.log`);
  return returnContent ? getFileContent(filePath, '').toString() : filePath;
};
const cacheWriteStream = {};
const printLog = (scriptName = '', fileName = 'app', output, type = 'info', maxLength) => {
  const filePath = path.extname(fileName) ? fileName : getLogFile(fileName);
  const writeStream = cacheWriteStream[filePath] = cacheWriteStream[filePath] || fs.createWriteStream(filePath, {
    flags: 'a',
    autoClose: true,
    emitClose: true,
  }).on('close', () => {
    // TODO 执行 writeStream.close()
    cacheWriteStream[filePath] = null;
    console.log(`${getNowTime()} ${filePath} writeStream closed`);
  });
  const _log = chunk => {
    _.isPlainObject(chunk) && (chunk = JSON.stringify(chunk));
    if (maxLength) {
      chunk = chunk.substring(0, maxLength) + '...more';
    }
    writeStream.write(`${getNowTime()} [${scriptName}] [${type}] ${chunk}\n`);
  };
  [].concat(output).forEach(_log);
  process.emit('printLog');
};
const cleanLog = (fileName) => {
  fs.writeFileSync(getLogFile(fileName), '');
  process.emit('printLog');
};
const extractLogToObject = str => {
  if (!str) return;
  let result = /^(\d{2}:\d{2}:\d{2}) \[(.*)] \[(\w*)] \[(\d)] \[(.\*\*\*.)] (.*)/.exec(str);
  if (!result) {
    result = /^(\d{2}:\d{2}:\d{2}) \[(.*)] \[(\w*)] \[(\d)] (.*)/.exec(str);
  }
  if (!result) {
    result = /^(\d{2}:\d{2}:\d{2}) \[(.*)] \[(\w*)] (.*)/.exec(str);
  }
  if (result) {
    let [, time, name, type, cookie, cookieName, msg] = result;
    if (!cookieName) {
      msg = cookieName;
      cookieName = cookie;
    }
    return {time, name, type, cookie, cookieName, msg, origin: str};
  } else {
    return {origin: str};
  }
};
const getLogs = (...args) => {
  args[2] = true;
  return _.filter(getLogFile(...args).split(/[\n|\r]/)).filter(v => args[0] === 'error' ? v.match(/^\d+/) : v).map(extractLogToObject);
};

const getFileContent = (filePath, defaultValue = '') => fs.existsSync(filePath) ? fs.readFileSync(filePath) : defaultValue;
const _getAbsolutePath = (fileName, dirname) => dirname ? path.resolve(dirname, fileName) : fileName;
// 将json写入文件中
const writeFileJSON = (data, fileName, dirname) => fs.writeFileSync(_getAbsolutePath(fileName, dirname), formatJSONOutput(data), {encoding: 'utf-8'});
const readFileJSON = (fileName, dirname, defaultValue = {}) => {
  const absolutePath = _getAbsolutePath(fileName, dirname);
  const data = getFileContent(absolutePath);
  if (!data) return defaultValue;
  let result;
  try {
    result = JSON.parse(data.toString());
  } catch (e) {
    console.log(e);
  }
  result = result || defaultValue;
  return result;
};

function getSortLogContent(groupType, content) {
  content = (content || getFileContent(getLogFile('app'))).toString();
  const array = content.split(/[\n|\r]/);
  let result = _.filter(array).map(extractLogToObject);
  if (groupType) {
    const groupTypes = _.concat(groupType);
    const _group = (array, types) => {
      if (_.isEmpty(types)) return array;
      const type = types.shift();
      const object = _.groupBy(array, type);
      _.forEach(object, (o, key) => {
        object[key] = _group(o, _.concat(types));
      });
      return _.flattenDeep(_.values(object));
    };
    result = _group(result, groupTypes);
  }
  return _.map(result, 'origin').join('\n');
}

async function parallelRun({list, runFn, onceNumber = list.length, onceDelaySecond = 0}) {
  let invalidIndex = 0;
  let delaySecond = 0;
  return Promise.all(list.map((item, index) => {
    let second = delaySecond;
    if (item && (index + 1) % onceNumber === 0) {
      if (invalidIndex++ > 0) {
        second += onceDelaySecond;
      }
    } else if (!item) {
      // 增加点差别
      second += 0.001;
    }
    delaySecond = second;
    return new Promise(async resolve => {
      await sleep(second);
      resolve(await runFn(item));
    });
  }));
}

async function parallel(fns) {
  return Promise.all(fns.map(fn =>
    new Promise(async resolve => {
      const result = await fn();
      resolve(result);
    })));
}

/**
 * @description 获取重定向链接(短链接)的真正URL
 * @param uri{string}
 * @param after200Fn{function}
 * @param options{object}
 * @return {Promise<string>}
 */
async function getRealUrl(uri, after200Fn = void 0, options = {}) {
  !/^https?:\/\//.test(uri) && (uri = `https://${uri}`);
  _.assign(options, {
    uri, followRedirect: false,
    resolveWithFullResponse: true,
  });
  let url;
  try {
    url = new URL(uri);
  } catch (e) {}
  if (!url) return Promise.resolve('');
  if (url.host === 'u.jd.com') {
    after200Fn = body => {
      const urlPrefix = 'var hrl=\'';
      const prefixMatch = body.match(urlPrefix);
      if (!prefixMatch) return;
      return body.substring(prefixMatch.index + urlPrefix.length, body.match('\';var ua=').index);
    };
  }
  return rp(options).then(res => {
    if (res.statusCode === 200) {
      const body = res.body;
      if (!after200Fn) {
        console.log(`${uri} 不需要302`);
        return uri;
      }
      const newUri = after200Fn(body);
      if (!newUri) return console.log(`${uri}, 获取出错`);
      return getRealUrl(newUri, after200Fn, options);
    }
  }).catch(function (error) {
    const res = error.response;
    if (_.get(res, 'statusCode') === 302) {
      const realUrl = _.property('headers.location')(res);
      console.log('真正的URL地址如下:');
      console.log(realUrl);
      return realUrl;
    }
    console.log(`${uri}, 获取出错`);
  });
}

function getOriginDataFromFile(filePath) {
  return fs.existsSync(filePath) ? _.filter(fs.readFileSync(filePath).toString().split(/\r?\n/g)) : [];
}

function getUrlDataFromFile(filePath, addPrefix = true) {
  const array = getOriginDataFromFile(filePath);
  return array.filter(str => !str.startsWith('mp://'))
  .map(str => str.match(/[\u4e00-\u9fa5]/) ? '' : /^https?:\/\//.test(str) ? str : addPrefix ? `https://${str}` : '')
  .filter(str => {
    let result = !!str;
    try {
      new URL(str);
    } catch (e) {
      result = false;
    }
    return result;
  });
}

/**
 * @description 字符串化Object的值
 * @param target {Object}
 */
function objectValuesStringify(target) {
  if (_.isEmpty(target)) return;
  for (const [key, value] of Object.entries(target)) {
    if (!_.isString(value)) {
      try {
        target[key] = JSON.stringify(value);
      } catch (e) {
      }
    }
  }
}

/**
 * @description 根据正则匹配居于中间的数据
 * @param target {string}
 * @param reg {RegExp|undefined} 正则表达式, eg: /"test":"(\w*)"/
 * @param prefix {string|undefined} 匹配的开始
 * @param suffix {string|undefined} 匹配的结尾
 * @param match {string|undefined} 需要找出的内容
 * @return {string}
 */
function matchMiddle(target, {reg, prefix, suffix, match = '\w'}) {
  reg = reg || new RegExp(`${prefix}(${match}*)${suffix}`);
  const execResult = reg.exec(target) || [];
  return execResult[1] || '';
}

/**
 * @description 单个文件运行脚本
 * @param target {Class}
 * @param method {String|Array|undefined}
 * @param runFn {Function|undefined}
 * @return {Promise|*}
 */
async function singleRun(target, method = 'start', runFn = null) {
  const {updateProcessEnv, getCookieData} = require('./env');
  const [nodePath, filePath, command1/*method*/, command2/*cookie index*/, ...command3/*other params*/] = process.argv;
  const fileName = path.basename(filePath);
  let scriptName1 = fileName.replace(/\.js$/, '');
  const fileParentDirName = path.basename(path.dirname(filePath));
  // 必须是当前执行的文件, 避免被继承的类被执行
  const scriptName = target.scriptName;
  const isCurrentFile = eq(scriptName, scriptName1) || eq(scriptName, `${fileParentDirName}${scriptName1 === 'index' ? '' : scriptName1}`);

  let promise;

  for (const m of _.concat(method)) {
    if (command1 === m && isCurrentFile) {
      exec('node src/shell/updateEnvFromMail.js');
      updateProcessEnv();
      const _getCookie = _.wrap(getCookieData(), data => [undefined, '*', '.'].includes(command2) ? data : data.map((o, index) => command2.split(',').map(v => +v).includes(index) ? o : 0));
      command3.forEach((v, i) => {
        if (/^\d+$/.test(v)) {
          command3[i] = +command3[i];
        } else {
          try {
            command3[i] = JSON.parse(v);
          } catch (e) {}
        }
      });
      target._command = command3;
      promise = await (runFn ? runFn(m, _getCookie) : target[m](_getCookie()));
    }
  }

  return promise;

  function eq(value, other) {
    return _.eq(..._.map([value, other], _.toLower));
  }
}

function replaceObjectMethod(context, method, patchArgsFn) {
  const target = context[method];
  context[method] = async (...args) => target.apply(context, await patchArgsFn(args));
}

/**
 * @description 从Function获取其他类型获取值
 * @param target {Function|*}
 * @param option {Object}
 * @return {*}
 */
function getValueByFn(target, option = {}) {
  const {context} = option;
  return _.isFunction(target) ? target.call(context) : target;
}

/**
 * @description 下载文件
 * @param urls {Array}
 * @param dirname __dirname
 */
function downloadFile(urls, dirname) {
  urls.forEach(async url => {
    await download(url, dirname);
  });
}

/**
 * @description 敏感信息部分打码
 */
function addMosaic(str, options) {
  if (!str) return '';
  const {prefix = 1, suffix = 1, mosaicL = 3, mosaic = '*'} = options || {};
  return str.substring(0, prefix) + Array(mosaicL).fill(mosaic).join('') + str.substring(str.length - suffix);
}

/**
 * @description 格式化完整路径
 * @param config {Object}
 * @param action {String}
 * @return {String}
 */
function formatFullPath(config, action) {
  /**
   * @description 扁平化 path object
   * @param config {Object}
   * @param prefixPaths {Array}
   * @return {FlatArray<Array|String>}
   */
  const flattenPath = (config, prefixPaths = []) =>
    _.flattenDeep(_.map(config, (actions, resource) =>
      _.map(actions, action =>
        _.isString(action)
          ? _.concat(prefixPaths, resource, action).join('/')
          : flattenPath(action, _.concat(prefixPaths, resource)))));

  return flattenPath(config).find(str => str.endsWith(action)) || action;
}

(function initProcessExit() {
  process.on('exit', function () {
    process.emit('beforeExit');
  });

  // catch ctrl+c event and exit normally
  process.on('SIGINT', function () {
    console.log('Ctrl-C...');
    process.exit(2);
  });

  //catch uncaught exceptions, trace, then exit normally
  process.on('uncaughtException', function (e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
  });
})();

const execAsync = list => Promise.all(list.map(command => new Promise(resolve => {
  exec(..._.toArray(command));
  resolve();
})));

/**
 *
 * @param command {String|Array}
 * @param options {Object}
 * @return {Promise|undefined}
 */
async function exec(command, options = {}) {
  let args;

  // disable node warnings
  command = command.replace(/^node/, 'node --no-warnings');

  [command, ...args] = _.isArray(command) ? command : splitCommand(command);

  if (process.platform === 'win32') {
    [
      ['npm', 'npm.cmd'],
    ].forEach(array => {
      command = String.prototype.replace.apply(command, array);
    });
  }

  const child = require('child_process').spawnSync(command, args, {
    stdio: ['inherit', 'inherit', 'inherit'],
    /* 避免路径错误 */
    cwd: path.resolve(__dirname, '../../'),
    ...options,
  });

  // 不需要打印出来需主动返回数据
  if (child.stdout) {
    if (!child.stdout.on) {
      return Promise.resolve(child.stdout.toString());
    }
    return new Promise((resolve, reject) => {
      child.stdout.on('data', data => resolve(`${data}`));
      child.stderr.on('data', data => reject(`${data}`));
    });
  }

  // 匹配双引号
  function splitCommand(str, searchString = '"') {
    const commands = [];
    let c = '';
    const _update = v => {
      commands.push(v);
      c = '';
    };
    str.split('').forEach((v, i) => {
      if (c.startsWith(searchString) && v === searchString) {
        _update(c.substring(1));
      } else if (v !== ' ' || (c.startsWith(searchString) && v === ' ')) {
        c += v;
        if (str.split('').length - 1 === i) {
          _update(c);
        }
      } else if (c && !c.startsWith(searchString)) {
        _update(c);
      }
    });
    return commands;
  }
}

function convertQuery(str) {
  return Object.fromEntries(new URLSearchParams(str));
}

module.exports = {
  sleep,

  getLogFile,
  getLogs,
  printLog,
  cleanLog,
  extractLogToObject,
  getSortLogContent,

  getFileContent,
  writeFileJSON,
  readFileJSON,

  parallel,
  parallelRun,

  getRealUrl,
  getUrlDataFromFile,
  getOriginDataFromFile,

  objectValuesStringify,
  matchMiddle,

  singleRun,

  replaceObjectMethod,

  getValueByFn,

  downloadFile,

  addMosaic,

  formatFullPath,
  formatJSONOutput,

  exec,
  execAsync,

  convertQuery,
};
