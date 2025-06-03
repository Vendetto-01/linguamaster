import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css'; // We'll create this for styling

const Layout: React.FC = () => {
  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item brand-text">WordWizard Admin</Link>
        </div>
        <div className="navbar-menu">
          <div className="navbar-start">
            <div className="navbar-item has-dropdown is-hoverable">
              <span className="navbar-link">Sözcük İşlemleri</span>
              <div className="navbar-dropdown">
                <Link to="/add-word" className="navbar-item">Sözcük Ekle/Yönet</Link>
                {/* Add more word-related links here if needed */}
              </div>
            </div>
            <div className="navbar-item has-dropdown is-hoverable">
              <span className="navbar-link">Raporlar</span>
              <div className="navbar-dropdown">
                <Link to="/reports" className="navbar-item">Raporları Görüntüle</Link>
                {/* This will be empty or link to a placeholder for now */}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet /> {/* Page content will be rendered here */}
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} WordWizard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;