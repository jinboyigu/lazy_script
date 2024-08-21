/**
 * @description app 通用调用方法
 */

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const {getLogFile, sleep, parallelRun, getFileContent, getSortLogContent, getLogs} = require('./lib/common');
const {getNowDate, getMoment} = require('./lib/moment');
const {getCookieData} = require('./lib/env');
const {doPolling} = require('./lib/cron');
const serverChan = require('./lib/serverChan');
const mailer = require('./lib/mailer');
const TemporarilyOffline = {start: _.noop, cron: _.noop, getName: () => 'TemporarilyOffline'};

let errorOutput = [];

const _filterTemporarilyOff = list => _.filter(_.concat(list), o => !_.isEqual(o, TemporarilyOffline));

async function multipleRun(targets, onceDelaySecond = 1) {
  return parallelRun({
    list: _filterTemporarilyOff(targets),
    runFn: item => doRun(..._.concat(item)),
    onceDelaySecond,
  });
}

async function serialRun(targets, runFn = doRun) {
  return parallelRun({
    list: _filterTemporarilyOff(targets),
    runFn: item => runFn(..._.concat(item)),
    onceDelaySecond: 10,
    onceNumber: 1,
  });
}

async function doRun(target, cookieData = getCookieData(target.scriptName), method = 'start') {
  const name = target.getName();
  const timeLabel = `[${getMoment().format('YYYY-MM-DD HH:mm:ss.SSS')}] [${name}] do ${method}`;
  console.time(timeLabel);
  let result;
  try {
    result = await target[method](cookieData);
  } catch (e) {
    // TODO 估计不会抛出异常了, 因为基本在 base/index.js(keepIndependence=true)中捕获了
    errorOutput.push(`[${name}] error:`);
    errorOutput.push(e.stack);
    errorOutput.push('----------------------');
    console.error(e);
  }
  console.timeEnd(timeLabel);
  return result;
}

async function doCron(target, cookieData = getCookieData()) {
  return doRun(target, cookieData, 'cron');
}

// 本地测试
async function doRun1(target, index = 0, needScriptName = false) {
  await doRun(target, getCookieData(needScriptName ? target.scriptName : void 0)[index]);
}

async function doCron1(target, index = 0) {
  await doCron(target, getCookieData()[index]);
}

async function sendNotify({sendYesterdayLog = false, subjects = []}) {
  if (mailer.disabledSend() && serverChan.disabled) return;

  const sortLogByName = content => getSortLogContent('name', content);
  const contents = [];
  const yDay = getMoment().subtract(1, 'd').formatDate();
  if (sendYesterdayLog) {
    const yesterdayLog = getLogFile('app', yDay);
    contents.push(sortLogByName(getFileContent(yesterdayLog)));
    contents.push(`\n--------------------------${getNowDate()}-start--------------------------\n`);
  }
  contents.push(sortLogByName());
  // result.txt 不再输出
  // const resultContent = getFileContent(path.resolve(__dirname, '../dist/result.txt'));
  // contents.push(resultContent);

  const [mainSubject = 'lazy_script', ...otherSubject] = subjects;
  const getSubject = (str = mainSubject) => [str].concat(otherSubject).join('_');

  const errorLogs = _.filter([
    ...sendYesterdayLog ? getLogs('error', yDay) : [],
    ...getLogs('error'),
  ]);
  const getMsgs = array => array.map(o => o.origin);
  if (!_.isEmpty(errorLogs)) {
    errorOutput.unshift(...[
      'error.log\n',
      ...getMsgs(errorLogs),
      '----------------------',
      '\ndoRun error\n',
    ]);
  }
  if (!_.isEmpty(errorOutput)) {
    errorOutput.push('\n\nrequest.log\n');
    const requestLogs = _.filter([
      ...sendYesterdayLog ? getLogs('request', yDay) : [],
      ...getLogs('request'),
    ]);
    mailer.send({
      subject: getSubject(`${mainSubject}_error`),
      text: errorOutput
      // TODO 先精确到分的请求
      .concat(getMsgs(requestLogs.filter(o => errorLogs.map(o => (o.time || '').replace(/:\d\d$/, '')).includes((o.time || '').replace(/:\d\d$/, '')))))
      .join('\n'),
    });
    errorOutput = [];
  }
  const content = contents.map(v => v || '').join('');
  if (!content) return;
  const title = getSubject();
  await mailer.send({
    subject: title, text: content,
  });
  await serverChan.send(title, content);
}

module.exports = {
  multipleRun,
  serialRun,
  doRun,
  doRun1,
  doCron,
  doCron1,
  TemporarilyOffline,
  sendNotify,
};
