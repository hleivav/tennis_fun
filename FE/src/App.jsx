import { useState } from 'react';
import landnigsbild from '../images/landnigsbild.png';
import './App.css';
import Login from './Login';
import Menu from './Menu';
import AdminForm from './AdminForm';
import OngoingTournament from './OngoingTournament';
import ArchivedTournaments from './ArchivedTournaments';
import { getTournamentById } from './services/api';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentView, setCurrentView] = useState('landing'); // landing, admin, ongoing, archive, archivedTournament
  const [selectedArchivedTournament, setSelectedArchivedTournament] = useState(null);

  const handleLogout = () => {
    setIsAdmin(false);
    setShowLogin(false);
    setCurrentView('landing');
    setSelectedArchivedTournament(null);
  };

  const handleNavigation = (view) => {
    if (view === 'admin' && !isAdmin) {
      setShowLogin(true);
      setCurrentView('landing'); // Visa login-modal på landing-sidan
    } else if (view === 'admin' && isAdmin) {
      setCurrentView('admin');
      setSelectedArchivedTournament(null);
    } else {
      setCurrentView(view);
      setSelectedArchivedTournament(null);
    }
  };

  const handleViewArchivedTournament = async (tournamentId) => {
    try {
      const fullTournament = await getTournamentById(tournamentId);
      setSelectedArchivedTournament(fullTournament);
      setCurrentView('archivedTournament');
    } catch (error) {
      console.error('Fel vid hämtning av arkiverad turnering:', error);
      alert('Kunde inte hämta turneringen');
    }
  };

  const handleBackToArchive = () => {
    setSelectedArchivedTournament(null);
    setCurrentView('archive');
  };

  const showBackground = currentView === 'landing';

  return (
    <div className="App" style={showBackground ? { backgroundImage: `url(${landnigsbild})` } : {}}>
      <div className={showBackground ? "overlay" : "no-overlay"}>
        <Menu 
          isAdmin={isAdmin} 
          currentView={currentView}
          onNavigate={handleNavigation}
          onLoginClick={() => { 
            setShowLogin(true); 
            setCurrentView('landing'); // Visa login-modal på landing-sidan
          }} 
          onLogout={handleLogout} 
        />
        
        {currentView === 'landing' && (
          <header className="App-header">
            <h1>Tennis Fun</h1>
            <p>Välkommen till Tennis Fun applikationen!</p>
            {showLogin && (
              <Login onLogin={() => { 
                setIsAdmin(true); 
                setShowLogin(false); 
                setCurrentView('admin');
              }} />
            )}
          </header>
        )}
        
        {currentView === 'admin' && isAdmin && <AdminForm />}
        {currentView === 'ongoing' && <OngoingTournament isAdmin={isAdmin} />}
        {currentView === 'archive' && <ArchivedTournaments onViewTournament={handleViewArchivedTournament} isAdmin={isAdmin} />}
        {currentView === 'archivedTournament' && selectedArchivedTournament && (
          <div>
            <button 
              onClick={handleBackToArchive}
              style={{
                margin: '20px auto',
                display: 'block',
                padding: '10px 20px',
                background: '#f27b4a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              ← Tillbaka till arkiv
            </button>
            <OngoingTournament tournamentData={selectedArchivedTournament} isReadOnly={true} isAdmin={isAdmin} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App
