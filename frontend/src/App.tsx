import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminPage from './pages/AdminPage'; // This will be our "Add Word" page
import ReportsPage from './pages/ReportsPage';
// import HomePage from './pages/HomePage'; // If you want a dedicated home page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default page could be AdminPage or a new HomePage */}
          <Route index element={<AdminPage />} />
          <Route path="add-word" element={<AdminPage />} />
          <Route path="reports" element={<ReportsPage />} />
          {/* Add other routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
