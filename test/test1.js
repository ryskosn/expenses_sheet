var assert = require("power-assert");  // assertモジュールのinclude

var author = "hoo";
it("is power-assert sample", function() {
  // assert(author === 'hoo');
  assert(author === 'fuga');  // ← 不一致エラー
});
