
import { useState } from 'react';
import './Menu.css';
import logan from '../images/logan.png';

export default function Menu({ isAdmin, currentView, onNavigate, onLoginClick, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (view) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    onLoginClick();
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="main-menu">
      <div className="menu-header-mobile">
        <div className="menu-logo" onClick={() => handleNavigate('landing')} style={{cursor:'pointer'}}>
          <img src={logan} alt="Tennis Fun logga" className="logo-img" />
        </div>
        <button 
          className={`hamburger ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <ul className={isMenuOpen ? 'menu-open' : ''}>
        <li>
          <span 
            className={`menu-text ${currentView === 'landing' ? 'active' : ''}`} 
            onClick={() => handleNavigate('landing')}
          >
            Hem
          </span>
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'admin' ? 'active' : ''}`} 
            onClick={() => handleNavigate('admin')}
          >
            Admin
          </span>
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'ongoing' ? 'active' : ''}`} 
            onClick={() => handleNavigate('ongoing')}
          >
            Pågående tävling
          </span>
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'archive' ? 'active' : ''}`} 
            onClick={() => handleNavigate('archive')}
          >
            Arkiv
          </span>
        </li>
        {!isAdmin && (
          <li style={{marginLeft: 'auto'}}>
            <button onClick={handleLoginClick}>Logga in</button>
          </li>
        )}
        {isAdmin && (
          <li style={{marginLeft: 'auto'}}>
            <button className="logout-btn" onClick={handleLogout}>Logga ut</button>
          </li>
        )}
      </ul>
    </nav>
  );
}
