/**
 * @description ayaozhongguoxing
 * 需要手动抓包, 将请求转成 curl 放在 store.json(originCurls)中
 *
 */

const _ = require('lodash');
const {exec, sleep} = require('../../lib/common');
const {updateProcessEnv} = require('../../lib/env');
const store = require('./store.json').travel;

async function main() {
  updateProcessEnv();
  const {index, originCurls} = store;
  const originCurl = originCurls[index];
  const Authorization = originCurl.match(/Authorization: (\w*)"/i)[1];
  const PHPSID = originCurl.match(/"Cookie: PHPSID=(\w*)"/i)[1];
  console.log(`Authorization: ${Authorization}, PHPSID: ${PHPSID}`);
  if (!Authorization || !PHPSID) {
    return;
  }

  const doFunc = async (func, data) => {
    const url = `curl -H "Host: ceb-ay.sinodoc.cn:9020" -H "Accept: */*" -H "Authorization: ${Authorization}" -H "Sec-Fetch-Site: same-site" -H "Accept-Language: zh-CN,zh-Hans;q=0.9" -H "Sec-Fetch-Mode: cors" -H "Content-Type: applicationjson;charset=utf-8" -H "Origin: https://ceb-ay.sinodoc.cn" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236 NebulaSDK/1.8.100112 Nebula yghsh/8.6.0WK PSDType(1) mPaaSClient/(null)" -H "Referer: https://ceb-ay.sinodoc.cn/" -H "Sec-Fetch-Dest: empty" -H "Cookie: PHPSID=${PHPSID}" --data-binary "${_.toPairs(data).map(array => array.join('=')).join('&')}" --compressed "https://ceb-ay.sinodoc.cn:9020/guangda/${func}"`;
    const result = JSON.parse(await exec(url, {stdio: void 0}));
    const code = _.get(result, 'code');
    if (code !== '200') {
      if (code !== '300') {
        console.log(result);
      }
      throw new Error(result.msg);
    }

    return result.data;
  };

  const opList = [
    goTravel,
    recycleOrder,
  ];

  for (const op of opList) {
    store[op.name].enabled && await op(store[op.name]);
  }

  // 旅行
  async function goTravel(option = {}) {
    const {shiPu, jnp, limit = 50, city_id} = option;
    for (let i = 0; i < ((shiPu || jnp) ? Infinity : limit); i++) {
      const result = await doFunc('travel/goTravel', {city_id});
      if (_.get(result, 'user_info.plane_num', '0') === '0') {
        console.log('已无机票');
        break;
      }
      const shipuList = _.get(result, 'lists.cityInfo.shipu_lists', []);
      const jnp_lists = _.get(result, 'lists.cityInfo.jnp_lists', []);
      if (shiPu && _.every(shipuList, o => +o.num === o.sum_num)) {
        console.log('食谱已收集完毕');
        break;
      }
      if (jnp && _.every(jnp_lists, o => +o.num === o.sum_num)) {
        console.log('jnp 已收集完毕');
        break;
      }
      console.log(`成功执行${i + 1}次 goTravel`);
      await sleep(5);
    }
  }

  async function recycleOrder() {
    for (let level = 1; level < 6; level++) {
      const {lists} = await doFunc('award/recycleOrder', {level});
      let stop = false;
      for (const {state, num, user_num, is_foods, foods_id} of lists) {
        if (state === '1') {
          continue;
        }
        const limit = num - user_num;
        if (is_foods && limit > 0) {
          const _stop = await cookFood(foods_id, limit);
          stop = _stop;
          if (_stop) break;
        }
      }
      if (stop) break;
      await sleep(1);
    }
  }

  // 烹饪
  async function cookFood(id, limit = 1) {
    const {lists: recipeList} = await doFunc('cookbook/RecipeList', {
      order_type: 0,
      food_type: 0,
      skilled_type: 0,
      city: 0,
      is_enough: 1,
    });
    const target = recipeList.find(o => o.id === `${id}`);
    if (!target) {
      console.log(`未找到 foodId: ${id}`);
      return;
    }
    let stop = false;
    for (let i = 0; i < limit; i++) {
      await doFunc('cookbook/cookFood', {id});
      console.log(`烹饪成功${i + 1}次 ${target.name}(id: ${id})`);
      await sleep(6);
      const {lists: {life_val}} = await doFunc('cookbook/vitalityData');
      if (life_val < 1) {
        console.log('已经没有精力了');
        stop = true;
        break;
      }
    }

    return stop;
  }
}

main().then();
