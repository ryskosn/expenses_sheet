// expenses シートのカード区分を入力する列のインデックス
var cardCol = 6;

/**
 * クレジットカードのリストを取得する
 * TODO: memorize した方がよいかもしれない
 *
 * @return {array} creditcards array of object
 */
function getCreditcards() {
  var sheet = getCreditcardListSheet();

  // タイトル行をスキップするため slice(1)
  var arr = sheet.getDataRange().getValues().slice(1);
  var creditcards = arr.map(function(row) {
    var card = new Object();

    // [ 名前, 締め日（月末なら 0）, 支払月（翌月なら 1）, 支払日 ]
    card['name'] = row[0];
    card['cutoffDate'] = row[1];
    card['dueMonth'] = row[2];
    card['dueDate'] = row[3];
    return card;
  });
  return creditcards;
}

/**
 * クレジットカードのカード名のリストを取得する
 *
 * @return {array} creditcard name array of string
 */
function getCreditcardNames() {
  var creditcards = getCreditcards();
  return creditcards.map(function(card) { return card['name']; });
}

/**
 * クレジットカードの expense のリストを取得する
 * Suica などを追加するなら、判定処理を変更する必要あり
 *
 * @return {array} creditcardExpenses
 */
function getCreditcardExpenses() {
  /**
   * クレジットカードかどうか判定する
   * @param {string} cardName
   * @return {boolean}
   */
  function isCreditcard(cardName) {
    var otherCards = [
      'Suica',
      'nanaco',
    ];
    return otherCards.every(function(x) { return (x !== cardName); });
  }
  var allExpenses = getAllExpenses();
  var creditcardExpenses = allExpenses.filter(function(row) {
    return (row[cardCol] && isCreditcard(row[cardCol]));
  });
  return creditcardExpenses;
}

/**
 * クレジットカードの締め日を求める
 *
 * @param {Object} card
 * @param {number} year
 * @param {number} month
 * @return {Date} cutoffDate
 */
function getCutoffDate(card, year, month) {
  // 締め日
  var cutoffDate = new Date();
  cutoffDate.setFullYear(year);
  cutoffDate.setMonth(month);

  // 月末締めの場合
  if (card['cutoffDate'] === 0) {
    cutoffDate = offsetMonth(cutoffDate, 1);
  }
  cutoffDate.setDate(card['cutoffDate']);
  cutoffDate.setHours(23, 59, 59, 0);
  return cutoffDate;
}

/**
 * 指定した creditcard の月間トータルを集計する
 *
 * @param {Object} card
 * @param {Date} cutoffDate 締め日
 * @return {number} sum
 */
function getSumOfCreditcardExpenses(card, cutoffDate) {
  var allCardExpenses = getCreditcardExpenses();
  var cardName = card['name'];

  // 前月締め日
  var lastCutoffDate = offsetMonth(cutoffDate, -1);
  lastCutoffDate.setHours(23, 59, 59, 0);

  // 該当するエントリを抽出
  // [ 日付, 金額, カテゴリ, サブカテゴリ, 店名, 品名, カード区分, 計上日修正 ]
  var expenses = allCardExpenses.filter(function(row) {
    return (
        lastCutoffDate.getTime() < row[0].getTime() &&
        row[0].getTime() <= cutoffDate.getTime() && row[6] === cardName);
  });

  var sum = 0;
  switch (expenses.length) {
    case 0:
      break;
    case 1:
      sum = expenses[0][1];
      break;
    default:
      sum = expenses.reduce(function(prev, curr) { return prev[1] + curr[1]; });
      break;
  }
  return sum;
}

/**
 * クレジットカードの支払い日を求める
 *
 * @param {Object} card
 * @param {Date} cutoffDate 締め日
 * @return {Date} dueDate
 */
function getDueDate(card, cutoffDate) {
  var dueMonthOffset = card['dueMonth'];
  var dueDateOffset = card['dueDate'];

  // 支払い日
  var dueDate = offsetMonth(cutoffDate, dueMonthOffset);
  dueDate.setDate(dueDateOffset);

  // 土日祝日の場合は次の営業日
  return getNextBusinessDay(dueDate);
}

/**
 * クレジットカード名からカードの object 求める
 *
 * @param {string} cardName
 * @return {Object} purchaseCard[0]
 */
function getCardByName(cardName) {
  var cards = getCreditcards();
  var purchaseCard =
      cards.filter(function(card) { return (card['name'] === cardName); });
  return purchaseCard[0];
}

/**
 * 購入エントリの締め日を求める
 *
 * @param {Date} purchaseDate 購入エントリの日付
 * @param {Object} card
 * @return {Date}
 */
function getCutoffDateOfPurchase(purchaseDate, card) {
  var py = purchaseDate.getFullYear();
  var pm = purchaseDate.getMonth();
  var pd = purchaseDate.getDate();

  // 購入月の締め日
  var cutoffDate = getCutoffDate(card, py, pm);
  var cd = card['cutoffDate'];

  // 購入月の締め日を過ぎていた場合
  if (cd !== 0 && pd > cd) {
    cutoffDate = offsetMonth(cutoffDate, 1);
    cutoffDate.setHours(23, 59, 59, 0);
  }
  Logger.log('cutoffDate:');
  Logger.log(cutoffDate);
  return cutoffDate;
}

/**
 * 重複を取り除いたカード名と締め日のペアを求める
 *
 * @return {array} cardName: string, cutoffDateTime: number
 */
function getUniqueCardExpenses() {
  var expenses = getCreditcardExpenses();
  var arr = expenses.map(function(row) {

    // 計上日修正があればそちらを使う
    var pDate = row[7] || row[0];
    var cardName = row[6];
    var card = getCardByName(cardName);
    var cutoffDate = getCutoffDateOfPurchase(pDate, card);
    return {
      'cardName': cardName,
      'card': card,
      'cutoffDate': cutoffDate,
      'cutoffDateTime': cutoffDate.getTime(),
      'dueDate': getDueDate(card, cutoffDate),
    };
  });

  // cardName, cutoffDateTime でソート
  arr.sort(function(a, b) {
    if (a.cardName < b.cardName) return -1;
    if (a.cardName > b.cardName) return 1;
    if (a.cutoffDateTime < b.cutoffDateTime) return -1;
    if (a.cutoffDateTime > b.cutoffDateTime) return 1;
  });

  // 重複を除外 null or undefined が入る場合がある？
  arr = arr.map(function(x, i, self) {
    if (i === 0) {
      return x;
    } else if (x.cardName === self[i - 1].cardName) {
      if (x.cutoffDateTime !== self[i - 1].cutoffDateTime) {
        return x;
      }
    } else {
      return x;
    }
  });

  // null, undefined を除外する
  arr = arr.filter(function(x) {
    if (x) return x;
  });
  return arr;
}

/**
 * シートに未入力のデータがあれば書き込む
 *
 * @param {Sheet} sheet 対象のシートオブジェクト
 * @param {array} arrOfObj 書き込むデータオブジェクトの配列
 * @param {function} checker 既存のデータとの重複をチェックする関数
 * @param {function} writer オブジェクトを書き込む関数
 */
function writeNewEntries(sheet, arrOfObj, checker, writer) {
  var existentEntries = sheet.getDataRange().getValues().slice(1);

  if (existentEntries === []) {
    arrOfObj.forEach(function(x) { writer(sheet, x); });
    return;
  }

  var entriesToWrite = arrOfObj.filter(function(x) {
    return !checker(x, this);
  }, existentEntries);

  entriesToWrite.forEach(function(x) { writer(sheet, x); });
  return;
}

/**
 * creditcard シートにエントリを書き込む
 */
function writeCreditcardEntries() {
  var sheet = getCreditcardSheet();
  var arr = getUniqueCardExpenses();

  /**
   * obj と合致するものが array に含まれているか検査する
   *
   * @param {Object} obj
   * @param {array} array
   * @return {boolean} 含まれていたら true を返す
   */
  function checker(obj, array) {
    var result = array.some(function(x) {
      return (
          obj['cutoffDateTime'] === x[0].getTime() && obj['cardName'] === x[1]);
    });
    return result;
  }

  /**
   * シートに書き込む
   *
   * @param {Sheet} sheet
   * @param {Object} entry
   */
  function writer(sheet, entry) {
    var row = sheet.getLastRow() + 1;

    // 締め日
    sheet.getRange(row, 1).setValue(entry['cutoffDate']);

    // カード名
    sheet.getRange(row, 2).setValue(entry['cardName']);

    // 支払い日
    sheet.getRange(row, 3).setValue(entry['dueDate']);

    // 金額を集計
    // =SUM(FILTER(expenses!$B:$B,expenses!$I:$I>=edate($A3,-1),expenses!$I:$I<$A3,expenses!$G:$G=$B3))
    var formula = '=SUM(FILTER(' + expensesSheetName + '!$B:$B,' +
        expensesSheetName + '!$I:$I>=edate($A' + row + ',-1),' +
        expensesSheetName + '!$I:$I<$A' + row + ',' + expensesSheetName +
        '!$G:$G=$B' + row + '))';
    sheet.getRange(row, 4).setFormula(formula);
  }
  writeNewEntries(sheet, arr, checker, writer);

  // sort
  sheet.getRange(2, 1, sheet.getLastRow(), 4)
      .sort({column: 1, ascending: false});
}

/**
 * クレジットカードの支払いエントリを transactions シートに書き込む
 */
function writeCreditcardWithdrawal() {
  var sheet = getTransactionsSheet();
  var creditcardEntries =
      getCreditcardSheet().getDataRange().getValues().slice(1);
  var arr = creditcardEntries.map(function(row) {
    return {
      'cutoffDate': row[0],
      'cardName': row[1],
      'dueDate': row[2],
      'dueDateTime': row[2].getTime(),
    };
  });
  Logger.log(arr);

  /**
   * obj と合致するものが array に含まれているか検査する
   *
   * @param {Object} obj
   * @param {array} array
   * @return {boolean} 含まれていたら true を返す
   */
  function checker(obj, array) {
    var result = array.some(function(x) {
      return (
          obj['dueDateTime'] === x[0].getTime() && x[1] === '引落' &&
          obj['cardName'] === x[5]);
    });
    return result;
  }

  /**
   * シートに書き込む
   *
   * @param {Sheet} sheet
   * @param {Object} entry
   */
  function writer(sheet, entry) {
    var row = sheet.getLastRow() + 1;

    // 日付
    sheet.getRange(row, 1).setValue(entry['dueDate']);

    // 取引種類
    sheet.getRange(row, 2).setValue('引落');
    setValidationTransactions(sheet, row, '引落');

    // どこから
    sheet.getRange(row, 3).setValue('要入力');

    // いくら
    // =SUM(FILTER(expenses!$B:$B,expenses!$I:$I>=edate($A2,-1),expenses!$I:$I<$A2,expenses!$G:$G=$B2))
    var cutoffDateStr = formatDate(entry['cutoffDate'], 'DATE(YYYY,MM,DD)');
    var formula = '=SUM(FILTER(' + expensesSheetName + '!$B:$B,' +
        expensesSheetName + '!$I:$I>=edate(' + cutoffDateStr + ',-1),' +
        expensesSheetName + '!$I:$I<' + cutoffDateStr + ',' +
        expensesSheetName + '!$G:$G=$F' + row + '))';
    sheet.getRange(row, 5).setFormula(formula);
    sheet.getRange(row, 5).setFontColor('black');

    // 備考
    sheet.getRange(row, 6).setValue(entry['cardName']);
    setFormulaOfTransactionComment(sheet, row);
  }
  writeNewEntries(sheet, arr, checker, writer);

  // sort
  sheet.getRange(2, 1, sheet.getLastRow(), 7)
      .sort({column: 1, ascending: true});
}