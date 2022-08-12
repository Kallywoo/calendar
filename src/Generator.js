export const dateGenerator = (date) => {
  const dateDisplay = `${date.toLocaleDateString("en-gb", {
    month: "long",
    year: "numeric",
  })}`;

  let previousMonthLength = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  let monthLength = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  let paddingDays = new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;

  paddingDays = paddingDays < 0 ? 6 : paddingDays;

  return {
    dateDisplay,
    previousMonthLength,
    monthLength,
    paddingDays,
  };
};

export const dayGenerator = (day, month, year, paddingDays, prevMonthLength, events) => {
  const currentDay = new Date()
    .toLocaleDateString("en-gb", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
    .replace(/\b0/g, "");

  let isPadding = false;

  if (day < paddingDays) {
    day = prevMonthLength - paddingDays + day + 1; // make the day the end of month (i.e. 31), remove how many days until the day is Monday (paddingDays), then count up
    year = month === 0 ? year - 1 : year; // if the current month is January, set the year of the padding day to be the one before
    month = month === 0 ? 12 : month - 1; // if the current month is January, set the month of the padding day to be December
    isPadding = true;
  } else {
    day = day + 1 - paddingDays; // remove the extra/padding days to count from 1+
  };

  const dateString = `${day}-${month}-${year}`; // used as id, to track what day/month/year the button is on click
  const eventsForDay = events?.find((event) => event.date === dateString); // find/grab all events for the current day
  const isCurrentDay = `${day}/${month}/${year}` === currentDay ? true : false;
  const dayString = new Date(year, month - 1, day).toDateString(); // used for aria-label and title on events list

  return {
    day,
    isCurrentDay,
    isPadding,
    date: dateString,
    events: eventsForDay?.events,
    dayString,
  };
};

export const hourGenerator = (day, month, year, prevMonthLength, monthLength, events) => {
  const currentDay = new Date()
    .toLocaleDateString("en-gb", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
    .replace(/\b0/g, "");

  if (day < 1) {
    day = prevMonthLength + day; // make the day the end of month (i.e. 31), remove how many days before current day of week
    year = month === 0 ? year - 1 : year; // if the current month is January, set the year of the padding day to be the one before
    month = month === 0 ? 12 : month - 1; // if the current month is January, set the month of the padding day to be December
  } else if (day > monthLength) {
    day = day - monthLength; // start from 1
    month = month === 12 ? 0 : month + 1; // if current month is December, set the next month's days to January, otherwise count up one
  };

  let actualDay = day; // preserve original day (before day/month display edits) for dateString

  if (day === 1) {
    // display first day with month number to help avoid confusion, append 0 under 10 for consistency
    day = `01/${month < 10 ? `0` : ``}${month === 0 ? month + 1 : month}`;
  };

  const dateString = `${actualDay}-${month}-${year}`; // used as id, to track what day/month/year the button is on click
  const eventsForDay = events?.find((event) => event.date === dateString); // find/grab all events for the current day
  const isCurrentDay = `${day}/${month}/${year}` === currentDay ? true : false;

  return {
    day,
    isCurrentDay,
    date: dateString,
    events: eventsForDay?.events,
  };
};
