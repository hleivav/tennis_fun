import { useState, useEffect } from 'react';
import { getArchivedTournaments, deleteTournament } from './services/api';
import './ArchivedTournaments.css';

function ArchivedTournaments({ onViewTournament, isAdmin }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedTournaments();
  }, []);

  const loadArchivedTournaments = async () => {
    try {
      const data = await getArchivedTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load archived tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteTournament = async (e, tournamentId, tournamentName) => {
    e.stopPropagation(); // Förhindra att kortet klickas
    
    if (!confirm(`Är du säker på att du vill radera turneringen "${tournamentName}"?`)) {
      return;
    }

    try {
      await deleteTournament(tournamentId);
      // Ta bort från listan
      setTournaments(tournaments.filter(t => t.id !== tournamentId));
    } catch (error) {
      console.error('Fel vid radering av turnering:', error);
      alert('Kunde inte radera turneringen');
    }
  };

  if (loading) {
    return (
      <div className="archived-container">
        <div className="loading">Laddar arkiverade turneringar...</div>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="archived-container">
        <h2 className="archived-title">Arkiverade turneringar</h2>
        <div className="no-tournaments">Inga arkiverade turneringar än</div>
      </div>
    );
  }

  return (
    <div className="archived-container">
      <h2 className="archived-title">Arkiverade turneringar</h2>
      <div className="tournament-list">
        {tournaments.map((tournament) => (
          <div 
            key={tournament.id} 
            className="tournament-card"
            onClick={() => onViewTournament(tournament.id)}
          >
            <div className="tournament-info">
              <h3 className="tournament-name">{tournament.name}</h3>
              <p className="tournament-date">{formatDate(tournament.createdAt)}</p>
              <p className="tournament-participants">
                {tournament.participantCount || 0} deltagare
              </p>
            </div>
            <div className="tournament-actions">
              {isAdmin && (
                <button 
                  className="delete-btn"
                  onClick={(e) => handleDeleteTournament(e, tournament.id, tournament.name)}
                  title="Ta bort turnering"
                >
                  🗑️
                </button>
              )}
              <div className="view-arrow">›</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchivedTournaments;
