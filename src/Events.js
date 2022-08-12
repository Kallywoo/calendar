import { v4 as uuidv4 } from "uuid";

// SAVING A NEW EVENT

export const addEvent = (item, id) => {
  const events = JSON.parse(localStorage.getItem("events"));

  const date = id.split("_")[0];
  const dateEvents = events?.find((e) => e.date === date)?.events; // grab date's events

  if (!dateEvents) {
    // if date doesn't exist, add new event and list explicitly
    return { date, events: [{ ...item, id: `${date}_${uuidv4()}` }] };
  }

  return {
    date,
    events: [...dateEvents, { ...item, id: `${date}_${uuidv4()}` }],
  };
};

// SAVING AN EDITED EVENT

export const editEvent = (item, id) => {
  const events = JSON.parse(localStorage.getItem("events"));

  const date = id.split("_")[0];
  const dateEvents = events.find((e) => e.date === date).events; // grab events of the day
  const eventIndex = dateEvents.findIndex((e) => e.id === id); // grab index of event

  dateEvents[eventIndex] = { ...item, id }; // replace event with new/updated one

  return { date: date, events: dateEvents };
};

// DELETING AN EVENT

export const deleteEvent = (date, id) => {
  const events = JSON.parse(localStorage.getItem("events"));

  return events.find((e) => e.date === date).events.filter((e) => e.id !== id);
};
