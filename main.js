// シート名
var categorySheetName = 'category';
var expencesSheetName = 'expences';
var transactionsSheetName = 'transactions';
var banklistSheetName = 'banklist';
var dailySheetName = 'daily';
var creditcardSheetName = 'creditcard';
var creditcardListSheetName = 'creditcard_list';

// 特定のシートのメモ化
function getCategorySheet() {
  if (getCategorySheet.memoSheet) { return getCategorySheet.memoSheet; }
  getCategorySheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(categorySheetName);
  return getCategorySheet.memoSheet;
}

function getExpencesSheet() {
  if (getExpencesSheet.memoSheet) { return getExpencesSheet.memoSheet; }
  getExpencesSheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(expencesSheetName);
  return getExpencesSheet.memoSheet;
}

function getTransactionsSheet() {
  if (getTransactionsSheet.memoSheet) { return getTransactionsSheet.memoSheet; }
  getTransactionsSheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(transactionsSheetName);
  return getTransactionsSheet.memoSheet;
}

function getBanklistSheet() {
  if (getBanklistSheet.memoSheet) { return getBanklistSheet.memoSheet; }
  getBanklistSheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(banklistSheetName);
  return getBanklistSheet.memoSheet;
}

function getDailySheet() {
  if (getDailySheet.memoSheet) { return getDailySheet.memoSheet; }
  getDailySheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(dailySheetName);
  return getDailySheet.memoSheet;
}

function getCreditcardSheet() {
  if (getCreditcardSheet.memoSheet) { return getCreditcardSheet.memoSheet; }
  getCreditcardSheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(creditcardSheetName);
  return getCreditcardSheet.memoSheet;
}

function getCreditcardListSheet() {
  if (getCreditcardListSheet.memoSheet) { return getCreditcardListSheet.memoSheet; }
  getCreditcardListSheet.memoSheet = SpreadsheetApp.getActive().getSheetByName(creditcardListSheetName);
  return getCreditcardListSheet.memoSheet;
}

// 特定のリストのメモ化
function getAllCategories() {
  if (getAllCategories.memolist) { return getAllCategories.memolist; }
  var sheet = getCategorySheet();
  getAllCategories.memolist = sheet.getDataRange().getValues();
  return getAllCategories.memolist;
}

function getMainCategories() {
  if (getMainCategories.memolist) { return getMainCategories.memolist; }
  var allCategories = getAllCategories();
  getMainCategories.memolist = allCategories.map(
    function (arr) { return arr[0]; }
  );
  // getMainCategories.memolist = [];
  // for (var i = 0; i < allCategories.length; i++) {
  //   getMainCategories.memolist.push(allCategories[i][0]);
  // }
  return getMainCategories.memolist;
}

function getTransactionTypes() {
  if (getTransactionTypes.memolist) { return getTransactionTypes.memolist; }
  var sheet = getBanklistSheet();
  var array = sheet.getDataRange().getValues();
  getTransactionTypes.memolist = array[0].slice(1);
  return getTransactionTypes.memolist;
}

function getBanks() {
  if (getBanks.memolist) { return getBanks.memolist; }
  var sheet = getBanklistSheet();
  var array = sheet.getDataRange().getValues();
  getBanks.memolist = array[1].slice(1);
  return getBanks.memolist;
}

/**
 * シートを開いたときに実行される
 */
function onOpen() {
  var categorySheet = getCategorySheet();
  var expencesSheet = getExpencesSheet();
  var transactionsSheet = getTransactionsSheet();
  var banklistSheet = getBanklistSheet();

  // expences シート メインカテゴリ 入力規則を設定する
  setValidationMainCategories();

  // expences シートにクレジットカードの入力規則を設定する
  setValidationCreditcards();

  // transactions シートに入力規則を設定する
  setValidationTransactionsTypes();

  // クレジットカードの集計結果を入力する
  writeCreditcardEntries();
}

/**
 * セルの値を変更したときに実行される
 */
function onEdit(e) {

  // 変更セルの sheet, sheetName
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();

  // 変更セルの row, col
  var row = e.range.getRow();
  var col = e.range.getColumn();

  // expences シートでメインカテゴリを選択
  if (sheetName === expencesSheetName) {
    if (col === 3) {
      setValidationSubcategories(row, e.value);
    }
  }

  // transactions シートで取引種類を選択
  if (sheetName === transactionsSheetName) {
    if (col === 2) {
      setValidationTransactions(row, e.value);
      setFormulaOfTransactionComment(row);
    }
  }

  // daily シートで表示月を選択
  if (sheetName === dailySheetName) {
    if (row === 1 && col === 1) {
      setCategoriesToDailySheet();
      setExpencesNotes(e.value);
    }
  }
}

/**
 * expences シートのメインカテゴリ列に入力規則を設定する
 * onOpen() で呼び出す
 */
function setValidationMainCategories() {
  var mainCategories = getMainCategories();
  var mainCategoriesRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(mainCategories, true)
    .build();
  var sheet = getExpencesSheet();
  var mainCategoriesColumn = sheet.getRange(2, 3, sheet.getLastRow() + 50);
  mainCategoriesColumn.clearDataValidations();
  mainCategoriesColumn.setDataValidation(mainCategoriesRule);
}

/**
 * expences シートのカード区分列にクレジットカードの入力規則を設定する
 * onOpen() で呼び出す
 */
function setValidationCreditcards() {
  var cardNames = getCreditcardNames();
  var cardNamesRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(cardNames, true)
    .build();
  var sheet = getExpencesSheet();
  var cardColumn = sheet.getRange(2, 7, sheet.getLastRow() + 50);
  cardColumn.clearDataValidations();
  cardColumn.setDataValidation(cardNamesRule);
}
/**
 * transactions シートの取引種類列に入力規則を設定する
 * onOpen() で呼び出す
 */
function setValidationTransactionsTypes() {
  var transactionTypes = getTransactionTypes();
  var transactionsRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(transactionTypes, true)
    .build();
  var sheet = getTransactionsSheet();
  var transactionTypeColumn = sheet.getRange(2, 2, sheet.getLastRow() + 50);
  transactionTypeColumn.clearDataValidations();
  transactionTypeColumn.setDataValidation(transactionsRule);
}

/**
 * メインカテゴリを指定すると、D 列にサブカテゴリを要素とした入力規則を設定する。
 *
 * @param {Number} row
 * @param {String} mainCategory
 */
function setValidationSubcategories(row, mainCategory) {
  var expencesSheet = getExpencesSheet();
  var allCategories = getAllCategories();

  var subCategoryRange = expencesSheet.getRange(row, 4);
  subCategoryRange.clearDataValidations();

  // 既存の値を削除した場合は D 列の値を削除する
  // 値を削除した場合、e.value に {'oldValue': 'hoge'} が入る
  if (typeof mainCategory === 'object') {
    subCategoryRange.clearContent();
  }

  for (var i = 0; i < allCategories.length; i++) {
    if (allCategories[i][0] === mainCategory) {

      // 入力規則を設定する
      // 配列の最初はメインカテゴリが入るので slice(1) で index 1 以降を取り出す
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(allCategories[i].slice(1), true)
        .build();
      subCategoryRange.setDataValidation(rule);
      break;
    }
  }
}

/**
 * 取引種類を指定すると、それに応じて入力規則、値を設定する。
 *
 * @param {Number} row
 * @param {String} transactionType
 */
function setValidationTransactions(row, transactionType) {
  var transactionsSheet = getTransactionsSheet();
  var transactionTypes = getTransactionTypes();

  // 銀行名のリスト
  var banks = getBanks();

  // '現金'
  var cash = banks[0];

  var banksRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(banks.slice(1), true)
    .build();

  var from = transactionsSheet.getRange(row, 3);
  var to = transactionsSheet.getRange(row, 4);

  from.clearDataValidations();
  to.clearDataValidations();

  from.clearContent();
  to.clearContent();

  // // 既存の値を削除した場合は C,D 列の値を削除する
  // // 値を削除した場合、e.value に {'oldValue': 'hoge'} が入る
  // if (typeof transactionType === 'object') {
  //   from.clearContent();
  //   to.clearContent();
  // }

  switch (transactionType) {
    case '現金引出':
      from.setDataValidation(banksRule);
      to.setValue(cash);
      break;

    case '現金預入':
      from.setValue(cash);
      to.setDataValidation(banksRule);
      break;

    case '引落':
    case '振込':
    case '手数料':
      from.setDataValidation(banksRule);
      break;

    case '口座振替':
    case '調整':
      from.setDataValidation(banksRule);
      to.setDataValidation(banksRule);
      break;
  }
}

/**
 * transactions シートの転記用セルに関数を設定する
 * 
 * @param {number} row
 */
function setFormulaOfTransactionComment(row) {
  var sheet = getTransactionsSheet();
  var cell = sheet.getRange(row, 7);

  // =if(ISBLANK($F8),$B8,CONCATENATE($B8,"(",$F8,")"))
  var formula = '=if(ISBLANK($F' + row + '),$B' + row + ',CONCATENATE($B' + row + ',"(",$F' + row + ',")"))';
  cell.setFormula(formula);
}

/**
 * daily シートにメインカテゴリ、サブカテゴリを記載する
 */
function setCategoriesToDailySheet() {
  var allCategories = getAllCategories();
  var sheet = getDailySheet();
  var row = 3;
  var col = 1;

  // 既に入っている値を削除
  sheet.getRange(row, col, sheet.getLastRow()).clearContent();
  sheet.getRange(row, col + 1, sheet.getLastRow()).clearContent();

  // カテゴリを記入
  for (var i = 0; i < allCategories.length; i++) {
    for (var j = 0; j < allCategories[i].length; j++) {
      if (allCategories[i][j]) {
        sheet.getRange(row, col).setValue(allCategories[i][0]);
        sheet.getRange(row, col + 1).setValue(allCategories[i][j]);

        //サブカテゴリの行のフォントカラーを変更
        if (allCategories[i][0] !== allCategories[i][j]) {
          sheet.getRange(row, col, 1, sheet.getMaxColumns()).setFontColor('gray');
        } else {
          sheet.getRange(row, col, 1, sheet.getMaxColumns()).setFontColor('black');
        }
        row++;
      }
    }
  }
}

/**
 * expences シートからすべてのエントリを取得する
 *
 * @return {array} 
 */
function getAllExpences() {
  var sheet = getExpencesSheet();
  return sheet.getDataRange().getValues();
}

/**
 * 指定した range のセルにメモを記載する
 *
 * @param {Range} range
 * @param {string} note
 */
function addNote(range, note) {
  var existingNote = range.getNote();
  if (existingNote) {
    var array = [existingNote, note];
    var overwriteNote = array.join(',');
    range.setNote(overwriteNote);
  } else {
    range.setNote(note);
  }
}

/**
 * expences シートで入力した店名を daily シートの該当セルにメモとして記載する
 *
 * @param {Number} begin  2016/07/01, 2016/08/01 など日付のシリアル値
 */
function setExpencesNotes(begin) {
  var unixtime = (begin - 25569) * 86400000;
  var beginDate = new Date(unixtime);
  var year = beginDate.getFullYear();
  var month = beginDate.getMonth();

  var allExpences = getAllExpences();

  // 年、月が同じエントリのみを抽出する
  // 1 行目はタイトル行なので 2 行目から始める slice(1)
  var targetMonthExpences = allExpences.slice(1).filter(function (row) {
    var date = row[0];
    if (date.getFullYear() === year && date.getMonth() === month) { return row; }
  });

  var sheet = getDailySheet();
  sheet.getDataRange().clearNote();

  // daily シート B3 から下のリスト
  var categoriesArray = sheet.getRange(3, 2, sheet.getDataRange().getLastRow()).getValues();

  // 2 次元配列を flatten
  var categories = categoriesArray.reduce(function (prev, curr) {
    return prev.concat(curr);
  });

  // 対象セルの初期値は D3
  var rowIndex = 3;
  var colIndex = 4;

  for (var i = 0; i < targetMonthExpences.length; i++) {

    // 店名 index 4, 品名 index 5 が入っているか？
    var shop = targetMonthExpences[i][4];
    var goods = targetMonthExpences[i][5];
    var note = '';

    if (shop && goods) { note = shop + '(' + goods + ')'; }
    else if (shop) { note = shop; }
    else if (goods) { note = goods; }
    else { continue; }

    var main = targetMonthExpences[i][2];
    var sub = targetMonthExpences[i][3];

    var rowOffset = 0;
    var colOffset = 0;

    // サブカテゴリ index 3 が入っているか？
    if (!sub) {
      // サブカテゴリなし -> メインカテゴリを検索する
      rowOffset = categories.indexOf(main);
    } else {
      // サブカテゴリあり -> メインカテゴリ以降でサブカテゴリを検索する
      rowOffset = categories.indexOf(sub, categories.indexOf(main));
    }

    // 日付は初期値が 1 なので -1 する
    // 10 日の場合、必要な offset は 9
    colOffset = targetMonthExpences[i][0].getDate() - 1;

    var targetCell = sheet.getRange(rowIndex + rowOffset, colIndex + colOffset);
    addNote(targetCell, note);
  }
}
