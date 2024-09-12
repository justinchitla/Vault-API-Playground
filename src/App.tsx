import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import StakingInterface from './components/StakingInterface';
import DepositorInformation from './components/DepositorInformation';
import VaultInformation from './components/VaultInformation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="sidebar">
          <ul>
            <li>
              <Link to="/">Transactions</Link>
            </li>
            <li>
              <Link to="/depositor">Depositor Information</Link>
            </li>
            <li>
              <Link to="/vault">Vault Information</Link>
            </li>
          </ul>
        </nav>
        <div className="main-content-wrapper">
          <Routes>
            <Route path="/" element={<StakingInterface />} />
            <Route path="/depositor" element={<DepositorInformation />} />
            <Route path="/vault" element={<VaultInformation />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;