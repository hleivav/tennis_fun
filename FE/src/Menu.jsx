
import './Menu.css';
import logan from '../images/logan.png';

export default function Menu({ isAdmin, currentView, onNavigate, onLoginClick, onLogout }) {
  return (
    <nav className="main-menu">
      <ul>
        <li className="menu-logo" onClick={() => onNavigate('landing')} style={{cursor:'pointer'}}>
          <img src={logan} alt="Tennis Fun logga" className="logo-img" />
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'landing' ? 'active' : ''}`} 
            onClick={() => onNavigate('landing')}
          >
            Hem
          </span>
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'admin' ? 'active' : ''}`} 
            onClick={() => onNavigate('admin')}
          >
            Admin
          </span>
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'ongoing' ? 'active' : ''}`} 
            onClick={() => onNavigate('ongoing')}
          >
            Pågående tävling
          </span>
        </li>
        <li>
          <span 
            className={`menu-text ${currentView === 'archive' ? 'active' : ''}`} 
            onClick={() => onNavigate('archive')}
          >
            Arkiv
          </span>
        </li>
        {!isAdmin && (
          <li style={{marginLeft: 'auto'}}>
            <button onClick={onLoginClick}>Logga in</button>
          </li>
        )}
        {isAdmin && (
          <li style={{marginLeft: 'auto'}}>
            <button className="logout-btn" onClick={onLogout}>Logga ut</button>
          </li>
        )}
      </ul>
    </nav>
  );
}
