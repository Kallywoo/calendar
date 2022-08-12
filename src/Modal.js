import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";

import { Portal } from "./Portal";

export const Modal = forwardRef(
  ({ cache, firstTab, lastTab, zIndex = 3, children }, ref) => {
    const [display, setDisplay] = useState(false);

    useImperativeHandle(ref, () => {
      return {
        openModal: () => handleOpen(),
        closeModal: () => handleClose(),
      };
    });

    const handleOpen = () => {
      setDisplay(true);
    };

    const handleClose = () => {
      setDisplay(false);
      cache.focus(); // gives focus back to last focused element before modal
    };

    const handleKeyDown = (e) => {
      switch (e.keyCode) {
        case 9: // TAB
          // tab traps the modal
          if (e.shiftKey) {
            // is SHIFT also held?
            if (document.activeElement === firstTab.current) {
              lastTab.current.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastTab.current) {
              firstTab.current.focus();
              e.preventDefault();
            }
          }
          break;
        case 27: // ESC
          handleClose();
          break;
        default:
          break;
      }
    };

    useEffect(() => {
      if (display) {
        firstTab.current.focus(); // sets focus on modal
        document.body.style.overflow = "hidden"; // disables background scrolling
      } else {
        document.body.style.overflow = "unset"; // re-enables scrolling
      }

      return () => (document.body.style.overflow = "unset");
    }, [display, firstTab, lastTab]);

    if (display) {
      return (
        <Portal>
          <ModalOverlay onClick={handleClose} zIndex={zIndex} />
          <ModalContainer
            onKeyDown={(e) => handleKeyDown(e)}
            role="dialog"
            zIndex={zIndex + 1}
          >
            {children}
          </ModalContainer>
        </Portal>
      );
    }

    return null;
  }
);

const ModalOverlay = styled.div`
  position: fixed;
  background-color: rgb(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: ${(props) => props.zIndex}; // quick way stack multiple modals
`;

const ModalContainer = styled.div`
  position: fixed;
  background-color: white;
  left: 50%;
  transform: translate(-50%, 0);
  top: 20%;
  z-index: ${(props) => props.zIndex};
  min-width: 560px;
  display: flex;
  flex-direction: column;

  @media only screen and (max-width: 560px) {
    width: 100%;
    transform: none;
    min-width: 0;
    left: 0;
  }

  @media only screen and (max-width: 414px) {
    display: grid;
    top: 0;
    height: 100%;
    padding: 0;
    grid-template-rows: auto 1fr auto;
  } ;
`;
