const _ = require('lodash');
const assert = require('assert');
const {convertHex} = require('./index');

describe('lib/security', () => {
  it(`convertHex: convert String to Hex `, async function () {
    assert.strictEqual(convertHex({
      'token': '96EC77E27BA4958FBCFF48DCD77DCF44',
      'venderId': '',
    }), 'db7da3e593204b6cad753ab03935d11f1d930f5e038c04ce83a3a3dcb5120e11');
  });
});
