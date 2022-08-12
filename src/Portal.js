import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const portalRoot =
  typeof document !== `undefined` ? document.getElementById("portal") : null;

export const Portal = ({ children }) => {
  const elRef = useRef(null);

  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    portalRoot.appendChild(elRef.current);
    return () => portalRoot.removeChild(elRef.current);
  }, []);

  if (elRef.current) {
    return createPortal(<div>{children}</div>, elRef.current);
  } else {
    return null;
  }
};
