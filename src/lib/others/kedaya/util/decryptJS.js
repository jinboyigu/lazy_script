/**
 *
 * @description 将加密 js 部分解密(便于debugger)
 */

const _ = require('lodash');
const vm = require('vm');
const fs = require('fs');

function main(filePath) {
  const ctx = {require, module};
  vm.createContext(ctx);
  const jsContent = fs.readFileSync(filePath).toString();
  vm.runInContext(jsContent, ctx);
  let newJs = jsContent;
  const keys = Object.keys(ctx).filter(key => key.startsWith('_0x') && _.isFunction(ctx[key])); // ['_0x2388', '_0x4486']
  const allKeys = keys.map(key => _.uniq(getKey([key]))).filter(array => array.length > 1);
  // 替换加密的 function 为字符串
  for (let i = 0; i < 2; i++) {
    for (const allKey of allKeys) {
      allKey.forEach(_key => {
        newJs = newJs.replace(new RegExp(`${_key}\\(0x\\w+\\)`, 'g'), (v1) => {
          const _ctx = {[_key]: ctx[allKey[0]]};
          vm.createContext(_ctx);
          vm.runInContext(`var _value = ${v1}`, _ctx);
          return `'${_ctx._value}'`;
        }).replace(new RegExp(`${_key}\\(0x\\w+,\\s?'[^']*'\\)`, 'g'), (v1, v2) => {
          const _ctx = {[_key]: ctx[allKey[0]]};
          vm.createContext(_ctx);
          vm.runInContext(`var _value = ${v1}`, _ctx);
          return `'${_ctx._value}'`;
        });
      });
    }
  }
  // 替换十六进制为十进制
  newJs = newJs.replace(/\s?[^_](0x\w+)/g, (v1, v2) => {
    if (isNaN(+v2)) {
      return v1;
    } else {
      return v1.replace(v2, +v2);
    }
  })
  // 适配里的字符串被替换的问题
  newJs = newJs.replace(/'function test/g, '`function test').replace(/str\);}'/g, 'str);}`')
  .replace('\n@https:', '\\n@https:');
  const newFilePath = filePath.replace(/\.js$/, '-decrypted.js');
  console.log(`输出新文件路径为: ${newFilePath}`);
  fs.writeFileSync(newFilePath, newJs);

  function getKey(newKeys = [], allKeys = []) {
    newKeys = [].concat(newKeys);
    allKeys = allKeys.concat(newKeys);
    if (_.isEmpty(newKeys)) {
      return allKeys;
    }
    const _match = key => {
      const suffix = `\\s?=\\s?${key}[,;\\n]+`;
      return (jsContent.match(new RegExp(`_0x\\w*${suffix}`, 'g')) || []).map(v => {
        return v.replace(new RegExp(suffix), '');
      });
    };
    return getKey(_.flatten(newKeys.map(_match)), allKeys);
  }
}

// TODO jdAlgo.js 还需要转换 this['appId'], 比如 _0x4b167d = this['_dict'][this['appId']]['version'] => _0x4b167d = this['_dict'][appId]['version']
main('./jdAlgo.js');
