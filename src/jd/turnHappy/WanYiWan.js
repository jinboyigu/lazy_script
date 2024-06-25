const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class WanYiWan extends Template {
  static scriptName = 'WanYiWan';
  static scriptNameDesc = '玩一玩(领奖券)';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {version: 1},
    appid: 'signed_wh5',
    client: 'apple',
    clientVersion: '13.1.0',
  });
  static needInAppDynamicTime = true;
  static keepIndependence = true;
  static times = this.getNowHour() === 7 ? 2 : 1;
  static activityEndTime = '2024-08-31';

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'referer': 'https://pro.m.jd.com/mall/active/3fcyrvLZALNPWCEDRvaZJVrzek8v/index.html?stath=47&navh=44&tttparams=II5EwO1beyJnTGF0IjoiMjIuOTQzMTA1Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDMxMDUiLCJwb3NMbmciOiIxMTMuNDc0NzE4IiwiZ3BzX2FyZWEiOiIwXzBfMF8wIiwibG5nIjoiMC4wMDAwMDAiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn80%3D&hideAnchorBottomTab=1&babelChannel=ttt16&hybrid_err_view=1&hideTopFoot=1&topNavStyle=1&commontitle=no&jwebprog=0&disablePageSticky=1&transparent=1',
          'x-referer-page': 'https://pro.m.jd.com/mall/active/3fcyrvLZALNPWCEDRvaZJVrzek8v/index.html',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        // TODO 加了 h5st 会报错
        // wanyiwan_home: {appId: 'c81ad'},
        // wanyiwan_do_task: {appId: '89db2'},
        // wanyiwan_assist: {appId: 'ba505'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);
    const exchange = _.get(self._command, 0);

    const getForm = str => {
      const form = formatPasteData(str);
      delete form['x-api-eid-token'];
      return {form};
    };

    const formData = {
      wanyiwan_do_task: [
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8801959979","taskType":1,"assignmentId":"27Y9NFyraGN9AK83XLqWggAMP21t","actionType":1,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
t\t1719309472900
h5st\t20240625175752907;55i56g9yt5zii5i6;89db2;tk03w9d5b1b9241lMisxKzJ4Mm1vvc2_1pd5w0FLI3-X_da1V9FgBiyDZRcYnce2WfSAQa0sToBfKDHzZrLel3N4-YSB;1e2a2e85d522261febd026d28319295a2f3fecf612b2c77ad8a8eed64e168580;4.7;1719309472907;TKmWq34TH8U5qvksilMVZVluzDF53w4TFm3vgT1JdT43nxMe1_b0JYzj22poahX8-aqGkzoKITPAHm-kB4wtQWLeu12C4Tv5-qTBr26mOGOQEJ0jC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8801959979","taskType":1,"assignmentId":"27Y9NFyraGN9AK83XLqWggAMP21t","actionType":0,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309488757
h5st\t20240625175808764;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;2b83599e2fb1d033019dd7c514ed2b3f9da378fa5f0d8aa7729c665163efbbf1;4.7;1719309488764;TKmW2fn5uWBR4lkuJV7EZ0HVpOzcE1kOb968AMTghhDOgthiOnAk05EZejZmncARSv7eXVvz6mWlAu0zm8G89DSIYn0X4mxz8PqB0uyZFN1gJYojC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"0601972489","taskType":1,"assignmentId":"Qk9QDy97r8nCVDsfNVAQv5UAwY3","actionType":1,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309868560
h5st\t20240625180428573;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;64bd1ba0acf846ce43691c90b9f4c6dcf10dc3505e68ac069c63126c617667a4;4.7;1719309868573;TKmWJqcMKBjADhrRdhg_Cs338Js_4QWS5_iFutdOET8Ti5hLRPz1KyVE5mlMg23Bixca3oanNh0bTasnP_aNGINBq49RgLerla8NRnHDzeOy5IwjC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"0601972489","taskType":1,"assignmentId":"Qk9QDy97r8nCVDsfNVAQv5UAwY3","actionType":0,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309880404
h5st\t20240625180440411;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;2b22451e9ba6faf00153d3262b8ef4e97f689a8cc1f0c560f2f8633d62d78c8a;4.7;1719309880411;TKmWypaDWcumK07mYkYB0BmZom-MQiI9a-gol4qe6r0U3j0Smz7A7-FhygjpuAfdo56NRt5os-o1AxhjpvSZZrhH5qPIKdVXWHA24kGDxOB6ES1jC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8901958387","taskType":1,"assignmentId":"4QQCDcqmVpkddEVBWuviwF5jz9XK","actionType":1,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309909752
h5st\t20240625180509765;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;5d40806795716a74d28c3fcfccce3c0916e9aee687962d55ddc159fe194e160a;4.7;1719309909765;TKmWH0qRqyf73Po2rL9rIXgqU1di8sQjE8nUGkIEvFc48-h_O0By_OF62vNouND0RZrvga3dOzyw25kCj7nkXWkkonjJnsQVfLYlVu5GimIhFEvjC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8901958387","taskType":1,"assignmentId":"4QQCDcqmVpkddEVBWuviwF5jz9XK","actionType":0,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309925351
h5st\t20240625180525354;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;83c176292b48c042214969028a7f67ea69cbf8c7e19b78d786124c17bb96e1e5;4.7;1719309925354;TKmWwbnRrWJ5y_msjK00X-zPuleWj3e2nGETBaTyFWEBiFqrGJ9ZSFFwQtuNcjfTFZMx4-Df8BrtwTC2XjpbUjLaq4K3COPiD2H-UkKQBIUJmqwjC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8701970802","taskType":1,"assignmentId":"29q8EDjV4AzUCFTUayqE2eRcXVs7","actionType":1,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309948244
h5st\t20240625180548254;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;9489c73393aedc864967d624bbfa432feee210c77011f3c7509389e2059259cb;4.7;1719309948254;TKmWXhjYKmR9PACsScq3_dqVfo6C7SpWbfgEaRTmYWZU2EsKCkCpb9JUE9st3V5Ywfm8hYa4-OZgZB9MR7VRB_7fW9-QZaLW88BNJaIX7AX_HwnjC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8701970802","taskType":1,"assignmentId":"29q8EDjV4AzUCFTUayqE2eRcXVs7","actionType":0,"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3JPEDIAAAAAD4AETUXV6PMVTIX
t\t1719309966757
h5st\t20240625180606764;55i56g9yt5zii5i6;89db2;tk03w8a701bb718nwBu2x1JD7Kf2UTGpsVA8TJbVFQEf00vtLLUhGzLWgl1d5C_lGhnb7xSeoXo0bFTS_NV9Cr6uCZuD;01d24c6ba5daf82718d3f9195de3eca0c44fcf4dabc069c7d70b00491173da00;4.7;1719309966764;TKmW9Ir8r88fjdcBDseBnI7qjZDh1QrAuu0AbWZK0FbYs1KwL2m6t8BKRRLC4IJGBF4se9eKOT5a7khOp9gtsmMGIvFlZmwUX8gn4UBg8YRx4CrjC5PMdasSLCQEvA8d5sWSsspw_GoeboV_aEkRJQYEQ53T99h3yObDVvqVokDYQY9BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
      ],
      wanyiwan_home: [
        `functionId\twanyiwan_home
appid\tsigned_wh5
body\t{"outsite":0,"firstCall":1,"version":1,"lbsSwitch":false}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3DC5LYAAAAACS2MWIMFYIGZ2AX
t\t1719308540300
h5st\t20240625174220307;nyiyy6tz9mgnn5i4;c81ad;tk03weaac1d9918n0OZjzkvEmCzafdesFXjzHFuTCfiQd8pANpm5NY6tsXFogCHZjieEf2NPtPqLv8ihsXqplAtFn6BF;0cac4941aa8f22d33c2d295b0de83e64dff8747c18e770cffcfedcee1df8c523;4.7;1719308540307;TKmWqfuCUsO8MUK4YYCBaP6tP9LKDnEIETmSq_VRLB8KRyU_q1qJX9dgLhPAmgFw_XPgC1TcMjc7mqZIGB2_pqzdK16f74BvxJhoaAC_NWOnMkDru_GKiwqMqP8cyZMzQS-yCZRK30f8ixTXcPqTJXUHQm0lTonzTvofEbd71VtUrEGBlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_home
appid\tsigned_wh5
body\t{"outsite":0,"firstCall":1,"version":1,"lbsSwitch":false}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3DC5LYAAAAACS2MWIMFYIGZ2AX
t\t1719308664751
h5st\t20240625174424757;nyiyy6tz9mgnn5i4;c81ad;tk03weaac1d9918n0OZjzkvEmCzafdesFXjzHFuTCfiQd8pANpm5NY6tsXFogCHZjieEf2NPtPqLv8ihsXqplAtFn6BF;e24bef1cf2af3979766de909adfac24a7fda32438a59ee45244f0a719bf3da09;4.7;1719308664757;TKmWampfPk5-s1-TVY8KI5lbv24L3OuhEan3351Xprx_PehmiVZzR8uMgEGRs154W8sjg5yIcv2gPa13VWewmJ5ZvZMhMaWkxsNQ8HxAXWQWgJEru_GKiwqMqP8cyZMzQS-yCZRK30f8ixTXcPqTJXUHQm0lTonzTvofEbd71VtUrEGBlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_home
appid\tsigned_wh5
body\t{"outsite":0,"firstCall":1,"version":1,"lbsSwitch":false}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3EEEJQAAAAACS46C63PIXPGQQX
t\t1719308682962
h5st\t20240625174442968;nyiyy6tz9mgnn5i4;c81ad;tk03weaac1d9918n0OZjzkvEmCzafdesFXjzHFuTCfiQd8pANpm5NY6tsXFogCHZjieEf2NPtPqLv8ihsXqplAtFn6BF;45dfec6ef2dce5304aa0ba693a8051c61575f837e410292dbc52b316c8a437b0;4.7;1719308682968;TKmW5LmO2iFAlsEZ2dQNYEnup9lBqbM7i0flHVYPTp0SVMpOIUGkAv1mDd2AQ1NDAzSRKoirRJlzn6-KZ1ePlEjGcjWpAfe6--36ktOaP1aWLV9ru_GKiwqMqP8cyZMzQS-yCZRK30f8ixTXcPqTJXUHQm0lTonzTvofEbd71VtUrEGBlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_home
appid\tsigned_wh5
body\t{"outsite":0,"firstCall":1,"version":1,"lbsSwitch":false}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3EEEJQAAAAACS46C63PIXPGQQX
t\t1719308703267
h5st\t20240625174503273;nyiyy6tz9mgnn5i4;c81ad;tk03weaac1d9918n0OZjzkvEmCzafdesFXjzHFuTCfiQd8pANpm5NY6tsXFogCHZjieEf2NPtPqLv8ihsXqplAtFn6BF;94c14f97cdf7928c429c37fce7e5552cbbc6128024de53273bc7bb86000c3e34;4.7;1719308703273;TKmWPmQFMVbOWfQlEifXqIJd142-FVMlZ0rn5QQixSNMEwEeI0W3Q9IeCiEhHLGB5eaxwMi_qAurMwVQ6SFGBTh2x16DOOy_44A6fER91S1znT5ru_GKiwqMqP8cyZMzQS-yCZRK30f8ixTXcPqTJXUHQm0lTonzTvofEbd71VtUrEGBlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_home
appid\tsigned_wh5
body\t{"outsite":0,"firstCall":1,"version":1,"lbsSwitch":false}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3EEEJQAAAAACS46C63PIXPGQQX
t\t1719308718530
h5st\t20240625174518537;nyiyy6tz9mgnn5i4;c81ad;tk03weaac1d9918n0OZjzkvEmCzafdesFXjzHFuTCfiQd8pANpm5NY6tsXFogCHZjieEf2NPtPqLv8ihsXqplAtFn6BF;73dca88733edf60d4b552a8eec2829a7762e479867b7a5bc508ac68cc76e3148;4.7;1719308718537;TKmWxDygTwS5G9wJwL-jrY9emVd5IT-ZWIrVt_XfvZPVvJLWf9j9yn1EvPOIMwvTUlHx5R6owDSnDZWZIs9EhwexeJe_dwlWp_AqkezWe-xi638ru_GKiwqMqP8cyZMzQS-yCZRK30f8ixTXcPqTJXUHQm0lTonzTvofEbd71VtUrEGBlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
      ],
      wanyiwan_assist: [
        `functionId\twanyiwan_assist
appid\tsigned_wh5
body\t{"inviteCode":"viGYOhReBJUC6LNg7lfsawciIw_5kulBiDFMoQg8_lr8SA","version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQJ3NUSLYAAAAAC2RLDJRAC3GP5QX
t\t1719310009581
h5st\t20240625180649626;nn9n5nnnttyimzg0;ba505;tk03weec31d6641lMXgxeDMrMyszGsbzZabgDz4XTzGkU0MKQp8heHPbwPDNtqcDvmb_A5QWBS3xNaow6yxWxMYXZ4G6;23cae6a78fa19f1b86968a882017ba9fee2772e1b90a3e13abc6e843d088a882;4.7;1719310009626;TKmWT_uWY-Qd8YMd4dBfpP5P5-NHVFKQkoABWpCS0bDwHWhbdxtc39DU66UkPDFBCkg8ydaL-QTSu5uCnzxe64_ZpJMsU3BceZv5rQufhE8BJQtcVSRAwGt7t6_LbgUHooRKHvpG5PAxz3jT56K1zWFM-wZgyYSPgmqtEfmgU6vA1KFBlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
      ]
    };

    if (exchange) {
      await handleExchange(exchange);
    } else {
      /* 增加等待时间 */
      await sleep(60);
      await handleDoTask();
    }


    async function handleDoTask() {
      const {signBoard, taskBoard} = await api.doFormBody('wanyiwan_home', {
        'outsite': 0,
        'firstCall': 0,
        'lbsSwitch': false,
      }, void 0, getForm(formData.wanyiwan_home[0/*TODO 可能不同 cookie 需要不同的加密数据*/])).then(_.property('data.result'));
      if (signBoard.status === 0) {
        await api.doFormBody('wanyiwan_sign', {}, void 0, getForm(`functionId\twanyiwan_sign
appid\tsigned_wh5
body\t{"version":1}
rfs\t0000
openudid\tc6993893af46e44aa14818543914768cf2509fbf
screen\t390*844
build\t169370
osVersion\t17.5
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
client\tapple
clientVersion\t13.1.0
partner\t
t\t1719070068214
h5st\t20240622232748220;t5t99t9gt6mizyn1;d12dd;tk03wec831d6841lM3gzeDErMyszZhvgoiLuGwN-HiL0yUip_oj5QrjK-LbQtZVOPOBvbDDpvtOBkVnsSGdgN9ttEDC2;a2518a317be6af63b2b9da1ce5bdcbd70fbac320188bddab5e0a5f92934fd752;4.7;1719070068220;TKmWcCgi9i5gJT0UOk2g8o2RL6FNpF1f9bSdCjb7Aq3nhf0YQe8y6BAV4rmU4CD5CjYQu7CY9FcXmPvNwqjESQq4v721G26_Dwrh7YU6nH2Sx4skmJnRzJhOWfxUpuuDTFscvICelZ15GSFkN3HGq5Zy-Sv_oyHRZxN1YHIu561maf6BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`),
        ).then(data => {
          if (self.isSuccess(data)) {
            api.log(`签到成功, 获取奖券: ${_.get(data, 'data.result.getScore')}`);
          } else {
            api.log(`签到失败, ${JSON.stringify(data)}`);
          }
        });
      }

      for (const {
        encryptAssignmentId: assignmentId,
        taskDetail,
        taskType,
        subtitle,
        status,
        finishTimes
      } of taskBoard || []) {
        const isShareTask = /助力/.test(subtitle);
        const enableDoShare = self.getNowHour() === 7;
        if (/下单/.test(subtitle)) continue;
        if (isShareTask) {
          if (enableDoShare && self.isFirstLoop()) {
            const inviteCode = self.getShareCodeFn()[0];
            inviteCode && await api.doFormBody('wanyiwan_assist', {inviteCode}, void 0, getForm(formData.wanyiwan_assist[0])).then(data => {
              if (self.isSuccess(data)) {
                api.log(`助力成功`);
              } else {
                api.log(`助力失败: ${_.get(data, 'data.bizMsg')}`);
              }
            });
            self.updateShareCodeFn(taskDetail[0].itemId);
          }
          if (status === 2) {
            for (let i = 0; i < finishTimes; i++) {
              await handleReceive();
              await sleep();
            }
          }
        }

        const waitDuration = +_.get(subtitle.match(/\d/), 0, 0);
        for (let {itemId, status} of taskDetail) {
          if (status === 3) continue;
          const _doTask = (actionType = 1) => {
            const form = formData.wanyiwan_do_task.find(form => form.match(assignmentId) && form.match(`"actionType":${actionType}`));
            if (!form) return;
            return api.doFormBody('wanyiwan_do_task', {
              itemId,
              taskType,
              assignmentId,
              actionType,
            }, void 0, getForm(form));
          };
          if (status === 1 && !isShareTask) {
            await _doTask(waitDuration ? 1 : 0);
            if (waitDuration) {
              await sleep(waitDuration);
              await _doTask(0);
            }
            ++status;
          }
          if (status === 2) {
            await handleReceive();
          }
        }

        async function handleReceive() {
          await api.doFormBody('wanyiwan_task_receive_award', {taskType, assignmentId}).then(data => {
            if (self.isSuccess(data)) {
              api.log(`获得奖券: ${_.get(data, 'data.result.rewardCount')}`);
            }
          });
        }
      }
    }

    async function handleExchange(reward) {
      const {
        hotExchanges,
        moreExchanges,
      } = await api.doFormBody('wanyiwan_exchange_page').then(_.property('data.result'));
      const target = hotExchanges.concat(moreExchanges).find(o => o.rewardType === 1 && o.rewardName.startsWith(reward));
      if (target) {
        await api.doFormBody('wanyiwan_exchange', {
          assignmentId: target.assignmentId,
          type: target.rewardType,
        }).then(data => {
          if (self.isSuccess(data)) {
            api.logBoth(`兑换成功: ${_.get(data, 'data.result.rewardName')}`);
          } else {
            api.logBoth(`兑换失败: ${JSON.stringify(data)}`);
          }
        });
      } else {
        api.logBoth(`未找到: ${reward} 红包`);
      }
    }
  }
}

singleRun(WanYiWan).then();

module.exports = WanYiWan;
