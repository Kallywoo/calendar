import { render, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import App from './App';

// KNOWN ISSUE: Event expects current time, so test may occasionally fail if performed between when time ticks to next minute

const now = new Date();
const month = now.getMonth() + 1; // get month without zero index
const year = now.getFullYear();
const hours = now.getHours();
const minutes = now.getMinutes();
const time = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10? `0${minutes}` : minutes}`; // get time with trailing zeroes
const date = `${year}-${month < 10 ? `0${month}` : month}-01`; // first date of month string for week filter

const mockEvent = {
  EventID: `${date}_1`,
  Title: "test",
  TimeFrom: time,
  TimeTo: time,
  Description: "",
  AllDay: false,
  Color: "#0057ba",
};

const mockGetEvents = jest.fn();
const mockAddEvent = jest.fn();
const mockEditEvent = jest.fn();
const mockDeleteEvent = jest.fn();

jest.mock('./api', () => ({
  getEvents: () => mockGetEvents.mockReturnValue([]),
  addEvent: (item, date) => mockAddEvent(item, date),
  editEvent: (item, id) => mockEditEvent(item, id),
  deleteEvent: (id) => mockDeleteEvent(id),
}));

const helper = async () => {
  const eventButton = screen.getByText('1');
  userEvent.click(eventButton);

  expect(await screen.findByText('New Event')).toBeInTheDocument();

  const input = screen.getByPlaceholderText('Event Title');
  const submitButton = screen.getByRole('button', { name: 'Save' });

  userEvent.type(input, 'Test event');
  userEvent.click(submitButton);

  await waitFor(() => {
    expect(mockAddEvent).toHaveBeenCalledWith({
      ...mockEvent, 
      Title: "Test event", 
      EventID: ""
    }, date);
  });

  await waitForElementToBeRemoved(() => screen.queryByText(/New Event/i));

  expect(screen.getByRole('button', { name: 'Edit test' })).toBeInTheDocument();
};

beforeEach(() => {
  window.localStorage.clear();
  mockAddEvent.mockReturnValue(mockEvent);
});

// --------------------------------------------------------------------------

describe('App', () => {
  it('renders correctly', async () => {
    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();
  });

  it('should filter by week when clicking Week', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    // end of setup

    const weekButton = screen.getByText('Week');

    userEvent.click(weekButton);

    expect(await screen.findAllByLabelText('1am')).toBeTruthy();
  });

  it('should filter by year when clicking Year', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    // end of setup

    const yearButton = screen.getByText('Year');

    userEvent.click(yearButton);

    expect(screen.getByLabelText(`January ${year}`)).toBeInTheDocument();
  });

  it('should cycle months when clicking an arrow button', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    // end of setup

    const currentMonth = now.getMonth().toLocaleString('default', { month: 'long' });

    expect(await screen.findByText(currentMonth)).toBeInTheDocument();

    const testDate = new Date();
    testDate.setMonth(now.getMonth() - 1);
    const previousMonth = testDate.toLocaleString('default', { month: 'long' });
    const cycleButton = screen.getByLabelText('Go to Previous Month');
    userEvent.click(cycleButton);

    expect(await screen.findByText(`${previousMonth} ${testDate.getFullYear()}`)).toBeInTheDocument();
  });

  it('should display Modal when clicking on a Day', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    // end of setup

    const eventButton = screen.getByText('1');
    userEvent.click(eventButton);

    expect(await screen.findByText('New Event')).toBeInTheDocument();
  });

  it('should add an Event when clicking Save on Modal', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    // end of setup
    
    // helper()
    const eventButton = screen.getByText('1');
    userEvent.click(eventButton);

    expect(await screen.findByText('New Event')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Event Title');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    userEvent.type(input, 'Test event');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddEvent).toHaveBeenCalledWith({
        ...mockEvent, 
        Title: "Test event", 
        EventID: ""
      }, date);
    });
    
    await waitForElementToBeRemoved(() => screen.queryByText(/New Event/i));
    
    expect(screen.getByRole('button', { name: 'Edit test' })).toBeInTheDocument();
  });

  it('should show Edit Modal when clicking on an Event', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    await helper();

    // end of setup

    const editButton = screen.getByRole('button', { name: 'Edit test' });

    userEvent.click(editButton);

    expect(await screen.findByText('Edit Event')).toBeInTheDocument();
  });

  it('should save edits when clicking Save on Modal', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    await helper();

    const editButton = screen.getByRole('button', { name: 'Edit test' });

    userEvent.click(editButton);

    expect(await screen.findByText('Edit Event')).toBeInTheDocument();

    // end of setup

    const input = screen.getByPlaceholderText('Event Title');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    userEvent.clear(input);
    userEvent.type(input, 'test-new');
    userEvent.click(submitButton);

    expect(mockEditEvent).toHaveBeenCalledWith({...mockEvent, Title: 'test-new'}, mockEvent.EventID);

    await waitForElementToBeRemoved(() => screen.queryByText(/Edit Event/i));
    
    expect(await screen.findByText('test-new')).toBeInTheDocument();
  });

  it('should delete an Event when clicking Delete on Modal', async () => {
    // setup

    render(<App />);

    expect(await screen.findByText('Mon')).toBeInTheDocument();

    await helper();

    const editButton = screen.getByRole('button', { name: 'Edit test' });

    userEvent.click(editButton);

    expect(await screen.findByText('Edit Event')).toBeInTheDocument();

    // end of setup

    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    userEvent.click(deleteButton);

    expect(mockDeleteEvent).toHaveBeenCalledWith(mockEvent.EventID);

    await waitForElementToBeRemoved(() => screen.queryByText(/Edit Event/i));

    expect(screen.queryByRole('button', { name: 'Edit test' })).not.toBeInTheDocument();
  });
});

it('should display the correct month selected from Year filter', async () => {
  // setup

  render(<App />);

  expect(await screen.findByText('Mon')).toBeInTheDocument();

  const yearButton = screen.getByText('Year');
  
  userEvent.click(yearButton);
  
  expect(screen.getByLabelText(`January ${year}`)).toBeInTheDocument();

  // end of setup

  const monthButton = screen.getByRole('button', { name: `February ${year}` });
  userEvent.click(monthButton);

  expect(screen.getByText(`February ${year}`)).toBeInTheDocument();
});

it('should auto-fill correct time when clicking on hour in Hour filter', async () => {
  // setup

  render(<App />);

  expect(await screen.findByText('Mon')).toBeInTheDocument();

  const weekButton = screen.getByText('Week');

  userEvent.click(weekButton);

  expect(await screen.findAllByLabelText('1am')).toBeTruthy();

  // end of setup

  const dayString = now.toDateString();

  expect(screen.getByLabelText(dayString)).toBeInTheDocument();

  const parentDiv = screen.getByLabelText(dayString);
  const hourDiv = within(parentDiv).getByLabelText("1am");
  const childButton = within(hourDiv).getByRole('button', { name: `30 to 60 minutes` });
  userEvent.click(childButton);

  expect(await screen.findByText('New Event')).toBeInTheDocument();
  
  const timeFrom = screen.getByLabelText('Event Time From');
  const timeTo = screen.getByLabelText('Event Time To');

  expect(timeFrom.value).toBe("01:30");
  expect(timeTo.value).toBe("02:00");
});