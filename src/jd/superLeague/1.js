const SuperLeague = require('./index');
const {singleRun} = require('../../lib/common');

class SuperLeague1 extends SuperLeague {
  static scriptName = 'SuperLeague1';
  static scriptNameDesc = '抽超市卡1';
  static originUrl = 'https://pro.m.jd.com/mall/active/4AmRjcUVTjihVZVmpKjCm8tTxggV/index.html?stath=47&navh=44&taskId=6239&from=kouling&activityChannel=jdapp&femobile=femobile&tttparams=iAMGjzNdeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiIxMzI0MTE4OTU4NSIsImxhdCI6IjAuMDAwMDAwIiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicmZzIjoiMDAwMCIsInBvc0xuZyI6IjExMy40NzQ4MDEiLCJncHNfYXJlYSI6IjBfMF8wXzAiLCJsbmciOiIwLjAwMDAwMCIsInVlbXBzIjoiMC0wLTAiLCJnTG5nIjoiMTEzLjQ3NDgwMSIsIm1vZGVsIjoiaVBob25lMTMsMyIsImRMbmciOiIifQ8%3D%3D&inviter=xaxWXY5sf2Qou4xX2THKNA';
}

singleRun(SuperLeague1).then();

module.exports = SuperLeague1;
