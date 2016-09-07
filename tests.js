function testOffsetMonth() {
  var d = new Date();
  d.setMonth(2);
  d.setDate(0);
  Logger.log(d);
  Logger.log(d.getMonth());

  var n = offsetMonth(d, 1);
  Logger.log(n);
}


function testGetSumOfCreditcardExpenses() {
  var cards = getCreditcards();
  var card = cards[0];
  var d = new Date(2016, 7, 15);
  getSumOfCreditcardExpenses(card, d);
}


function testGetNextBusinessDay() {
  Logger.log('in testGetNextBusinessDay()');
  var d = new Date(2016, 4, 3);
  Logger.log(d);
  var result = getNextBusinessDay(d);
  Logger.log('result:');
  Logger.log(result);
}


function testGetDueDate() {
  var cards = getCreditcards();
  var card = cards[2];
  var cutoffDate = new Date();
  cutoffDate.setDate(card['cutoffDate']);
  getDueDate(card, cutoffDate);
}


function testGetCardObjByCardName() {
  var expenses = getCreditcardExpenses();
  for (var i = 0; i < expenses.length; i++) {
    Logger.log(expenses[i]);
    var c = expenses[i][6];
    getCardObjByCardName(c);
  }
}

function testGetCutoffDateOfPurchase() {
  var expenses = getCreditcardExpenses();
  for (var i = 0; i < expenses.length; i++) {
    Logger.log(expenses[i]);
    var pDate = expenses[i][0]; Logger.log(pDate);
    var cardName = expenses[i][6]; Logger.log(cardName);

    var card = getCardObjByCardName(cardName);
    Logger.log(card);

    var cutoffDate = getCutoffDateOfPurchase(pDate, card);
    Logger.log('cutoffDate:');
    Logger.log(cutoffDate);
  }
}


function check(obj, array) {
  var result = array.some(function (x) {
    return (obj.cutoffDate === x[0] && obj.cardName === x[1]);
  });
  return result;
}

function testCheck() {
  var obj = { 'cardName': 'ANA', 'cutoffDate': 20 };
  var array = [
    [10, 'ANA'],
    [20, 'JCB'],
    [15, 'ANA'],
    [20, 'ANA'],
  ];
  var result = check(obj, array);
  Logger.log(result);
  var objList = [
    { 'cardName': 'ANA', 'cutoffDate': 20 },
    { 'cardName': 'ANA', 'cutoffDate': 25 },
    { 'cardName': 'ANA', 'cutoffDate': 200 },
  ];
  objList = objList.filter(function (x) {
    return !check(x, this);
  }, array);
  Logger.log(objList);
}

function testGetCreditcardExpenses() {
  getCreditcardexpenses();
}

function testGetSheet() {
  var sheetName = creditcardSheetName;
  var result = getSheet(sheetName);
  Logger.log(result);
  Logger.log(typeof result);
}