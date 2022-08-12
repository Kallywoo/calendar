import React, { useState, useRef } from "react";
import styled from "styled-components";

import { Modal } from "./Modal";

export const Day = ({ date, isPadding, isCurrentDay, events, dayString, children }) => {

  const [cachedTab, setCachedTab] = useState(null);
  const modalRef = useRef(null);

  const firstTab = useRef(null);
  const lastTab = useRef(null);

  const openModal = () => {
    setCachedTab(document.activeElement); // captures the last focused element to jump back to after the modal is closed (wonder if there's another way to do this with React?)
    modalRef.current.openModal();
  };

  const generateEvent = (e, i, origin) => {
    return (
      <ListItem
        ref={i === 0 ? firstTab : null}
        key={`${origin}_${e.id}`}
        color={e.color}
        $origin={origin}
      >
        <Event
          id={`${e.id}`}
          name="edit-event"
          aria-label={`Edit ${e.title}`}
          $origin={origin}
        >
          {origin === "list" && (
            <Times>
              {e.allDay ? (
                <Time>All day</Time>
              ) : (
                <>
                  <Time>{e.timeFrom}</Time>
                  <Time>{e.timeTo}</Time>
                </>
              )}
            </Times>
          )}
          {e.title}
        </Event>
      </ListItem>
    );
  };

  return (
    <DayContainer isPadding={isPadding} isCurrentDay={isCurrentDay}>
      <StyledDay id={date} name="add-event" aria-label="Add an Event">
        {children}
      </StyledDay>
      <Events>
        {events?.slice(0, 3).map((e, i) => generateEvent(e, i, "day"))}
        {events?.length > 3 && (
          <Event
            id={`${date}_x`}
            onClick={() => openModal()}
            aria-label="See all events"
          >
            ...
          </Event>
        )}
      </Events>
      <Modal
        ref={modalRef}
        cache={cachedTab}
        firstTab={firstTab}
        lastTab={lastTab}
        tabIndex={-1}
      >
        <ModalHeader>
          <H2>{dayString}</H2>
          <Cancel
            type="button"
            ref={lastTab}
            onClick={() => modalRef.current.closeModal()}
            aria-label="Cancel"
          >
            X
          </Cancel>
        </ModalHeader>
        <div>
          <List>{events?.map((e, i) => generateEvent(e, i, "list"))}</List>
          <ModalButton id={date} name="add-event">
            <span aria-hidden={true}>+</span> New Event
          </ModalButton>
        </div>
      </Modal>
    </DayContainer>
  );
};

const DayContainer = styled.div`
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 20% 80%;
  width: 100%;
  height: 100px;
  overflow: hidden;
  border: 1px solid lightgrey;
  background-color: white;
  opacity: ${(props) => (!props.isPadding ? "1" : "0.5")};
  box-shadow: ${(props) =>
    props.isCurrentDay ? "inset 0 10px 0px -7px #0057ba" : null};
  font-weight: ${(props) => (props.isCurrentDay ? "bold" : "normal")};
  color: ${(props) => (props.isCurrentDay ? "#0057ba" : null)};

  &:hover {
    background-color: lightblue;
  };
`;

const StyledDay = styled.button`
  display: flex;
  cursor: pointer;
  grid-column: 1;
  grid-row: 1/3;
  border: none;
  background-color: transparent;
  padding: 5px;
  font-weight: inherit;
  color: inherit;
`;

const Events = styled.ul`
  width: fit-content;
  height: fit-content;
  list-style: none;
  grid-column: 1;
  grid-row: 2;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${(props) => (props.$origin === "day" ? "90px" : "100%")};
  white-space: nowrap;
`;

const Event = styled.button`
  display: ${(props) => (props.$origin === "day" ? "block" : "flex")};
  align-items: center;
  border: none;
  cursor: pointer;
  font-weight: bold;
  background-color: transparent;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
  overflow: hidden;
  color: inherit;
  font-size: ${(props) => (props.$origin === "day" ? null : "inherit")};
  width: 100%;

  &:hover {
    background-color: ${(props) =>
      props.$origin !== "list" ? "darkgray" : "transparent"};
  };
`;

// MODAL

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
  margin: 0em;
`;

const List = styled.ul`
  padding: 0em 1em;
`;

const ListItem = styled.li`
  display: flex;
  color: ${(props) => props.color};
  font-size: ${(props) => (props.$origin === "list" ? "1.25em" : null)};
  margin: ${(props) => (props.$origin === "list" ? "0.25em 0" : null)};
  list-style: none;

  &::before {
    background-color: ${(props) => props.color};
    content: ${(props) => (props.$origin === "list" ? "'.'" : null)};
    width: 10px;
  };

  &:hover {
    background-color: lightblue;
  };
`;

const Times = styled.div`
  margin: 0.75em 0;
  width: 4em;
  pointer-events: none;
`;

const Time = styled.span`
  display: block;
  margin: 0em 1em;
  font-size: 0.9rem;
  font-weight: initial;
`;

const ModalButton = styled.button`
  border-style: none;
  background-color: darkred;
  color: white;
  padding: 0.75em 2em;
  cursor: pointer;
  margin-left: 1em;
  margin-bottom: 1em;
`;

const Cancel = styled(ModalButton)`
  padding: 0em 0.5em;
  margin: 0;

  &:hover {
    background-color: #5c0000;
  };
`;