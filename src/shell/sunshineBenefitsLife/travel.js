/**
 * @description ayaozhongguoxing
 * 需要手动抓包, 将请求转成 curl 放在 store.json(originCurls)中
 *
 */

const _ = require('lodash');
const {sleep, writeFileJSON} = require('../../lib/common');
const {updateProcessEnv} = require('../../lib/env');
const allStore = require('./store.json');
const store = allStore.travel;
const rp = require('request-promise');
const {formatPasteData, readDirJSON} = require('../../lib/charles');
const {getMoment} = require('../../lib/moment');

function getDataFromJSON() {
  return _.uniq(_.filter(readDirJSON(__dirname).filter(o => o.host === 'ceb-ay.sinodoc.cn').map(o => _.get(o.request.header.headers.find(o => o.name === 'authorization'), 'value', ''))));
}

async function main() {
  updateProcessEnv();
  const tokens = getDataFromJSON();
  if (!_.isEmpty(tokens)) {
    store.originCurls = tokens;
    writeFileJSON(allStore, './store.json', __dirname);
  }
  const {originCurls} = store;
  let needContinue = false;
  for (const originCurl of originCurls) {
    const result = await travel(originCurl);
    if (result) {
      needContinue = true;
    }
    await sleep(3);
  }
  if (needContinue) {
    console.log(`[${getMoment().format()}] 等待 1 小时后再次执行`);
    await sleep(60 * 60);
    return main();
  } else {
    console.log(`[${getMoment().format()}] 今天任务完成!`);
  }

}

async function travel(originCurl) {
  const Authorization = _.get(originCurl.match(/Authorization: (\w*)["']/i), 1, originCurl);
  const PHPSID = _.get(originCurl.match(/"Cookie: PHPSID=(\w*)"/i), 1, '');
  console.log(`Authorization: ${Authorization}, PHPSID: ${PHPSID}`);
  if (!Authorization) {
    return;
  }

  const doFunc = async (func, data, options) => {
    const {msg, ignoreError} = options || {};
    const result = JSON.parse((await rp({
      uri: `https://ceb-ay.sinodoc.cn:9020/guangda/${func}`,
      method: 'POST',
      encoding: null,
      body: _.toPairs(data).map(array => array.join('=')).join('&'),
      headers: {
        ...formatPasteData(`authorization\t${Authorization}
sec-fetch-site\tsame-site
accept-language\tzh-CN,zh-Hans;q=0.9
sec-fetch-mode\tcors
content-type\tapplicationjson;charset=utf-8
origin\thttps://ceb-ay.sinodoc.cn
user-agent\tMozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236 NebulaSDK/1.8.100112 Nebula yghsh/8.6.0WK PSDType(1) mPaaSClient/(null)
referer\thttps://ceb-ay.sinodoc.cn/
cookie\tPHPSID=${PHPSID}`),
      },
    })).toString());
    const code = _.get(result, 'code');
    const isSuccess = code === '200';
    if (!isSuccess && !ignoreError) {
      if (code === '300') {/* token 过期 */
        throw new Error(result.msg);
      } else {
        console.log(result);
      }
    } else if (msg) {
      console.log(msg);
    }

    return isSuccess ? result.data : result;
  };


  let needContinue = false;
  const opList = [
    ttkbx,
    recycleOrder,
    goTravel,
  ];

  // 日常
  await sign();
  await buyPlane();

  for (const op of opList) {
    store[op.name].enabled && await op(store[op.name]);
  }

  return needContinue;

  // 签到
  async function sign() {
    const {signList} = await doFunc('sign/lists');
    if (_.find(signList, {day: getMoment().format('MM.DD')})?.status !== 1) {
      await doFunc('sign/sign', {}, {msg: '签到成功'});
    }
  }

  // 购买机票
  async function buyPlane() {
    const {lists} = await doFunc('travel/planeLists');
    for (const {id, num, state} of lists) {
      if (state === 1) continue;
      await doFunc('travel/buyPlane', {id}, {msg: `购买机票(${num}张)成功`});
      await sleep(1);
    }
  }

  // 旅行
  async function goTravel(option = {}) {
    const {shiPu, jnp, limit = 50, city_id} = option;

    for (const id of [].concat(city_id)) {
      await _do(id);
      await sleep(5);
    }

    async function _do(cityId) {
      for (let i = 0; i < ((shiPu || jnp) ? Infinity : limit); i++) {
        const result = await doFunc('travel/goTravel', {city_id: cityId});
        if (_.get(result, 'user_info.plane_num', '0') === '0') {
          console.log('已无机票');
          break;
        }
        const shipuList = _.get(result, 'lists.cityInfo.shipu_lists', []);
        const jnp_lists = _.get(result, 'lists.cityInfo.jnp_lists', []);
        const name = `${_.get(result, 'lists.cityInfo.city_info.name')}`;
        if (shiPu && _.every(shipuList, o => +o.num === o.sum_num)) {
          console.log(`${name}的食谱已收集完毕`);
          break;
        }
        if (jnp && _.every(jnp_lists, o => +o.num === o.sum_num)) {
          console.log(`${name}的 jnp 已收集完毕`);
          break;
        }
        console.log(`成功执行${i + 1}次 goTravel(city_id=${cityId})`);
        await sleep(5);
      }
    }
  }

  async function recycleOrder() {
    for (let level = 1; level < 6; level++) {
      const {lists} = await doFunc('award/recycleOrder', {level});
      let stop = false;
      for (const {state, num, user_num, is_foods, foods_id, id} of lists) {
        if (state === '1') {
          continue;
        }
        const limit = num - user_num;
        if (is_foods) {
          if (limit > 0) {
            const _stop = await cookFood({id: foods_id}, limit);
            stop = _stop;
            if (_stop) break;
          } else if (state === '0') {
            const msg = `提交订单成功(${id})`;
            const submitOrder = type => doFunc('award/submitOrder', {id, type}, {
              ignoreError: true,
              ...type && {msg},
            });
            const result = await submitOrder();
            if (result.code === '300') {
              await sleep();
              await submitOrder(1);
            } else {
              console.log(msg);
            }
          }
        }
      }
      if (stop) break;
      await sleep(1);
    }
  }

  async function ttkbx() {
    const {foods_img, box_data, today_finish_num} = await doFunc('ttkbx/index');
    const limit = _.last(box_data).num - today_finish_num;
    limit && await cookFood({name: foods_img[0].name}, limit);
    await sleep(2);
    await openBox();

    async function openBox() {
      const {award_num} = await doFunc('ttkbx/index');
      if (_.last(box_data).state !== '1') {
        needContinue = true;
      }
      for (let i = 0; i < award_num; i++) {
        await sleep(2);
        await doFunc('ttkbx/openBox').then(data => {
          const {name, intro} = _.get(data, 'lists.prize_info');
          console.log(`开宝箱获得 ${name}(${intro})`);
        });
      }
    }
  }

  // 烹饪
  async function cookFood(food = {}, limit = 1) {
    const {id, name} = food;
    const {lists: recipeList} = await doFunc('cookbook/RecipeList', {
      order_type: 0,
      food_type: 0,
      skilled_type: 0,
      city: 0,
      is_enough: 1,
    });
    const target = recipeList.find(o => o.id === `${id}` || o.name === name);
    if (!target) {
      console.log(`未找到 food: ${id || name}`);
      return;
    }
    let stop = false;
    for (let i = 0; i < limit; i++) {
      const {lists: {life_val}} = await doFunc('cookbook/vitalityData');
      if (life_val < 1) {
        console.log('已经没有精力了');
        stop = true;
        break;
      }
      await doFunc('cookbook/cookFood', {id: target.id});
      console.log(`烹饪成功${i + 1}次 ${target.name}(id: ${target.id})`);
      await sleep(6);
    }

    return stop;
  }
}

main().then();
