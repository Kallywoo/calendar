export const reducer = (state, action) => {
  if (action.type === "CYCLE_WEEK") {
    return {
      ...state,
      num: 0,
      newDay: action.payload.newDay,
      newMonth: action.payload.newMonth,
      newYear: action.payload.newYear,
    };
  }

  if (action.type === "CYCLE_MONTH") {
    return {
      ...state,
      num: 0,
      newDay: action.payload.newDay,
      newMonth: action.payload.newMonth,
      newYear: action.payload.newYear,
    };
  }

  if (action.type === "CYCLE_YEAR") {
    return {
      ...state,
      num: 0,
      newYear: action.payload,
    };
  }

  if (action.type === "CHANGE_FILTER") {
    return {
      ...state,
      filter: action.payload,
    };
  }

  if (action.type === "GENERATE_MONTH") {
    return {
      ...state,
      previousMonthLength: action.payload.previousMonthLength,
      monthLength: action.payload.monthLength,
      dateDisplay: action.payload.dateDisplay,
      paddingDays: action.payload.paddingDays,
      month: action.payload.month,
      year: action.payload.year,
    };
  }

  if (action.type === "CHANGE_YEAR") {
    return {
      ...state,
      dateDisplay: action.payload.dateDisplay,
      year: action.payload.year,
    };
  }

  if (action.type === "CHANGE_MODAL") {
    return {
      ...state,
      modalType: action.payload,
    };
  }

  if (action.type === "SELECT_MONTH") {
    return {
      ...state,
      filter: action.payload.filter,
      newMonth: action.payload.newMonth,
      num: action.payload.num,
    };
  }

  if (action.type === "SET_TO_TODAY") {
    return {
      ...state,
      newDay: action.payload.newDay,
      newMonth: action.payload.newMonth,
      newYear: action.payload.newYear,
    };
  }
};
