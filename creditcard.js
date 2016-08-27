/**
 * クレジットカードのリストを取得する
 * TODO: memorize した方がよいかもしれない
 *
 * @return {array} creditcards array of object
 */
function getCreditcards() {
  var sheet = getCreditcardListSheet();
  var arr = sheet.getDataRange().getValues();

  // タイトル行をスキップするため slice(1)
  var creditcards = arr.slice(1).map(function (row) {
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
  var cardNames = creditcards.map(function (card) {
    return card['name'];
  });
  return cardNames;
}

/**
 * クレジットカードの expence のリストを取得する
 * Suica などを追加するなら、判定処理を変更する必要あり
 *
 * @return {array} creditcardExpences
 */
function getCreditcardExpences() {
  var allExpences = getAllExpences();

  // タイトル行をスキップするため slice(1)
  var creditcardExpences = allExpences.slice(1).filter(function (row) {
    if (row[6]) { return row; }
  });
  return creditcardExpences;
}

/**
 * クレジットカードの締め日を求める
 *
 * @param {object} card
 * @param {number} month 指定がなければ今月とする
 * @return {Date} cutoffDate
 */
function getCutoffDate(card, month) {

  // 締め日
  var cutoffDate = new Date();
  if (month) { cutoffDate.setMonth(month); }

  // 月末締めの場合
  if (card['cutoffDate'] === 0) {
    cutoffDate = offsetMonth(cutoffDate, 1);
  }
  cutoffDate.setDate(card['cutoffDate']);
  cutoffDate.setHours(23, 59, 59, 000);
  return cutoffDate;
}

/**
 * 指定した creditcard の月間トータルを集計する
 *
 * @param {object} card
 * @param {Date} cutoffDate 締め日
 * @return {number} sum
 */
function getSumOfCreditcardExpences(card, cutoffDate) {
  var allCardExpences = getCreditcardExpences();
  var cardName = card['name'];

  // 前月締め日
  var lastCutoffDate = offsetMonth(cutoffDate, -1);
  lastCutoffDate.setHours(23, 59, 59, 0);

  // 該当するエントリを抽出
  // [ 日付, 金額, カテゴリ, サブカテゴリ, 店名, 品名, カード区分, 計上日修正 ]
  var expences = allCardExpences.filter(function (row) {
    if (lastCutoffDate.getTime() < row[0].getTime() && row[0].getTime() <= cutoffDate.getTime() && row[6] === cardName) {
      return row;
    }
  });

  var sum = 0;
  switch (expences.length) {
    case 0:
      break;
    case 1:
      sum = expences[0][1];
      break;
    default:
      sum = expences.reduce(function (prev, curr) {
        return prev[1] + curr[1];
      });
      break;
  }
  return sum;
}

/**
 * クレジットカードの支払い日を求める
 *
 * @param {object} card
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
function getCardByCardName(cardName) {
  var cards = getCreditcards();
  var purchaseCard = cards.filter(function (card) {
    return card['name'] === cardName;
  });
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
  var pm = purchaseDate.getMonth();
  var cutoffDate = getCutoffDate(card, pm);

  var pd = purchaseDate.getDate();
  var cd = card['cutoffDate'];

  // 当月締め日が過ぎていた場合
  if (cd !== 0) {
    if (pd > cd) {
      cutoffDate = offsetMonth(cutoffDate, 1);
    }
  }
  return cutoffDate;
}

/**
 * カード名と締め日のペアを求める
 *
 * @return {array} cardName: string, cutoffDateTime: number
 */
function getUniqueCardnameAndCutoffDate() {
  var expences = getCreditcardExpences();
  var arr = expences.map(function (row) {
    var pDate = row[0];
    var cardName = row[6];
    var card = getCardByCardName(cardName);
    var cutoffDate = getCutoffDateOfPurchase(pDate, card);
    return {
      'cardName': cardName,
      'cutoffDate': cutoffDate,
      'cutoffDateTime': cutoffDate.getTime(),
    };
  });

  // cardName, cutoffDateTime でソート
  arr.sort(function (a, b) {
    if (a.cardName < b.cardName) return -1;
    if (a.cardName > b.cardName) return 1;
    if (a.cutoffDateTime < b.cutoffDateTime) return -1;
    if (a.cutoffDateTime > b.cutoffDateTime) return 1;
  });

  // 重複を除外 null が入る？
  arr = arr.map(function (x, i, self) {
    if (i === 0) { return x; }
    else if (x.cardName === self[i - 1].cardName) {
      if (x.cutoffDateTime !== self[i - 1].cutoffDateTime) { return x; }
    } else { return x; }
  });
  return arr;
}

/**
 * creditcard シートに入力されているデータを取得する
 *
 * @return {array} arr タイトル行を除外するため slice(1)
 */
function getExistingCreditcardEntries() {
  var sheet = getCreditcardSheet();
  var arr = sheet.getDataRange().getValues();
  return arr.slice(1);
}

/**
 * creditcard のエントリを書き込む
 *
 */
function writeCreditcardEntries() {
  var arr = getUniqueCardnameAndCutoffDate();
  arr = arr.filter(function (x) {
    if (x) { return x; }
  });

  var creditEntries = arr.map(function (x) {
    var cardName = x['cardName'];
    var card = getCardByCardName(cardName);
    var cutoffDate = x['cutoffDate'];
    return {
      'cardName': cardName,
      'card': card,
      'cutoffDate': cutoffDate,
      'dueDate': getDueDate(card, cutoffDate),
    };
  });

  // シートへの書き込み処理
  function write(entry) {
    var sheet = getCreditcardSheet();
    var row = sheet.getLastRow() + 1;

    // 締め日
    sheet.getRange(row, 1).setValue(entry['cutoffDate']);
    // カード名
    sheet.getRange(row, 2).setValue(entry['cardName']);
    // 支払い日
    sheet.getRange(row, 3).setValue(entry['dueDate']);
    // 金額を集計
    // =SUM(FILTER(expences!$B:$B,expences!$A:$A>=edate($A3,-1),expences!$A:$A<$A3,expences!$G:$G=$B3))
    var formula = '=SUM(FILTER(' + expencesSheetName + '!$B:$B,' + expencesSheetName +
      '!$A:$A>=edate($A' + row + ',-1),' + expencesSheetName + '!$A:$A<$A' + row + ',' +
      expencesSheetName + '!$G:$G=$B' + row + '))';
    sheet.getRange(row, 4).setFormula(formula);
    return;
  }

  // creditcard シートにすでにあるものを取得
  var existEntries = getExistingCreditcardEntries();
  if (existEntries === []) {
    creditEntries.forEach(function (x) {
      write(x);
    });
    return;
  }

  // obj と合致するものが array に含まれているか検査する
  function check(obj, array) {
    var result = array.some(function (x) {
      return (obj.cutoffDate.getTime() === x[0].getTime() && obj.cardName === x[1]);
    });
    return result;
  }

  var entriesToWrite = creditEntries.filter(function (x) {
    return !check(x, this);
  }, existEntries);

  entriesToWrite.forEach(function (x) {
    write(x);
  });

  // sort
  var sheet = getCreditcardSheet();
  sheet.getRange(2, 1, sheet.getLastRow(), 4).sort({ column: 1, ascending: false });
}

