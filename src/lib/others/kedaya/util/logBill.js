const CryptoJS = require('crypto-js');


module.exports = function logBill(cookie) {
  let result = {...cookie};
  try {
    this.sha256 = v => CryptoJS['SHA256'](v)['toString']();
    this.md5 = v => CryptoJS['MD5'](v)['toString']();
    this.rand = v => CryptoJS['MD5'](v)['toString']();
    this['rand'] = (_0x406dc7, _0x3021b4) => {
      var _0x2deffb = Math['floor']((function (_0x585002, _0x546416) {return _0x585002 * _0x546416;})(Math['random'](), (function (_0x124932, _0x132b8e) {return _0x124932 + _0x132b8e;})((function (_0x4c08f4, _0x5d5e76) {return _0x4c08f4 - _0x5d5e76;})(_0x3021b4, _0x406dc7), 1)) + _0x406dc7);
      return _0x2deffb;
    };
    result['bill_entrance'] = 6, result['bill_pt_key'] = result[`pt_key`]['includes']('app_open') ? result[`pt_key`] : 'app_open' + result['pt_key'], result['bill_pt_pin'] = (function (_0x48f326, _0x20cf02) {return _0x48f326(_0x20cf02);})(encodeURIComponent, result[`pt_pin`]), result['bill_source'] = 62;
    let _0x4ac529 = (function (_0x1c7070, _0x220e05) {return _0x1c7070 + _0x220e05;})((function (_0x54acb1, _0x3bc01e) {return _0x54acb1(_0x3bc01e);})(parseInt, this['sha256'](result[`pt_pin`])['match'](/\d/g)['slice'](0, 5)['join']('')), parseInt(this['sha256'](result['pt_pin'])['match'](/\d/g)['slice'](0, 5)['join']('')))['toString'](),
      jdJdc = this['jdJdc'] || `123`,
      _0x3bceb6 = this['md5'](result[`pt_pin`])['split']('')['map'](_0x4fa8ff => _0x4fa8ff['charCodeAt'](0))['reduce']((_0x4201f9, _0x4efd39) => _0x4201f9 + _0x4efd39, 0) % 4,
      _0x12390b = (function (_0x1c7070, _0x220e05) {return _0x1c7070 + _0x220e05;})((function (_0x22eac8, _0x38951a) {return _0x22eac8 + _0x38951a;})(new Date()['getTime']()['toString']()['slice'](0, 4), _0x4ac529['padStart'](9, 0)), _0x4ac529['padStart'](9, _0x3bceb6)),
      _0xc4ed35 = (function (_0x6d0875, _0x18e517) {return _0x6d0875 + _0x18e517;})(new Date()['getTime']()['toString']()['slice'](0, 4), _0x4ac529['padStart'](6, 0));
    result['__jda'] = jdJdc + '.' + _0x12390b + '.' + _0xc4ed35 + '.' + _0xc4ed35 + '.' + _0xc4ed35 + '.' + _0x3bceb6, result['__jdb'] = jdJdc + '.' + this['rand'](1, 10) + '.' + _0x12390b + '|' + _0x3bceb6 + '.' + _0xc4ed35, result['__jdc'] = jdJdc;
  } catch (error) {
    console.log(error);
  }
  return result;
};
