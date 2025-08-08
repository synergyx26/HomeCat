import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FoodTracker from './pages/FoodTracker';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/food" element={<FoodTracker />} />
      </Routes>
    </Router>
  );
}

export default App;
