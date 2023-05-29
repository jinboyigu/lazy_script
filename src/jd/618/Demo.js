const Template = require('./Promote');

const {singleRun} = require('../../lib/common');

class Demo extends Template {
  static scriptName = 'Demo';
  static scriptNameDesc = 'Demo';
  static dirname = __dirname;

  // TODO 填写自定义数据
  static shareCodeTaskList = [];
  static skipTaskIds = [];
  static indexUrl = '';
  static baseForm = {
    appid: 'appid',
    clientVersion: 'clientVersion',
    client: 'client',
  };
}

singleRun(Demo).then();

module.exports = Demo;
