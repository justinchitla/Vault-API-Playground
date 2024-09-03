import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import StakingInterface from './components/StakingInterface';
import DepositorInformation from './components/DepositorInformation';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <nav className="sidebar">
          <ul>
            <li><Link to="/">Transactions</Link></li>
            <li><Link to="/depositor">Depositor Information</Link></li>
          </ul>
        </nav>
        <div className="main-content-wrapper">
        <Routes>
          <Route path="/" element={<StakingInterface />} />
          <Route path="/depositor" element={<DepositorInformation />} />
        </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;