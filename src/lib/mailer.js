/**
 * 邮件通知
 */

const _ = require('lodash');
const fs = require('fs');
const nodemailer = require('nodemailer');
const MailParser = require('mailparser').MailParser;
const {getEnv, updateProductEnv, getProductEnv} = require('./env');
const {getMoment} = require('./moment');
const {readFileJSON, writeFileJSON, formatJSONOutput, sleep} = require('./common');
const Imap = require('imap');
const {inspect, promisify} = require('util');

const getTransportOption = () => getEnv('MAILER_TRANSPORTER_OPTION');
const getUser = () => _.property('auth.user')(getTransportOption());
const disabledSend = () => !getUser();
const getImapOption = () => getEnv('MAILER_IMAP_OPTION');

function createTransport(option = {}) {
  if (disabledSend()) return;
  _.merge(option, {
    port: 465,
    secure: true,
  }, getTransportOption());
  return nodemailer.createTransport(option);
}

function send(option) {
  const transport = createTransport();
  if (!transport) return;
  const from = getUser();
  return transport.sendMail(_.defaults(option, {from, to: from})).then(async result => {
    console.log('邮件发送成功');
    const sentBox = _.get(getEnv('MAIL_BOX_NAME'), 'autoDeleteSentMail');
    const {subject} = option;
    if (subject && sentBox) {
      console.log(`准备删除[${sentBox}]中的${subject}`);
      await sleep(2);
      await search({
        since: getMoment().format('LL'),
        realDelFn: message => message.subject === subject,
        boxName: sentBox,
      });
    }
    return result;
  }).catch(error => {
    console.log(error);
    console.log('邮件发送失败');
  });
}

const search = promisify(_search);
const searchSeen = options => search({seen: true, ...options});
const searchSeenAndDel = options => searchSeen({realDelFn: (message, isSeen) => isSeen, ...options});

function _search({subject, since, seen, realDelFn = _.noop, boxName = 'INBOX'}, callback) {
  const imapOption = getImapOption();
  if (!imapOption) return;
  // 默认不开启debug模式
  const debug = false;
  if (debug) {
    imapOption.debug = output => console.log(`[IMAP DEBUG] ${output}`);
  }
  const imap = new Imap(imapOption);
  const _call = (path, ...options) => promisify(_.get(imap, path).bind(imap))(...options);
  imap.once('ready', async () => {
    await _call('id', {name: `custom_${getMoment().valueOf()}`});
    const boxInfo = await _call('openBox', boxName, false);
    if (!boxInfo) {
      throw boxInfo;
    }
    const searchParams = [];
    subject = void 0;
    subject && searchParams.push(['HEADER', 'SUBJECT', subject]);
    since && searchParams.push(['SINCE', since]);
    /**
     * @type {Array}
     */
    let searchResult = await _call('search', _.isEmpty(searchParams) ? ['ALL'] : searchParams);
    // TODO subject 一般是搜索不精确的, 所以需要再重新搜索
    if (_.isEmpty(searchResult) && !since) {
      searchParams[0] = 'ALL';
      searchResult = await _call('search', searchParams);
    }
    if (realDelFn) {
      searchResult = _.takeRight(searchResult, 5);
    }
    if (_.isEmpty(searchResult)) {
      imap.end();
      callback(void 0, seen ? false : []);
      return;
    }
    const messages = await promisify(fetchMessage)(searchResult);
    debug && writeFileJSON(messages, 'messages.json', __dirname);
    const messageList = subject ? messages.filter(o => o.subject === subject) : messages;
    let isSeen;
    for (const message of messageList) {
      isSeen = _.get(message, 'attrs.flags', []).includes('\\Seen');

      if (realDelFn(message, isSeen)) {
        const {subject, attrs: {uid}} = message;
        await _call('addFlags', uid, ['\\Deleted']).then(() => {
          console.log(`邮件删除成功(uid: ${uid}, subject: ${subject})`);
        });
      }
    }


    imap.end();
    callback(void 0, seen ? isSeen : messageList);

    /**
     *
     * @param msgIds {Array}
     * @param callback {Function}
     * @return {Promise<Array>}
     */
    function fetchMessage(msgIds, callback) {
      const result = [];
      const f = imap.fetch(msgIds, {
        bodies: '',
        struct: true,
      });
      f.on('message', function (msg, seqNo) {
        debug && console.log('Message #%d', seqNo);
        const prefix = '(#' + seqNo + ') ';
        const msgInfo = {};
        msg.on('body', function (stream, info) {
          const mailParser = new MailParser();
          stream.pipe(mailParser);//将为解析的数据流pipe到 mailparser
          mailParser.on('headers', headers => {
            _.assign(msgInfo, {
              to: headers.get('to').text,
              from: headers.get('from').text,
              subject: headers.get('subject'),
              date: headers.get('date'),
              headers: _.fromPairs(_.toPairs(headers)),
            });

            mailParser.on('data', function (data) {
              if (data.type === 'text') {//邮件正文
                if (debug) {
                  console.log('邮件内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
                  console.log('邮件内容: ' + data.html || data.text || JSON.stringify(data));
                }
                _.assign(msgInfo, _.pick(data, ['html', 'text', 'textAsHtml']));
              }
              // TODO 目前不需要附件
              if (false && data.type === 'attachment') {//附件
                console.log('邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
                console.log('附件名称:' + data.filename);//打印附件的名称
                data.content.pipe(fs.createWriteStream(data.filename));//保存附件到当前目录下
                data.release();
              }
            });
          });
          mailParser.on('end', () => {
            result.push(msgInfo);
            if (result.length === msgIds.length) {
              // 根据时间降序去重排
              result.sort((m1, m2) => getMoment(m1.date).isBefore(m2.date) ? 1 : -1);
              callback(void 0, result);
            }
          });
        });
        msg.once('attributes', function (attrs) {
          _.assign(msgInfo, {attrs});
          debug && console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        });
        msg.once('end', function () {
          debug && console.log(prefix + 'Finished');
        });
      });
      f.once('error', function (err) {
        callback(void 0, result);
        debug && console.log('Fetch error: ' + err);
      });
      f.once('end', function () {
        debug && console.log('Done fetching all messages!');
      });
    }
  });

  imap.once('error', function (err) {
    debug && console.log(err);
  });

  imap.once('end', function () {
    debug && console.log('Connection ended');
  });

  imap.connect();
}

const newEnvSubject = 'lazy_script_new_env';

/**
 * @description 将新的 env 发送到邮件, 本地更新采用 merge 模式, 所以需要保证数据源完整性(Array不需要更改的数据也要留好位置)
 * @example {"JD_COOKIE_OPTION":[{},{},{},{"cookies":{"wq_skey":"test"}}]}
 */
function sendNewEnv(content, fileName = '.env.new.json') {
  const newEnvPath = require('path').resolve(__dirname, `../../${fileName}`);
  content = content || readFileJSON(newEnvPath);
  if (_.isEmpty(content)) return console.log('无需更新内容');
  send({
    subject: `${newEnvSubject}_${getMoment().formatDate()}`,
    text: formatJSONOutput(content),
  }).then(() => {
    writeFileJSON({}, newEnvPath);
  });
}

/**
 * @description 获取邮件信息更新本地 env
 */
async function updateEnvFromMail(day = 7) {
  const nowMoment = getMoment();
  const getNewEnvs = () => search({
    since: nowMoment.subtract(day, 'day'),
    boxName: _.get(getEnv('MAIL_BOX_NAME'), 'updateEnvFromMail'),
  }).then(messages =>
    messages.filter(o => o.subject.startsWith(newEnvSubject)).map(({text}) => {
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {}
      return result;
    }));
  const allNewEnvs = await getNewEnvs();
  if (_.isEmpty(allNewEnvs)) return console.log(`没有找到相应数据(${nowMoment.formatDate()}~至今)`);
  const newEnv = _.merge({}, ...allNewEnvs.reverse());
  const oldProductEnv = getProductEnv();
  const newProductEnv = _.merge({}, oldProductEnv, newEnv);
  if (JSON.stringify(oldProductEnv) === JSON.stringify(newProductEnv)) {
    return console.log('[updateEnvFromMail] 数据一致, env 不需要更新');
  }
  console.log(`[updateEnvFromMail] 开始从邮件内容中更新`);
  console.log(formatJSONOutput(newEnv));
  updateProductEnv(newEnv, false, true);
}


module.exports = {
  disabledSend,
  disabledImap: () => !getImapOption(),
  send,
  sendNewEnv,
  updateEnvFromMail,
  search,
  searchSeen,
  searchSeenAndDel,
};
