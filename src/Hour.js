import React from "react";
import styled from "styled-components";

export const Hour = ({ hour, index, date, isPadding, isCurrentDay }) => {
  return (
    <HourContainer
      isPadding={isPadding}
      isCurrentDay={isCurrentDay}
      hour={hour}
    >
      <StyledHour id={`${date}_${index}_1`} name="add-event">
        {""}
      </StyledHour>
      <StyledHour2 id={`${date}_${index}_2`} name="add-event">
        {""}
      </StyledHour2>
    </HourContainer>
  );
};

const HourContainer = styled.div`
  display: grid;
  grid-template-rows: 50% 50%;
  height: 50px;
  overflow: hidden;
  border: 1px solid lightgrey;
  opacity: ${(props) => (!props.isPadding ? "1" : "0.5")};
  background-color: ${(props) => (props.isCurrentDay ? "#adffef" : "white")};
  grid-row: ${(props) => props.hour};
  position: absolute;
  width: 100%;
`;

const StyledHour = styled.button`
  display: flex;
  cursor: pointer;
  grid-column: 1;
  grid-row: 1;
  border: none;
  background-color: transparent;
  padding: 5px;

  &:nth-child(odd) {
    border-bottom: 2px dotted lightgrey;
  }

  &:hover {
    background-color: lightblue;
  }
`;

const StyledHour2 = styled(StyledHour)`
  grid-row: 2;
`;
