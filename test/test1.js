var assert = require("power-assert");  // assertモジュールのinclude

describe('power-assert sample', function() {
  it("is sample", function() {
    var author = "hoo";
    // assert(author === 'hoo');
    assert(author === 'hoo');  // ← 不一致エラー
  });
});

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});