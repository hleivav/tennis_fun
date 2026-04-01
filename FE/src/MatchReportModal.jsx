import { useState, useEffect } from 'react';
import './MatchReportModal.css';

export default function MatchReportModal({ match, groupId, onClose, onSubmit, onReset, existingResult = null, gamesPerSet = 4, setsPerMatch = 'ett-set' }) {
  const [status, setStatus] = useState(existingResult ? existingResult.status : 'PLAYED');
  const [winner, setWinner] = useState(existingResult ? existingResult.winner : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = existingResult !== null;
  const isMultiSet = setsPerMatch && setsPerMatch !== 'ett-set';

  // Single-set state
  const [score1, setScore1] = useState(existingResult && existingResult.score1 !== null ? existingResult.score1.toString() : '');
  const [score2, setScore2] = useState(existingResult && existingResult.score2 !== null ? existingResult.score2.toString() : '');

  // Multi-set state
  const initSet = (s1Field, s2Field, tb1Field, tb2Field) => ({
    score1: existingResult && existingResult[s1Field] !== null && existingResult[s1Field] !== undefined ? existingResult[s1Field].toString() : '',
    score2: existingResult && existingResult[s2Field] !== null && existingResult[s2Field] !== undefined ? existingResult[s2Field].toString() : '',
    tb1: existingResult && existingResult[tb1Field] !== null && existingResult[tb1Field] !== undefined ? existingResult[tb1Field].toString() : '',
    tb2: existingResult && existingResult[tb2Field] !== null && existingResult[tb2Field] !== undefined ? existingResult[tb2Field].toString() : '',
  });

  const [sets, setSets] = useState([
    initSet('score1', 'score2', 'tiebreak1Score1', 'tiebreak1Score2'),
    initSet('set2Score1', 'set2Score2', 'tiebreak2Score1', 'tiebreak2Score2'),
    initSet('set3Score1', 'set3Score2', 'tiebreak3Score1', 'tiebreak3Score2'),
  ]);

  const updateSet = (setIndex, field, value) => {
    setSets(prev => {
      const updated = [...prev];
      updated[setIndex] = { ...updated[setIndex], [field]: value };
      return updated;
    });
  };

  // Determine if tiebreak inputs should show for a given set
  const needsTiebreak = (setIndex) => {
    const s = sets[setIndex];
    const s1 = parseInt(s.score1);
    const s2 = parseInt(s.score2);
    if (isNaN(s1) || isNaN(s2)) return false;
    if (gamesPerSet === 6) return (s1 === 7 && s2 === 6) || (s1 === 6 && s2 === 7);
    return (s1 === gamesPerSet && s2 === gamesPerSet - 1) || (s1 === gamesPerSet - 1 && s2 === gamesPerSet);
  };

  const getTiebreakMax = () => gamesPerSet === 6 ? 7 : gamesPerSet + 1;
  const getMaxGames = () => gamesPerSet === 6 ? 7 : gamesPerSet;

  // Determine who won a set: true = player1, false = player2, null = invalid/undetermined
  const didPlayer1WinSet = (s1, s2) => {
    if (gamesPerSet === 6) {
      if ((s1 === 6 && s2 <= 4) || (s1 === 7 && (s2 === 5 || s2 === 6))) return true;
      if ((s2 === 6 && s1 <= 4) || (s2 === 7 && (s1 === 5 || s1 === 6))) return false;
    } else {
      if (s1 === gamesPerSet && s2 < gamesPerSet) return true;
      if (s2 === gamesPerSet && s1 < gamesPerSet) return false;
    }
    return null;
  };

  // Count sets won by each player (first 2 sets only)
  const countSetsWon = () => {
    let p1 = 0, p2 = 0;
    for (let i = 0; i < 2; i++) {
      const s = sets[i];
      const s1 = parseInt(s.score1), s2 = parseInt(s.score2);
      if (isNaN(s1) || isNaN(s2)) continue;
      const result = didPlayer1WinSet(s1, s2);
      if (result === true) p1++;
      if (result === false) p2++;
    }
    return [p1, p2];
  };

  const needsSet3 = () => {
    const [p1, p2] = countSetsWon();
    return p1 === 1 && p2 === 1;
  };

  const isSuperTiebreakMode = setsPerMatch === 'forst-till-tva-super';

  // Determine overall match winner for multi-set
  const determineMultiSetWinner = () => {
    const [p1, p2] = countSetsWon();
    if (p1 === 2) return match.player1;
    if (p2 === 2) return match.player2;
    if (p1 === 1 && p2 === 1) {
      const s = sets[2];
      const s1 = parseInt(s.score1), s2 = parseInt(s.score2);
      if (isNaN(s1) || isNaN(s2)) return null;
      if (isSuperTiebreakMode) {
        if (s1 === 10 && s2 < 10) return match.player1;
        if (s2 === 10 && s1 < 10) return match.player2;
        return null;
      } else {
        const result = didPlayer1WinSet(s1, s2);
        if (result === true) return match.player1;
        if (result === false) return match.player2;
        return null;
      }
    }
    return null;
  };

  // --- Single-set validation (unchanged logic) ---
  const validateSingleSet = () => {
    const s1 = score1.trim() === '' ? null : parseInt(score1);
    const s2 = score2.trim() === '' ? null : parseInt(score2);

    if (status === 'PLAYED') {
      if (s1 === null || s2 === null) {
        alert('Båda spelarna måste ha ett resultat för en spelad match.');
        return false;
      }
      if (gamesPerSet === 6) {
        const valid =
          (s1 === 6 && s2 <= 4) || (s2 === 6 && s1 <= 4) ||
          (s1 === 7 && (s2 === 5 || s2 === 6)) || (s2 === 7 && (s1 === 5 || s1 === 6));
        if (!valid) {
          alert('Ogiltigt resultat. Giltiga ställningar är t.ex. 6-0 till 6-4, 7-5 eller 7-6 (tie-break).');
          return false;
        }
      } else {
        if (s1 < 0 || s2 < 0 || s1 > gamesPerSet || s2 > gamesPerSet) {
          alert(`Resultatet måste vara mellan 0 och ${gamesPerSet} games.`);
          return false;
        }
        if (s1 !== gamesPerSet && s2 !== gamesPerSet) {
          alert(`En spelare måste ha vunnit med ${gamesPerSet} games.`);
          return false;
        }
        if (s1 === gamesPerSet && s2 === gamesPerSet) {
          alert(`Båda kan inte ha ${gamesPerSet} games.`);
          return false;
        }
      }
    }

    if (status === 'RETIRED') {
      if (s1 === null || s2 === null) {
        alert('Resultat måste anges vid uppgiven match.');
        return false;
      }
      const maxRetired = gamesPerSet === 6 ? 7 : gamesPerSet;
      if (s1 < 0 || s2 < 0 || s1 >= maxRetired || s2 >= maxRetired) {
        alert('Resultatet vid uppgiven match är ogiltigt.');
        return false;
      }
      const p1Won = gamesPerSet === 6
        ? ((s1 === 6 && s2 <= 4) || (s1 === 7 && (s2 === 5 || s2 === 6)))
        : s1 === gamesPerSet;
      const p2Won = gamesPerSet === 6
        ? ((s2 === 6 && s1 <= 4) || (s2 === 7 && (s1 === 5 || s1 === 6)))
        : s2 === gamesPerSet;
      if (p1Won || p2Won) {
        alert('Uppgiven match kan inte ha ett komplett vinnande resultat.');
        return false;
      }
    }
    return true;
  };

  // --- Multi-set validation ---
  const validateMultiSet = () => {
    if (status === 'PLAYED') {
      // Validate set 1 and 2
      for (let i = 0; i < 2; i++) {
        const s = sets[i];
        const s1 = parseInt(s.score1), s2 = parseInt(s.score2);
        if (isNaN(s1) || isNaN(s2)) {
          alert(`Set ${i + 1}: Båda spelarna måste ha ett resultat.`);
          return false;
        }
        const tied = gamesPerSet === 6 ? (s1 === 6 && s2 === 6) : (s1 === gamesPerSet - 1 && s2 === gamesPerSet - 1);
        if (tied) {
          const tie = gamesPerSet - 1;
          alert(gamesPerSet === 6
            ? `Set ${i + 1}: Ställningen 6-6 är ogiltig. Ange 7-6 eller 6-7 för ett set avgjort med tiebreak.`
            : `Set ${i + 1}: Ställningen ${tie}-${tie} är ogiltig. Ange ${gamesPerSet}-${tie} eller ${tie}-${gamesPerSet} för ett set avgjort med tiebreak.`);
          return false;
        }
        const setWinner = didPlayer1WinSet(s1, s2);
        if (setWinner === null) {
          alert(`Set ${i + 1}: Ogiltigt resultat.`);
          return false;
        }
      }

      // Validate set 3 if needed
      if (needsSet3()) {
        const s = sets[2];
        const s1 = parseInt(s.score1), s2 = parseInt(s.score2);
        if (isNaN(s1) || isNaN(s2)) {
          alert(isSuperTiebreakMode ? 'Super tiebreak: Resultat måste anges.' : 'Set 3: Båda spelarna måste ha ett resultat.');
          return false;
        }
        if (isSuperTiebreakMode) {
          if ((s1 !== 10 || s2 >= 10) && (s2 !== 10 || s1 >= 10)) {
            alert('Super tiebreak: En spelare måste nå 10 poäng.');
            return false;
          }
        } else {
          const tied = gamesPerSet === 6 ? (s1 === 6 && s2 === 6) : (s1 === gamesPerSet - 1 && s2 === gamesPerSet - 1);
          if (tied) {
            const tie = gamesPerSet - 1;
            alert(gamesPerSet === 6
              ? 'Set 3: Ställningen 6-6 är ogiltig. Ange 7-6 eller 6-7 för ett set avgjort med tiebreak.'
              : `Set 3: Ställningen ${tie}-${tie} är ogiltig. Ange ${gamesPerSet}-${tie} eller ${tie}-${gamesPerSet} för ett set avgjort med tiebreak.`);
            return false;
          }
          const setWinner = didPlayer1WinSet(s1, s2);
          if (setWinner === null) {
            alert('Set 3: Ogiltigt resultat.');
            return false;
          }
        }
      }

      const matchWinner = determineMultiSetWinner();
      if (!matchWinner) {
        alert('Kan inte fastställa vinnare. Kontrollera resultaten.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (status === 'WALKOVER' || status === 'RETIRED') {
      if (!winner) {
        alert('En vinnare måste utses.');
        return;
      }
    }

    if (isMultiSet) {
      if (status === 'PLAYED' && !validateMultiSet()) return;

      setIsSubmitting(true);
      try {
        const toInt = (val) => val === '' || val === undefined ? null : parseInt(val);
        const matchWinner = status === 'PLAYED' ? determineMultiSetWinner() : winner;

        await onSubmit({
          groupId,
          player1: match.player1,
          player2: match.player2,
          score1: toInt(sets[0].score1),
          score2: toInt(sets[0].score2),
          set2Score1: toInt(sets[1].score1),
          set2Score2: toInt(sets[1].score2),
          set3Score1: toInt(sets[2].score1),
          set3Score2: toInt(sets[2].score2),
          tiebreak1Score1: toInt(sets[0].tb1),
          tiebreak1Score2: toInt(sets[0].tb2),
          tiebreak2Score1: toInt(sets[1].tb1),
          tiebreak2Score2: toInt(sets[1].tb2),
          tiebreak3Score1: toInt(sets[2].tb1),
          tiebreak3Score2: toInt(sets[2].tb2),
          status,
          winner: matchWinner,
          matchId: existingResult?.id,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Single-set logic (unchanged)
      if (!validateSingleSet()) return;

      const s1 = score1.trim() === '' ? null : parseInt(score1);
      const s2 = score2.trim() === '' ? null : parseInt(score2);

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
          matchId: existingResult?.id,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- Render helpers ---

  const renderSetInputs = (setIndex, title) => {
    const s = sets[setIndex];
    return (
      <div className="set-section" key={setIndex}>
        <h4 className="set-title">{title}</h4>
        <div className="set-scores">
          <div className="set-player-input">
            <input
              type="number"
              min="0"
              max={getMaxGames()}
              value={s.score1}
              onChange={(e) => updateSet(setIndex, 'score1', e.target.value)}
              placeholder="0"
              autoFocus={setIndex === 0}
            />
          </div>
          <span className="set-divider">-</span>
          <div className="set-player-input">
            <input
              type="number"
              min="0"
              max={getMaxGames()}
              value={s.score2}
              onChange={(e) => updateSet(setIndex, 'score2', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        {needsTiebreak(setIndex) && (
          <div className="tiebreak-section">
            <span className="tiebreak-label">Tiebreak-poäng (valfritt)</span>
            <div className="set-scores tiebreak-scores">
              <div className="set-player-input">
                <input
                  type="number"
                  min="0"
                  max={getTiebreakMax()}
                  value={s.tb1}
                  onChange={(e) => updateSet(setIndex, 'tb1', e.target.value)}
                  placeholder="0"
                />
              </div>
              <span className="set-divider">-</span>
              <div className="set-player-input">
                <input
                  type="number"
                  min="0"
                  max={getTiebreakMax()}
                  value={s.tb2}
                  onChange={(e) => updateSet(setIndex, 'tb2', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSuperTiebreakInputs = () => {
    const s = sets[2];
    return (
      <div className="set-section">
        <h4 className="set-title">Super Tiebreak (först till 10)</h4>
        <div className="set-scores">
          <div className="set-player-input">
            <input
              type="number"
              min="0"
              max="10"
              value={s.score1}
              onChange={(e) => updateSet(2, 'score1', e.target.value)}
              placeholder="0"
            />
          </div>
          <span className="set-divider">-</span>
          <div className="set-player-input">
            <input
              type="number"
              min="0"
              max="10"
              value={s.score2}
              onChange={(e) => updateSet(2, 'score2', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderMultiSetScoreInputs = () => {
    if (status === 'WALKOVER') {
      return <div className="wo-message">Walkover - Ingen poäng rapporteras</div>;
    }

    const showSet3 = needsSet3();

    return (
      <div className="multi-set-container">
        <div className="multi-set-players">
          <span className="multi-set-player">{match.player1}</span>
          <span className="multi-set-player">{match.player2}</span>
        </div>
        {renderSetInputs(0, 'Set 1')}
        {renderSetInputs(1, 'Set 2')}
        {showSet3 && (
          isSuperTiebreakMode
            ? renderSuperTiebreakInputs()
            : renderSetInputs(2, 'Set 3')
        )}
      </div>
    );
  };

  const renderSingleSetScoreInputs = () => {
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
            max={gamesPerSet === 6 ? 7 : (status === 'RETIRED' ? gamesPerSet - 1 : gamesPerSet)}
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            placeholder={gamesPerSet === 6 ? '0-7' : `0-${gamesPerSet}`}
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
            max={gamesPerSet === 6 ? 7 : (status === 'RETIRED' ? gamesPerSet - 1 : gamesPerSet)}
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            placeholder={gamesPerSet === 6 ? '0-7' : `0-${gamesPerSet}`}
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
      <div className={`match-modal-content ${isMultiSet ? 'multi-set-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
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
          {isMultiSet ? renderMultiSetScoreInputs() : renderSingleSetScoreInputs()}
          
          <div className="modal-buttons">
            <button type="submit" className="submit-match-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sparar...' : (isEditMode ? 'Uppdatera' : 'Rapportera')}
            </button>
            {isEditMode && onReset && (
              <button type="button" onClick={() => onReset(existingResult.id)} className="reset-match-btn" disabled={isSubmitting}>
                Nollställ
              </button>
            )}
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
