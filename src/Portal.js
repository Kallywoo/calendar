import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

let portalRoot = document.getElementById("portal");
if (!portalRoot) {
  portalRoot = document.createElement('div');
  portalRoot.setAttribute('id', 'portal');
  document.body.appendChild(portalRoot);
};

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
