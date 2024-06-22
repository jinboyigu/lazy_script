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

    const formData = {
      /*TODO 待修复*/
      doTask: [
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8801959979","taskType":1,"assignmentId":"27Y9NFyraGN9AK83XLqWggAMP21t","actionType":1,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071004995
h5st\t20240622234325002;in9zt65gi5mmiii9;89db2;tk03wca471c9641lMXgxXzA2Ym1pgPgGgtPBrls28UYFNaCWcUmqEK_WLV4ycidsY_nDCFSmuvyHUsHZp6OUGEO75rJ-;f1c46182bb86d1340af1e58dbc4b8c3f9deea8471b3038a6a7db98ba3ffad793;4.7;1719071005002;TKmW0k6I0XJyxg_eptj_VHKn5kwBmL9D2FMqbd69Na0VYK_QyFZJed8jl2PXi-cjboEOF674wCPsmvChL3FvfKvDB6OvEJn_WPPMdVkEmECQ3piEIvZkX0q7TyDmap_Zy_snNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8801959979","taskType":1,"assignmentId":"27Y9NFyraGN9AK83XLqWggAMP21t","actionType":0,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071021166
h5st\t20240622234341182;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;1bdc16e8164197160da5b6369207bbcead6d38dd50cb63bc80d76d7128bd5c62;4.7;1719071021182;TKmWJ8KL1OUECkNKlN-S8aa8dHpdBkNU5G7NaZdZNrTeooxGTHszJf3i73_m1yeTY3ca-EE613_iABTQAwi4Z9EnsDszD4NRfs-BBD1D-ILGiVixZ7Qxd4ZbL-QyTnYULxSkNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"0601972489","taskType":1,"assignmentId":"Qk9QDy97r8nCVDsfNVAQv5UAwY3","actionType":1,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071040304
h5st\t20240622234400318;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;7daa0641a0a6078e7b93af40a45295209fbf5dbf7b1be22a1d0c2a41077ab918;4.7;1719071040318;TKmWKecuL4LZ5z0isbGS-51m_B0bwv5CAXi-q_N69QmglPnYzNU73zYBdyIVn_c35CnDCMEJkqsh5FpSg62xp7psHK3dXE_sOa9LUMavnOTZpV0uXCRQt9YXD99nGjV8LrUtNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"0601972489","taskType":1,"assignmentId":"Qk9QDy97r8nCVDsfNVAQv5UAwY3","actionType":0,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071051152
h5st\t20240622234411172;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;9e1a3cf8e797536b830fc4814a8d32d5867be639edd8d214891dfb5bd6efd54a;4.7;1719071051172;TKmWDJ9M4EUJirwvcexmsTXJcyApOZdL_kUG8k7dLYH_S1B-ctmxPrvWz-gEJWSODFS_2NLc4Dq_Ha9zTCfoOG2iabKbCPJN8D6YgbiWhHQ6vWouXCRQt9YXD99nGjV8LrUtNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8701970802","taskType":1,"assignmentId":"29q8EDjV4AzUCFTUayqE2eRcXVs7","actionType":1,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071054580
h5st\t20240622234414591;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;9c43f3cc452feb6b52828020cd9fb9b944932a1b1bdbe3d4a1ac528681116a50;4.7;1719071054591;TKmWCcsoH23UCLnBJ2PQN6UYrT4F_xefAT-7Aj-zLYQojj7OoHWPv9mp5u8cIPpWrgPRjy5SteImVa4dPDofgZRQf20V3TS37garmrnl3yuXmjQK7x-Yex0hSi6cL70JCk2bNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8701970802","taskType":1,"assignmentId":"29q8EDjV4AzUCFTUayqE2eRcXVs7","actionType":0,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071074781
h5st\t20240622234434793;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;5e3f2fbbd0cbb0053544f7481d92f122c6510bc008269c32f0c333b2f6db02e0;4.7;1719071074793;TKmW6kxjsUEmgrNq84jKpEyJcnsyfs5sNPVACZnISX2n9RaApbwWVDWme4izcwitSHkflL6EEgw-mH-h_OpHfEq9T8RojxbprBYBQNNcD19sCxQo2ue6tF2egr-98Jw8juihNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8901958387","taskType":1,"assignmentId":"4QQCDcqmVpkddEVBWuviwF5jz9XK","actionType":1,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071078377
h5st\t20240622234438389;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;71bdebdf6f6af39195502ab8cd8a7dbf27cad6f942f3a35027132df355a24c4a;4.7;1719071078389;TKmWT1N2vvUNMoCBMZt8UbrUwvjKWq8BLCNP_-HXsAomiOyiVsIZz7WNZj1cUXKJTt9zkyVDwL1a44EW5P1k8czXAHPs-HyMTrUgF2O3c4Yhx2_3t_Y5E8EkxwPnvjLA0UA4NSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
        `functionId\twanyiwan_do_task
appid\tsigned_wh5
body\t{"itemId":"8901958387","taskType":1,"assignmentId":"4QQCDcqmVpkddEVBWuviwF5jz9XK","actionType":0,"version":1}
rfs\t0000
openudid\t1674bf4b06f21c82b80f834ea28d32b978feaeee
screen\t393*852
build\t169370
osVersion\t17.3
networkType\twifi
d_brand\tiPhone
d_model\tiPhone15,2
client\tapple
clientVersion\t13.1.0
partner\t
x-api-eid-token\tjdd03QN5EKRH2Q3K35QGSXXEXK4S5IV4LNOEKD4UOL5GOIENDBNUVMAX4LYW2W3U3ICD6SXA6QRBPDCEO27CMAIQWY5NODYAAAAMQICOZV7IAAAAAD34H3WT4LFX5XUX
t\t1719071088301
h5st\t20240622234448318;in9zt65gi5mmiii9;89db2;tk03we68a1d6218n0hoCpkn0zup4DE2EhywozY8uWwhzAgjbkQOoYsPo6CfyjMYGe13An5VkATGlghCOnpRpnQNFfrD6;2c34f9608c6babb983218d6de3feedc629308fa97d9c50021819a3f715a6ed09;4.7;1719071088318;TKmWdSE9iYDWwSpZU4SUqQT7ezoiEuJcRbfHMicaUjI0Zb_ltqdvUSoGQgNLn0ktxYLl9T9lRjryfCb-fIkFoI-cyZt8-vdcQdKBZwJBsO8XfvMVUBSMjMKSuIbWry6qRTUfNSPPkZJ_icA_JcwTYd99SmQbYZxcgVLx-spEvlXLBG9neujQP03jNvUgd-7o8rJtGXwrj0IwgGwsvWRLFPvtBAYOyu25s7-NDRroiNlNN_7AFU4T1AiNcejSk-KUE44_s9GWJ0WyKWHQGniZIq4Qt5Ow_GIs8T3QllGKoSSmXFvXWpT4zJ5HljrhrIJfr8O_Xni__zdRb9N0jVwuEPH-AE66s1VwJUcRfyPKwao-rFKV9ezJ2thW3DDpffp-XZgYF6IqLEtMds_2R3_2bT859uqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`,
      ]
    }

    if (exchange) {
      await handleExchange(exchange);
    } else {
      await handleDoTask();
    }


    async function handleDoTask() {
      const {signBoard, taskBoard} = await api.doFormBody('wanyiwan_home', {
        'outsite': 0,
        'firstCall': 0,
        'lbsSwitch': false,
      }, void 0, {
        form: formatPasteData(`body\t{"outsite":0,"firstCall":0,"version":1,"lbsSwitch":false}
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
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQIBZXMPYAAAAACP2ERWLK4YLAIUX
t\t1719070068896
h5st\t20240622232748906;nyiyy6tz9mgnn5i4;c81ad;tk03wdd281d5118nzI0cOO1iobxSagYnfufmtVPoh6nLZEWJRp6mUorfsA86QBFQPuZslq9a61x4qck_q9TJV5XpnBtr;3f2a8ebf139814da6bc9653055831cbd0dae3f3151862ebe93497a3c7da2e9ab;4.7;1719070068906;TKmWDibpOkZbeBue3n-9Cx63H70m0odsuBGY74O8xcDF-0sF0PACQvJ5cw67iQY-1UgR5Q8GUdcZtIglWYWOHOOHzwzKeY-Q8HiGAlL20ZN4ChtkmJnRzJhOWfxUpuuDTFscvICelZ15GSFkN3HGq5Zy-Sv_oyHRZxN1YHIu561maf6BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`)
      }).then(_.property('data.result'));
      if (signBoard.status === 0) {
        await api.doFormBody('wanyiwan_sign', {}, void 0, {
          form: formatPasteData(`appid\tsigned_wh5
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
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQIBZXMPYAAAAACP2ERWLK4YLAIUX
t\t1719070068214
h5st\t20240622232748220;t5t99t9gt6mizyn1;d12dd;tk03wec831d6841lM3gzeDErMyszZhvgoiLuGwN-HiL0yUip_oj5QrjK-LbQtZVOPOBvbDDpvtOBkVnsSGdgN9ttEDC2;a2518a317be6af63b2b9da1ce5bdcbd70fbac320188bddab5e0a5f92934fd752;4.7;1719070068220;TKmWcCgi9i5gJT0UOk2g8o2RL6FNpF1f9bSdCjb7Aq3nhf0YQe8y6BAV4rmU4CD5CjYQu7CY9FcXmPvNwqjESQq4v721G26_Dwrh7YU6nH2Sx4skmJnRzJhOWfxUpuuDTFscvICelZ15GSFkN3HGq5Zy-Sv_oyHRZxN1YHIu561maf6BlROqH-s3iLfGBTMb2GwM8AP8Zq9elQ3-CIHGPO6yPuZPYF-dD4z4yQUUErkXQxd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA`)
        }).then(data => {
          if (self.isSuccess(data)) {
            api.log(`签到成功, 获取奖券: ${_.get(data, 'data.result.getScore')}`);
          } else {
            api.log(`签到失败, ${JSON.stringify(data)}`);
          }
        });
      }
      return;
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
            inviteCode && await api.doFormBody('wanyiwan_assist', {inviteCode}).then(data => {
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
            const form = formData.doTask.find(form => form.match(assignmentId) && form.match(`"actionType":${actionType}`));
            if (!form) return;
            return api.doFormBody('wanyiwan_do_task', {
              itemId,
              taskType,
              assignmentId,
              actionType,
            }, void 0, {form: formatPasteData(`
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
x-api-eid-token\tjdd03M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3QAAAAMQICOMGYQAAAAADAOLENCCIL42J4X`)});
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
