import { useState, useEffect, useRef, useReducer } from "react";
import styled from "styled-components";

import { Day } from "./Day";
import { Hour } from "./Hour";
import { Modal } from "./Modal";
import { reducer } from "./Reducer";
import { dayGenerator, hourGenerator, dateGenerator } from "./Generator";
import { getEvents as getEventsApi, addEvent as addEventApi, editEvent as editEventApi, deleteEvent as deleteEventApi } from "./api";
import { Dropdown } from "./Dropdown";

// inspired by https://www.youtube.com/watch?v=m9OSBJaQTlM

// KNOWN ISSUES:
// - Week may quickly flash with current week before updating when going between months
// - Weeks start at the beginning of every month due to month cycles breaking when the previous month has less days than the current date
// - No minimum for TimeTo, meaning you can technically set the end of the event to be several hours before
// - If the day is the last of the month, the first week of the next month might display the month as the previous instead
// - NOT tested, but possible this does not work outside of UK as things such as US' MM/DD/YYYY has not been accounted for

// TO-DO / FEATURES TO ADD (?):
// - Allow events to be across days/go past midnight
// - Add ability to create (bi-)daily/weekly/monthly/yearly events
// - See if there's an API for all dates of holidays and auto populate?
// - Add reminder option and alert if you're in the range of time set on event
// - Create "Are you sure?" dialog when deleting an Event
// - Add auth register/login, allow users to only see their own events
// - Create S3 bucket

function App() {

  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentDate = new Date();

  const initialState = {
    filter: "month",
    modalType: "",
    month: 0,
    year: 0,
    dateDisplay: "",
    paddingDays: 0,
    previousMonthLength: 31,
    monthLength: 31,
    newDay: currentDate.getDate(),
    newMonth: currentDate.getMonth(),
    newYear: currentDate.getFullYear(),
    num: 0,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const initial = {
    EventID: '',
    Title: "",
    TimeFrom: '',
    TimeTo: '',
    Description: "",
    AllDay: false,
    Color: "#0057ba",
    // repeat: {
    //   daily: false,
    //   weekly: false,
    //   monthly: false,
    //   yearly: false,
    //   frequency: 1,
    //   until: ''
    // }
  };

  const [tempEvent, setTempEvent] = useState(initial);
  const [events, setEvents] = useState([]);

  const [cachedTab, setCachedTab] = useState(null);
  const modalRef = useRef(null);

  const firstTab = useRef(null);
  const lastTab = useRef(null);

  const selectedDate = useRef(0);

  // move these into redux?
  const [isLoaded, setIsLoaded] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState('');

  // #region Render functions

  const request = async () => {
    try {
      const result = await getEventsApi();
      setEvents(result);
    } catch (err) {
      setError(`Error getting events: ${err}`);
    };
  };

  const getEvents = (type) => {
    setIsLoaded(false);

    // should probably remove sync for exploit purposes, but good for testing
    if (type === 'sync') {
      if (!cooldown) {
        request();
        setCooldown(true);

        setTimeout(() => {
          setCooldown(false);
        }, 5000); // can be abused with page refresh!
      } else {
        console.log("too fast!");
      };
    } else {
      !localStorage.getItem("events") ? request() : setEvents(JSON.parse(localStorage.getItem("events")));
    };
    
    setIsLoaded(true);
  };

  useEffect(() => {
    getEvents();
  }, []);

  // UPDATE STATE WITH NEW WEEK/MONTH/YEAR VALUES FOR FUNCTIONS TO READ

  useEffect(() => {
    const date = new Date(state.newYear, state.newMonth, state.newDay); // create Date object with new date values (so only need num -1/+1 to move back and forth each week/m/y)

    if (state.filter === "week" || state.filter === "month") {
      const { previousMonthLength, monthLength, dateDisplay, paddingDays } = dateGenerator(date);

      dispatch({
        type: "GENERATE_MONTH",
        payload: {
          previousMonthLength,
          monthLength,
          dateDisplay,
          paddingDays,
          month: date.getMonth() + 1, // months are 0 indexed, so +1 for actual month number to simplify operations later
          year: date.getFullYear(),
        },
      });
    } else if (state.filter === "year") {
      dispatch({
        type: "CHANGE_YEAR",
        payload: {
          dateDisplay: date.getFullYear(),
          year: date.getFullYear(),
        },
      });
    }
  }, [state.filter, state.newDay, state.newMonth, state.newYear]);

  // UPDATE CACHE WHENEVER THE EVENTS ARRAY HAS BEEN EDITED

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  const displayHours = (day) => {
    // generate the day, its hours and events when filter is by week
    const dayOfWeek = new Date(state.newYear, state.newMonth, state.newDay).getDay() - 1; // find out what day of the week current day is (-1 for 0 index)
    const weekday = day - dayOfWeek; // remove amount of days from first day until it's Monday and then count subsequent days from there

    const data = hourGenerator(
      weekday,
      state.month,
      state.year,
      state.previousMonthLength,
      state.monthLength,
      events
    );

    return (
      <DayContainer
        key={`hour_${data.date}`}
        onClickCapture={(e) => openModal(e.target.id, e.target.name)}
        aria-label={data.dayString}
      >
        <Day
          date={data.date}
          isPadding={data.isPadding}
          isCurrentDay={data.isCurrentDay}
          events={data.events}
        >
          {data.day}
        </Day>
        <HoursGrid>
          <Events>
            {data?.events?.map((e) => {
              if (e.AllDay) return "";

              const [fromHour, fromMins] = e.TimeFrom.split(":").map(Number);
              const [toHour, toMins] = e.TimeTo.split(":").map(Number);

              return (
                <Event
                  name="edit-event"
                  // skips every other row on grid (as there are 2 rows every hour, +1 is for 0-index)
                  // and determines whether the next row should be skipped if it's before or after ##:30
                  hour={`
                    ${fromMins < 30
                      ? fromHour + fromHour / 1 + 1 // grid rows 1/3/5 = (1 = 00:00-00:30, etc)
                      : fromHour + fromHour / 1 + 2 // grid rows 2/4/6 = (2 = 00:30-01:00, etc)
                    }
                    /
                    ${toMins <= 30
                      ? toMins < 1
                        ? toHour + toHour / 1 + 1 // fill second half of previous hour (so up to set hour if 0)
                        : toHour + toHour / 1 + 2 // fill first half of the hour
                      : toHour + toHour / 1 + 3 // fill second half of the hour
                    }
                  `}
                  key={`app_${e.EventID}`}
                  id={`${e.EventID}`}
                  style={{ backgroundColor: e.Color }}
                  isPadding={data.isPadding}
                >
                  {e.Title}
                </Event>
              );
            })}
          </Events>
          {[...Array(24)].map((_, i) => (
            <Hour
              key={`${data.date}_${i}`}
              hour={`${i + i / 1 + 1}`}
              date={data.date}
              index={i}
              isPadding={data.isPadding}
            />
          ))}
        </HoursGrid>
      </DayContainer>
    );
  };

  // GENERATE THE DAY AND ITS EVENTS WHEN FILTER IS BY MONTH

  const displayDays = (day) => {
    const data = dayGenerator(
      day,
      state.month,
      state.year,
      state.paddingDays,
      state.previousMonthLength,
      events
    );

    return (
      <DayContainer
        key={data.date}
        onClickCapture={(e) => openModal(e.target.id, e.target.name)}
        aria-label={data.dayString}
      >
        <Day
          date={data.date}
          isPadding={data.isPadding}
          isCurrentDay={data.isCurrentDay}
          events={data.events}
          dayString={data.dayString}
        >
          {data.day}
        </Day>
      </DayContainer>
    );
  };

  // DISPLAY THE CLICKED MONTH WHEN FILTER IS BY YEAR

  const setToMonth = (id) => {
    const month = id.split("-")[0];
    const year = id.split("-")[1];

    dispatch({
      type: "SELECT_MONTH",
      payload: {
        filter: "month",
        newMonth: month,
        newYear: year,
        num: 0,
      },
    });
  };

  // GENERATE LIST OF ALL MONTHS AND THEIR DAYS IN A YEAR WHEN FILTER IS BY YEAR

  const displayMonths = (month, monthNumber) => {
    const date = new Date(state.newYear, monthNumber);

    const data = dateGenerator(date);

    return (
      <MonthContainer key={`${monthNumber}_${state.year}`}>
        <Month
          id={`${monthNumber}-${state.year}`}
          onClick={(e) => setToMonth(e.currentTarget.id)}
          aria-label={`${month} ${state.year}`}
        >
          <h2>{month}</h2>
          <GridList aria-hidden="true">
            {weekdays.map((day, i) => 
              <MiniDay key={`week_${monthNumber}-${state.year}_${i}`}>
                {day.slice(0, 2)}
              </MiniDay>
            )}
            {/* if neither the month or year matches the current one, no need to bother checking for current day and such */}
            {(currentDate.getMonth() !== date.getMonth() ||
              currentDate.getFullYear() !== date.getFullYear()) && (
              <>
                {[...Array(data.paddingDays)].map((_, i) => (
                  <MiniDay
                    key={`padding_${monthNumber}-${state.year}_${i}`}
                    isPadding={true}
                  >
                    {data.previousMonthLength - data.paddingDays + i + 1}
                  </MiniDay>
                ))}
                {/* maybe just replace this with wall of manual days, probably performance waster */}
                {[...Array(28)].map((_, i) => (
                  <MiniDay key={`month_${monthNumber}-${state.year}_${i}`}>
                    {i + 1}
                  </MiniDay>
                ))}{" "}
                {[...Array(data.monthLength - 28)].map((_, i) => (
                  <MiniDay key={`end_${monthNumber}-${state.year}_${i}`}>
                    {29 + i}
                  </MiniDay>
                ))}
              </>
            )}
            {/* if the month and year DO match, map over the month and check for current day etc */}
            {currentDate.getMonth() === date.getMonth() &&
              currentDate.getFullYear() === date.getFullYear() &&
              [...Array(data.paddingDays + data.monthLength)].map((_, day) => {
                const dayData = dayGenerator(
                  day,
                  monthNumber + 1,
                  state.year,
                  data.paddingDays,
                  data.previousMonthLength
                );

                return (
                  <MiniDay
                    key={`mini_${dayData.date}`}
                    isCurrentDay={dayData.isCurrentDay}
                    isPadding={dayData.isPadding}
                  >
                    {dayData.day}
                  </MiniDay>
                )}
              )}
          </GridList>
        </Month>
      </MonthContainer>
    );
  };

  // SET NEW VALUES FOR THE WEEK/MONTH/YEAR WHEN GOING BACK / NEXT

  const cycle = (direction) => {
    const date = new Date(state.newYear, state.newMonth, state.newDay);

    const num = direction === "left" ? state.num - 1 : state.num + 1;

    if (state.filter === "week") {
      date.setDate(date.getDate() + num * 7); // current day -7 or +7

      dispatch({
        type: "CYCLE_WEEK",
        payload: {
          newDay: date.getDate(),
          newMonth: date.getMonth(),
          newYear: date.getFullYear(),
        },
      });
    } else if (state.filter === "month") {
      date.setDate(1); // set to beginning of month to prevent broken cycle when previous month has less days than what the current date is on
      date.setMonth(date.getMonth() + num);

      // CYCLE_WEEK and CYCLE_MONTH dispatches are not merged as this is not intended to always affect the day (this is just a temp workaround)
      dispatch({
        type: "CYCLE_MONTH",
        payload: {
          newDay: date.getDate(),
          newMonth: date.getMonth(),
          newYear: date.getFullYear(),
        },
      });
    } else if (state.filter === "year") {
      date.setFullYear(date.getFullYear() + num);

      dispatch({
        type: "CYCLE_YEAR",
        payload: date.getFullYear(),
      });
    }
  };

  // UPDATE THE FILTER

  const setFilter = (type) => {
    if (!type || type === state.filter) return;

    dispatch({
      type: "CHANGE_FILTER",
      payload: type,
    });
  };

  // SET THE CALENDAR TO JUMP BACK TO CURRENT DAY

  const setToday = () => {
    const date = new Date();

    if (date === currentDate) return;

    dispatch({
      type: "SET_TO_TODAY",
      payload: {
        newDay: date.getDate(),
        newMonth: date.getMonth(),
        newYear: date.getFullYear(),
      },
    });
  };

  // HANDLE FILTER MENU CLICKS

  const handleClickCapture = (e) => {
    if (e.target.name === 'sync') {
      getEvents('sync');
    } else if (e.target.name === 'today') {
      setToday();
    } else {
      setFilter(e.target.name);
    };
  };
  // #endregion

  // #region Event functions
  // OPEN MODAL ON DAY AND EVENT CLICKS

  const openModal = (id, type) => {
    if (!type) return;

    const [, hour, clicked] = id.split("_"); // get info from passed id
    const hoursExist = hour ? true : false; // if split is successful, hour should exist

    const dateNow = new Date();
    const belowTenNow = dateNow.getHours() < 10; // is the current hour below 10?

    // grab the current time, and add a 0 to the hours and/or minutes if either are below 10
    const time = `${belowTenNow ? "0" : ""}${dateNow.getHours()}:${
      dateNow.getMinutes() < 10
        ? `0${dateNow.getMinutes()}`
        : dateNow.getMinutes()
    }`;

    // FOR HOUR FILTER only
    const belowTen = hour < 10; // is the clicked hour below 10?
    const isOne = clicked === "1"; // did they click the top half of the hour (00-30)?
    const parsedHour = parseInt(hour);

    setTempEvent(() => {
      return type === "edit-event"
        ? events.find((e) => e.EventID === id)
        : {
            ...initial,

            // if the time is below 10, add a 0 | if they clicked the top half of the hour (00-30), make it the start of the hour
            TimeFrom: hoursExist
              ? `${belowTen ? "0" : ""}${hour}:${isOne ? "00" : "30"}`
              : `${time}`,

            // if the time is below 10 or is the top half of 9, add a 0 | if they clicked the bottom half of the hour (30-60), make it the next hour
            TimeTo: hoursExist
              ? `${parsedHour + 1 < 10
                ? "0"
                : parsedHour === 9 && isOne
                  ? "0"
                  : ""
                }${isOne ? hour : parsedHour + 1}:${isOne ? "30" : "00"}`
              : `${time}`,
          };
    });

    selectedDate.current = id; // store the element's id to pass onto addEvent/editEvent/deleteEvent
    setCachedTab(document.activeElement); // captures the last focused element to jump back to after the modal is closed
    dispatch({ type: "CHANGE_MODAL", payload: type });
    modalRef.current.openModal();
  };

  // SAVING A NEW EVENT

  const addEvent = async (e, id) => {
    e.preventDefault();

    try {
      const result = await addEventApi(tempEvent, id);
      setEvents([...events, result]);
      closeModal();
    } catch (err) {
      setError(`Error adding event: ${err}`);
    };
  };

  // SAVING AN EDITED EVENT

  const editEvent = async (e, id) => {
    e.preventDefault();

    try {
      await editEventApi(tempEvent, id);
      setEvents(events.map((e) => e.EventID !== id ? e : tempEvent));
      closeModal();
    } catch (err) {
      setError(`Error editing event: ${err}`);
    };
  };

  // DELETING AN EVENT

  const deleteEvent = async (id) => {
    try {
      await deleteEventApi(id);
      setEvents(events.filter((e) => e.EventID !== id));
      closeModal();
    } catch (err) {
      setError(`Error deleting event: ${err}`);
    };
  };

  const closeModal = () => {
    setError('');
    modalRef.current.closeModal();
  };

  // REMOVE ALL SAVED EVENTS (for testing purposes)

  const clearCache = () => {
    localStorage.setItem("events", "");
    setEvents([]);
  };
  // #endregion

  if (!isLoaded) {
    return <p>Loading...</p>
  } else {
    return (
      <>
        <StyledApp>
          <Header>
            <DisplayContainer>
              <Arrow aria-label="Go to Previous Month" onClick={() => cycle("left")}>
                ←
              </Arrow>
              <Arrow aria-label="Go to Next Month" onClick={() => cycle("right")}>
                →
              </Arrow>
              <Display>{state.dateDisplay}</Display>
            </DisplayContainer>
            <Flex>
              <Flex
                onClickCapture={(e) => handleClickCapture(e)}
              >
                <Dropdown />
              </Flex>
              {/* <Button onClick={() => clearCache()}>Clear all Events</Button> */}
            </Flex>
          </Header>
          <Main>
            {state.filter === "week" && (
              <>
                <HigherGrid>
                  <GridList>
                    {weekdays.map((day, i) => 
                      <ListItem key={`week_${day}-${i}`}>
                        {day.slice(0, 3)}<Span>{day.slice(3)}</Span>
                      </ListItem>
                    )}
                  </GridList>
                  <Times>
                    {[...Array(24)].map((_, i) => (
                      <li key={`time_${i}`}>{i}</li>
                    ))}
                  </Times>
                  <DayGrid columns={7}>
                    {[...Array(7)].map((_, i) => {
                      return displayHours(state.newDay + i);
                    })}
                  </DayGrid>
                </HigherGrid>
              </>
            )}
            {state.filter === "month" && (
              <GridList>
                {weekdays.map((day, i) => 
                  <ListItem key={`month_${day}-${i}`}>
                    {day.slice(0, 3)}<Span>{day.slice(3)}</Span>
                  </ListItem>
                )}
                {[...Array(state.paddingDays + state.monthLength)].map((_, i) => {
                  return displayDays(i);
                })}
              </GridList>
            )}
            {state.filter === "year" && (
              <YearGrid>
                {months.map((month, i) => {
                  return displayMonths(month, i);
                })}
              </YearGrid>
            )}
          </Main>
        </StyledApp>
        <Modal
          ref={modalRef}
          cache={cachedTab}
          firstTab={firstTab}
          lastTab={lastTab}
          zIndex={4}
          tabIndex={-1}
        >
          <form
            onSubmit={(e) =>
              state.modalType === "add-event"
                ? addEvent(e, selectedDate.current)
                : editEvent(e, selectedDate.current)
            }
          >
            <ModalHeader>
              <H2>{state.modalType === "add-event" ? "New" : "Edit"} Event</H2>
              <Cancel
                type="button"
                aria-label="Cancel"
                ref={lastTab}
                onClick={() => closeModal()}
              >
                X
              </Cancel>
            </ModalHeader>
            <Fieldset>
              <div>
                <Color
                  type="color"
                  onChange={(e) =>
                    setTempEvent({ ...tempEvent, Color: e.target.value })
                  }
                  value={tempEvent.Color}
                  ref={firstTab}
                />
                <Title
                  onChange={(e) =>
                    setTempEvent({ ...tempEvent, Title: e.target.value })
                  }
                  placeholder="Event Title"
                  value={tempEvent.Title}
                  required
                />
                <label>
                  <Checkbox
                    type="checkbox"
                    onChange={(e) =>
                      setTempEvent({ ...tempEvent, AllDay: e.target.checked })
                    }
                    checked={tempEvent.AllDay}
                  />
                  All day
                </label>
              </div>
              <div>
                <span>🕒 </span>
                <Input
                  type="time"
                  onChange={(e) =>
                    setTempEvent({ ...tempEvent, TimeFrom: e.target.value })
                  }
                  aria-label="Event Time From"
                  value={tempEvent.TimeFrom}
                  disabled={tempEvent.AllDay === true}
                  required={tempEvent.AllDay !== true}
                />
                <span> to </span>
                <Input
                  type="time"
                  onChange={(e) =>
                    setTempEvent({ ...tempEvent, TimeTo: e.target.value })
                  }
                  aria-label="Event Time To"
                  value={tempEvent.TimeTo}
                  disabled={tempEvent.AllDay === true}
                  required={tempEvent.AllDay !== true}
                />
              </div>
              <Description
                onChange={(e) =>
                  setTempEvent({ ...tempEvent, Description: e.target.value })
                }
                placeholder="Event Description"
                value={tempEvent.Description}
              />
              <Buttons>
                {state.modalType === "edit-event" && (
                  <Delete
                    type="button"
                    onClick={() => deleteEvent(selectedDate.current)}
                  >
                    Delete
                  </Delete>
                )}
                <ModalButton type="submit">Save</ModalButton>
              </Buttons>
            </Fieldset>
          </form>
          {error && <p>{error}</p>}
        </Modal>
      </>
    );
  };
}

export default App;

// EVERYTHING / MONTH

const StyledApp = styled.div`
  max-width: 1500px;
  margin: 0 auto;

  @media only screen and (max-width: 1024px) {
    max-width: 100%;
  };
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DisplayContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  text-align: center;
`;

const Button = styled.button`
  font-size: 1.25em;
  border: none;
  background-color: transparent;
  cursor: pointer;
  margin: 0em 0.5em;

  &:hover {
    background-color: lightgrey;
  };
`;

const Arrow = styled(Button)`
  margin: 0.25em;
`;

const Display = styled.h1`
  color: #0056a7;
  display: inline-block;
  font-weight: normal;
  margin-left: 0.25em;
`;

const Flex = styled.div`
  display: flex;
  align-items: center;
`;

const Main = styled.main`
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  height: 80vh;
  overflow-y: auto;
  align-items: flex-start;
  overflow-x: hidden;
`;

const GridList = styled.ul`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin: 0;
  padding-left: 0;
  grid-column: 2/3;
  width: 100%;
`;

const Span = styled.span`
  @media only screen and (max-width: 644px) {
    display: none;
  };
`;

const DayContainer = styled.li`
  list-style-type: none;
`;

const ListItem = styled(DayContainer)`
  padding-bottom: 0.5em;
  border-bottom: 1px solid grey;
`;

// WEEK

const Events = styled.div`
  display: grid;
  grid-template-rows: repeat(48, 25px);
  grid-row: 1/49;
  width: 80%;
`;

const HigherGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 100px 1fr;
  width: 100%;
`;

const Times = styled.ul`
  margin: 0;
  margin-top: 1px;
  grid-row: 3;
  padding: 0;

  li {
    list-style-type: none;
    width: 30px;
    height: 48px;
    border: 1px solid grey;
    text-align: center;
  };
`;

const DayGrid = styled(GridList)`
  grid-row: 2/3;
  grid-column: 2;
`;

const HoursGrid = styled.div`
  display: grid;
  grid-template-rows: repeat(48, 25px);
  position: relative;
`;

const Event = styled.button`
  border: none;
  cursor: pointer;
  font-weight: bold;
  grid-row: ${(props) => props.hour};
  z-index: 1;
  opacity: ${(props) => (!props.isPadding ? "1" : "0.5")};
  border: 1px solid white;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
  color: white;

  &:hover {
    opacity: 0.75;
  };
`;

// YEAR

const YearGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin: 0;
  padding-left: 0;
  grid-column: 2/3;
  width: 100%;
  text-align: center;

  @media only screen and (max-width: 1300px) {
    grid-template-columns: repeat(4, 1fr);
  };

  @media only screen and (max-width: 755px) {
    grid-template-columns: repeat(3, 1fr);
  };

  @media only screen and (max-width: 568px) {
    grid-template-columns: repeat(2, 1fr);
  };

  @media only screen and (max-width: 377px) {
    grid-template-columns: repeat(1, 1fr);
  };
`;

const MonthContainer = styled(DayContainer)`
  font-size: 0.8em;
`;

const Month = styled.button`
  margin: 0.5em;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    background: lightblue;
  };
`;

const MiniDay = styled.li`
  margin: 0.25em;
  opacity: ${(props) => (!props.isPadding ? "1" : "0.5")};
  background-color: ${(props) =>
    props.isCurrentDay ? "#0057ba" : "transparent"};
  color: ${(props) => (props.isCurrentDay ? "white" : null)};
  list-style-type: none;
`;

// MODAL

const Delete = styled.button`
  border-style: none;
  background-color: transparent;
  cursor: pointer;
  margin-right: 1em;
`;

const Buttons = styled.div`
  text-align: right;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.25em 0.75em;
  background-color: darkred;
`;

const H2 = styled.h2`
  font-size: 1em;
  color: white;
  font-weight: normal;
  margin: 0;
`;

const Fieldset = styled.fieldset`
  border: none;
  padding: 1em;
  text-align: center;
`;

const Color = styled.input`
  width: 30px;
  height: 30px;
  clip-path: circle(25%);
  cursor: pointer;
`;

const Title = styled.input`
  width: 75%;
  font-size: 1.5em;
  border: none;
  border-bottom: 1px solid black;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
`;

const Input = styled.input`
  margin: 1.5em auto;
  border: none;
  border-bottom: 1px solid black;
  padding: 0.25em;
  padding-left: 0.5em;
  font-size: 1.1em;
  width: 40%;
`;

const ModalButton = styled.button`
  border-style: none;
  background-color: darkred;
  color: white;
  padding: 0.75em 2em;
  cursor: pointer;
`;

const Description = styled.textarea`
  width: 100%;
  border: none;
  border-bottom: 1px solid black;
  font-size: 1.1em;
  height: 3em;
  margin-bottom: 0.5em;
`;

const Cancel = styled(ModalButton)`
  padding: 0em 0.5em;

  &:hover {
    background-color: #5c0000;
  };
`;
