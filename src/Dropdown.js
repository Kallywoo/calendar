import React, { useState } from "react";
import styled from "styled-components";

export const Dropdown = () => {
  let timeout = null;

  const [open, setOpen] = useState(false);

  const onBlurHandler = () => {
    timeout = setTimeout(() => {
      setOpen(false);
    });
  };

  const onFocusHandler = () => {
    clearTimeout(timeout);
  };

  // media query values for which buttons should disappear and appear in the dropdown (commented numbers are without sync)
  let todayPx = 493;
  let weekPx = 605; // 576
  let monthPx = 690; // 683
  let yearPx = 767; // 683
  let syncPx = 787;

  return (
    <>
      <Outside 
        mediaQ={todayPx} 
        aria-label="Jump to Today" 
        name="today"
      >
        Today
      </Outside>
      <Divider aria-hidden={true}>|</Divider>
      <Outside 
        mediaQ={weekPx} 
        aria-label="Filter by Week" 
        name="week"
      >
        Week
      </Outside>
      <Outside 
        mediaQ={monthPx} 
        aria-label="Filter by Month" 
        name="month"
      >
        Month
      </Outside>
      <Outside 
        mediaQ={yearPx} 
        aria-label="Filter by Year" 
        name="year"
      >
        Year
      </Outside>
      <Divider mediaQ={weekPx} aria-hidden={true}>|</Divider>
      <Outside 
        mediaQ={syncPx} 
        aria-label="Filter by Year" 
        name="sync"
      >
        Sync
      </Outside>
      {open && <Backdrop mediaQ={open} onClick={() => setOpen(false)} />}
      <Header onBlur={() => onBlurHandler()} onFocus={() => onFocusHandler()}>
        <Button
          mediaQ={syncPx}
          onClick={() => setOpen(!open)}
          aria-label={!open ? `Open "All Filters"` : `Close "All Filters"`}
        >
          {open ? "-" : "+"}
        </Button>
        {open && (
          <List>
            <Inside 
              mediaQ={todayPx} 
              aria-label="Jump to Today" 
              name="today"
            >
              Today
            </Inside>
            <Inside 
              mediaQ={weekPx} 
              aria-label="Filter by Week" 
              name="week"
            >
              Week
            </Inside>
            <Inside 
              mediaQ={monthPx} 
              aria-label="Filter by Month" 
              name="month"
            >
              Month
            </Inside>
            <Inside 
              mediaQ={yearPx} 
              aria-label="Filter by Year" 
              name="year"
            >
              Year
            </Inside>
            <Inside 
              mediaQ={syncPx} 
              aria-label="Filter by Year" 
              name="sync"
            >
              Sync
            </Inside>
          </List>
        )}
      </Header>
    </>
  );
};

const Header = styled.div`
  position: relative;
`;

const Outside = styled.button`
  font-size: 1.25em;
  border: none;
  background-color: transparent;
  cursor: pointer;
  margin: 0em 0.5em;

  &:hover {
    background-color: lightgrey;
  };

  @media only screen and (max-width: ${(props) => props.mediaQ}px) {
    display: none;
  };
`;

const Button = styled.button`
  display: none;
  background-color: transparent;
  width: 50px;
  height: 50px;
  padding: 0;
  margin-right: 0.5em;
  vertical-align: middle;
  font-size: 1.5em;
  font-weight: bold;
  border: none;
  cursor: pointer;

  &:hover,
  &:active {
    background-color: lightgrey;
  };

  @media only screen and (max-width: ${(props) => props.mediaQ}px) {
    display: block;
  };
`;

const Divider = styled.span`
  font-size: 1.5em;
  margin: 0em 0.5em;

  @media only screen and (max-width: ${(props) => props.mediaQ}px) {
    display: none;
  };
`;

const List = styled.div`
  display: block;
  padding: 0.75em;
  position: absolute;
  background-color: white;
  width: fit-content;
  top: 50px;
  right: 1em;
  box-shadow: 0 1px 5px #1c1c1c;
  z-index: 1;
`;

const Inside = styled(Outside)`
  display: none;
  font-size: 1.1em;
  width: 100%;
  margin: 0;
  padding: 0.25em;

  @media only screen and (max-width: ${(props) => props.mediaQ}px) {
    display: block;
  };
`;

const Backdrop = styled.div`
  display: ${(props) => (props.mediaQ ? "block" : "none")};
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;
