import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./views/Home/Home.jsx"
import MIDIEditor from "./views/MIDIEditor/MIDIEditor.jsx";

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/MIDIeditor" element={<MIDIEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
