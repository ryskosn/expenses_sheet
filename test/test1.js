var assert = require("power-assert");  // assertモジュールのinclude

var author = "hoo";
it("is power-assert", function() {
  // assert(author === 'hoo');
  assert(author === 'hoge');  // ← 不一致エラー
});
