import { v4 as uuidv4 } from "uuid";

const uri = `${process.env.REACT_APP_INVOKE_URL}/events`;
const user = process.env.REACT_APP_USER;

// GETTING ALL EVENTS

export const getEvents = async () => {
  const res = await fetch(`${uri}/${user}/`);
  return await res.json();
};

// SAVING A NEW EVENT

export const addEvent = async (item, date) => {
  const id = `${date.split("_")[0]}_${uuidv4()}`;

  const event = { ...item, EventID: id };

  await fetch(`${uri}/${user}/${id}`, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ Username: user, ...event })
	})
	.then(response => response.json());

	return event;
};

// SAVING AN EDITED EVENT

export const editEvent = async (item, id) => {
  await fetch(`${uri}/${user}/${id}`, {
		method: 'PATCH',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ Username: user, ...item })
	});
};

// DELETING AN EVENT

export const deleteEvent = async (id) => {
  await fetch(`${uri}/${user}/${id}`, {
		method: 'DELETE'
	});
};
