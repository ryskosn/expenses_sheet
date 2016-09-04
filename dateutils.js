/**
 * dateObj の月を変更する
 *
 * @param {Date} dateObj
 * @param {number} offset 正の値を与えると後の月を返す 2 月 -> 3 月
 * @return {Date} newDateObj
 */
function offsetMonth(dateObj, offset) {
  var year = dateObj.getFullYear();
  var month = dateObj.getMonth();
  var date = dateObj.getDate();
  var lastOfMonth = new Date(year, month + 1, 0).getDate();

  // 月の最終日の場合
  if (date === lastOfMonth) {
    return new Date(year, month + offset + 1, 0);
  } else {
    return new Date(year, month + offset, date);
  }
}


/**
 * 今日が日本の祝日かどうか判定する
 * http://qiita.com/kamatama_41/items/be40e05524530920a9d9
 * 
 * @param {number} year
 * @param {number} month
 * @param {number} date
 */
function isJapaneseHoliday(year, month, date) {
  var startDate = new Date(year, month, date);
  startDate.setHours(0, 0, 0, 0);

  var endDate = new Date(year, month, date);
  endDate.setHours(23, 59, 59, 999);

  var cal = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
  var holidays = cal.getEvents(startDate, endDate);

  return holidays.length != 0;
}


/**
 * 直近の営業日を求める
 * TODO: 前倒し処理のフラグを用意する？
 *
 * @param {Date} dateObj
 * @return {Date} 直近営業日の dateObj
 */
function getNextBusinessDay(dateObj) {
  Logger.log('in getNextBusinessDay()');

  var year = dateObj.getFullYear();
  var month = dateObj.getMonth();
  var date = dateObj.getDate();
  var day = dateObj.getDay();

  function getNextDay(dateObj, offset) {
    var offsettedDate = dateObj.getDate() + offset;
    dateObj.setDate(offsettedDate);
    return dateObj;
  }

  // 曜日が土曜 or 日曜なら月曜の日付を求める 
  switch (day) {

    // 土曜日
    case 6:
      var nextDay = getNextDay(dateObj, 2);
      return getNextBusinessDay(nextDay);

    // 日曜日
    case 0:
      var nextDay = getNextDay(dateObj, 1);
      return getNextBusinessDay(nextDay);

    default:
      // 祝日なら次の日付を求める
      if (isJapaneseHoliday(year, month, date)) {
        var nextDay = getNextDay(dateObj, 1);
        return getNextBusinessDay(nextDay);
      } else {
        return dateObj;
      }
  }
}
