import { useState, useEffect } from 'react';
import './MatchReportModal.css';

export default function MatchReportModal({ match, groupId, onClose, onSubmit, existingResult = null }) {
  const [status, setStatus] = useState(existingResult ? existingResult.status : 'PLAYED');
  const [winner, setWinner] = useState(existingResult ? existingResult.winner : '');
  const [score1, setScore1] = useState(existingResult && existingResult.score1 !== null ? existingResult.score1.toString() : '');
  const [score2, setScore2] = useState(existingResult && existingResult.score2 !== null ? existingResult.score2.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = existingResult !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Förhindra dubbla submits
    if (isSubmitting) return;

    const s1 = score1.trim() === '' ? null : parseInt(score1);
    const s2 = score2.trim() === '' ? null : parseInt(score2);

    // Grundläggande validering
    if (status === 'PLAYED') {
      if (s1 === null || s2 === null) {
        alert('Båda spelarna måste ha ett resultat för en spelad match.');
        return;
      }
      if (s1 < 0 || s2 < 0 || s1 > 4 || s2 > 4) {
        alert('Resultatet måste vara mellan 0 och 4 games.');
        return;
      }
      if (s1 !== 4 && s2 !== 4) {
        alert('En spelare måste ha vunnit med 4 games.');
        return;
      }
      if (s1 === 4 && s2 === 4) {
        alert('Båda kan inte ha 4 games.');
        return;
      }
    } else if (status === 'WALKOVER' || status === 'RETIRED') {
      if (!winner) {
        alert('En vinnare måste utses.');
        return;
      }
    }
    
    if (status === 'RETIRED') {
        if (s1 === null || s2 === null) {
            alert('Resultat måste anges vid uppgiven match.');
            return;
        }
        if (s1 >= 4 || s2 >= 4) {
            alert('Inget resultat får vara 4 vid uppgiven match.');
            return;
        }
    }

    // Skicka resultat
    setIsSubmitting(true);
    try {
      await onSubmit({
        groupId,
        player1: match.player1,
        player2: match.player2,
        score1: s1,
        score2: s2,
        status,
        winner: status === 'PLAYED' ? (s1 > s2 ? match.player1 : match.player2) : winner,
        matchId: existingResult?.id
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderScoreInputs = () => {
    if (status === 'WALKOVER') {
      return <div className="wo-message">Walkover - Ingen poäng rapporteras</div>;
    }
    
    return (
      <div className="match-players">
        <div className="player-score-input">
          <label>{match.player1}</label>
          <input
            type="number"
            min="0"
            max={status === 'RETIRED' ? '3' : '4'}
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            placeholder="0-4"
            autoFocus
          />
          <span className="games-label">games</span>
        </div>
        
        <div className="vs-divider">VS</div>
        
        <div className="player-score-input">
          <label>{match.player2}</label>
          <input
            type="number"
            min="0"
            max={status === 'RETIRED' ? '3' : '4'}
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            placeholder="0-4"
          />
          <span className="games-label">games</span>
        </div>
      </div>
    );
  };

  const renderWinnerSelector = () => {
    if (status === 'PLAYED') return null;

    return (
      <div className="winner-selector">
        <label>Vinnare</label>
        <div className="radio-group">
          <label>
            <input 
              type="radio" 
              name="winner" 
              value={match.player1}
              checked={winner === match.player1}
              onChange={(e) => setWinner(e.target.value)}
            />
            {match.player1}
          </label>
          <label>
            <input 
              type="radio" 
              name="winner" 
              value={match.player2}
              checked={winner === match.player2}
              onChange={(e) => setWinner(e.target.value)}
            />
            {match.player2}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div className="match-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditMode ? 'Redigera match' : 'Rapportera match'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="status-selector">
            <label className={status === 'PLAYED' ? 'active' : ''}>
              <input type="radio" name="status" value="PLAYED" checked={status === 'PLAYED'} onChange={(e) => setStatus(e.target.value)} />
              Spelad
            </label>
            <label className={status === 'WALKOVER' ? 'active' : ''}>
              <input type="radio" name="status" value="WALKOVER" checked={status === 'WALKOVER'} onChange={(e) => setStatus(e.target.value)} />
              W.O.
            </label>
            <label className={status === 'RETIRED' ? 'active' : ''}>
              <input type="radio" name="status" value="RETIRED" checked={status === 'RETIRED'} onChange={(e) => setStatus(e.target.value)} />
              Uppgiven
            </label>
          </div>

          {renderWinnerSelector()}
          {renderScoreInputs()}
          
          <div className="modal-buttons">
            <button type="submit" className="submit-match-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sparar...' : (isEditMode ? 'Uppdatera' : 'Rapportera')}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
