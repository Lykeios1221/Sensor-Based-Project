import React from 'react'
import { useLocation, useRoutes } from "react-router";
import "./App.css";
import Auth from "./Auth";
import Homepage from "./Homepage";
import { AnimatePresence } from "framer-motion";

function App() {
  const location = useLocation();

  const element = useRoutes([
    {
      path: "/",
      element: <Homepage />,
    },
    {
      path: "/auth",
      element: <Auth />,
    },
  ]);


  if (!element) return null;

  return (
    <AnimatePresence mode="wait">
      {React.cloneElement(element, { key: location.pathname})}
    </AnimatePresence>
  );
}

export default App;
