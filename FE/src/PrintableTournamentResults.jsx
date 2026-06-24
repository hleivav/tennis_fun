import { createPortal } from 'react-dom';
import './PrintableTournamentResults.css';

const generateMatches = (participants) => {
  if (participants.length === 2) {
    return [{ player1: participants[0], player2: participants[1] }];
  }
  const matches = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({ player1: participants[i], player2: participants[j] });
    }
  }
  return matches;
};

const getResultForMatch = (groupId, player1, player2, matchResults) => {
  const results = matchResults[groupId] || [];
  return results.find(
    r =>
      (r.player1 === player1 && r.player2 === player2) ||
      (r.player1 === player2 && r.player2 === player1)
  );
};

const getRoundTitle = (roundGroups) => {
  const matchCount = roundGroups.length;
  if (matchCount === 1) return 'Final';
  if (matchCount === 2) return 'Semifinaler';
  if (matchCount === 4) return 'Kvartsfinaler';
  if (matchCount === 8) return 'Åttondelsfinaler';
  if (matchCount === 16) return 'Sextondelsfinaler';
  return `Omgång (${matchCount} matcher)`;
};

const formatMatchScore = (result) => {
  if (!result || result.status === 'WALKOVER') return null;
  const sets = [];
  const fmtSet = (s1, s2, tb1, tb2) => {
    if (s1 == null || s2 == null) return null;
    let str = `${s1}-${s2}`;
    if (tb1 != null && tb2 != null) str += `(${tb1}-${tb2})`;
    return str;
  };
  const s1 = fmtSet(result.score1, result.score2, result.tiebreak1Score1, result.tiebreak1Score2);
  if (s1) sets.push(s1);
  const s2 = fmtSet(result.set2Score1, result.set2Score2, result.tiebreak2Score1, result.tiebreak2Score2);
  if (s2) sets.push(s2);
  const s3 = fmtSet(result.set3Score1, result.set3Score2, result.tiebreak3Score1, result.tiebreak3Score2);
  if (s3) sets.push(s3);
  return sets;
};

export default function PrintableTournamentResults({ tournament, matchResults, onClose }) {
  const roundRobinGroups = tournament.groups.filter(g => g.participants.length > 2);
  const playoffGroups = tournament.groups.filter(g => g.participants.length <= 2 && g.participants.length > 0);
  const setsPerMatch = tournament?.setsPerMatch || 'ett-set';
  const isMultiSet = setsPerMatch !== 'ett-set';
  const isTbThirdSet = setsPerMatch === 'forst-till-tva-tb7' || setsPerMatch === 'forst-till-tva-super';

  const formattedDate = new Date(tournament.date).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getPlayoffRounds = () => {
    if (playoffGroups.length === 0) return [];
    const sorted = [...playoffGroups].sort((a, b) => a.groupNumber - b.groupNumber);
    const rounds = [];
    let tempGroups = [...sorted];
    while (tempGroups.length > 0) {
      let roundSize;
      if (rounds.length === 0 && tempGroups.length >= 4) {
        roundSize = tempGroups.length >= 8 ? 8 : 4;
      } else if (tempGroups.length >= 4) {
        roundSize = 4;
      } else if (tempGroups.length >= 2) {
        roundSize = 2;
      } else {
        roundSize = 1;
      }
      rounds.push(tempGroups.slice(0, roundSize));
      tempGroups = tempGroups.slice(roundSize);
    }
    return rounds;
  };

  const calculatePoints = (groupId, playerName) => {
    const results = matchResults[groupId] || [];
    return results.filter(r => r.winner === playerName).length * 2;
  };

  const calculateSetDifference = (groupId, playerName) => {
    const results = matchResults[groupId] || [];
    let setsWon = 0;
    let setsLost = 0;
    results.forEach(result => {
      const isP1 = result.player1 === playerName;
      const isP2 = result.player2 === playerName;
      if (!isP1 && !isP2) return;
      if (result.status === 'WALKOVER') return;
      const countSet = (s1, s2) => {
        if (s1 == null || s2 == null) return;
        const my = isP1 ? s1 : s2;
        const opp = isP1 ? s2 : s1;
        if (my > opp) setsWon++;
        else if (my < opp) setsLost++;
      };
      countSet(result.score1, result.score2);
      countSet(result.set2Score1, result.set2Score2);
      countSet(result.set3Score1, result.set3Score2);
    });
    return setsWon - setsLost;
  };

  const calculateGameDifference = (groupId, playerName) => {
    const results = matchResults[groupId] || [];
    let gamesWon = 0;
    let gamesLost = 0;
    results.forEach(result => {
      const isP1 = result.player1 === playerName;
      const isP2 = result.player2 === playerName;
      if (!isP1 && !isP2) return;
      const add = (s1, s2) => {
        if (s1 == null || s2 == null) return;
        if (isP1) { gamesWon += s1; gamesLost += s2; }
        else { gamesWon += s2; gamesLost += s1; }
      };
      add(result.score1, result.score2);
      add(result.set2Score1, result.set2Score2);
      if (!isTbThirdSet) add(result.set3Score1, result.set3Score2);
    });
    return gamesWon - gamesLost;
  };

  const getSortedParticipants = (groupId, participants) => {
    return [...participants].sort((a, b) => {
      const pA = calculatePoints(groupId, a);
      const pB = calculatePoints(groupId, b);
      if (pA !== pB) return pB - pA;
      const ssA = calculateSetDifference(groupId, a);
      const ssB = calculateSetDifference(groupId, b);
      if (ssA !== ssB) return ssB - ssA;
      return calculateGameDifference(groupId, b) - calculateGameDifference(groupId, a);
    });
  };

  const getFinalWinner = () => {
    const rounds = getPlayoffRounds();
    if (rounds.length === 0) return null;
    const finalRound = rounds[rounds.length - 1];
    if (finalRound.length !== 1) return null;
    const finalGroup = finalRound[0];
    const matches = generateMatches(finalGroup.participants);
    if (!matches.length) return null;
    const result = getResultForMatch(finalGroup.id, matches[0].player1, matches[0].player2, matchResults);
    return result?.winner || null;
  };

  const handlePrint = () => window.print();

  const playoffRounds = getPlayoffRounds();
  const winner = getFinalWinner();

  return createPortal(
    <div className="print-overlay">
      <div className="print-controls no-print">
        <button className="print-btn" onClick={handlePrint}>
          🖨️ Skriv ut / Spara som PDF
        </button>
        <button className="close-print-btn" onClick={onClose}>
          ✕ Stäng
        </button>
      </div>

      <div className="print-document">
        <div className="print-header">
          <h1>{tournament.name}</h1>
          <p className="print-date">{formattedDate}</p>
          <h2>Tävlingsresultat</h2>
        </div>

        {winner && (
          <div className="tr-winner-section">
            <div className="tr-trophy">🏆</div>
            <div className="tr-winner-name">{winner}</div>
            <div className="tr-winner-label">Vinnare</div>
          </div>
        )}

        {roundRobinGroups.length > 0 && (
          <section className="tr-section">
            <h3 className="tr-section-title">Gruppspel – Slutställning</h3>
            <div className="tr-groups-grid">
              {roundRobinGroups.map(group => {
                const sorted = getSortedParticipants(group.id, group.participants);
                const allResults = matchResults[group.id] || [];
                return (
                  <div key={group.id} className="tr-group-card">
                    <div className="tr-group-header">
                      Grupp {group.groupNumber}
                    </div>
                    <table className="tr-standings-table">
                      <thead>
                        <tr>
                          <th className="tr-th-pos">#</th>
                          <th className="tr-th-name">Spelare</th>
                          <th className="tr-th-stat" title="Poäng">P</th>
                          {isMultiSet && <th className="tr-th-stat" title="Setskillnad">SS</th>}
                          <th className="tr-th-stat" title="Gameskillnad">GS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((player, idx) => (
                          <tr key={player} className={idx === 0 ? 'tr-first-place' : ''}>
                            <td className="tr-td-pos">{idx + 1}</td>
                            <td className="tr-td-name">{player}</td>
                            <td className="tr-td-stat">{calculatePoints(group.id, player)}</td>
                            {isMultiSet && (
                              <td className="tr-td-stat">
                                {calculateSetDifference(group.id, player) > 0 ? '+' : ''}
                                {calculateSetDifference(group.id, player)}
                              </td>
                            )}
                            <td className="tr-td-stat">
                              {calculateGameDifference(group.id, player) > 0 ? '+' : ''}
                              {calculateGameDifference(group.id, player)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allResults.length > 0 && (
                      <div className="tr-group-matches">
                        <div className="tr-matches-label">Matchresultat:</div>
                        {generateMatches(group.participants).map((match, i) => {
                          const result = getResultForMatch(group.id, match.player1, match.player2, matchResults);
                          if (!result) return null;
                          const scores = isMultiSet ? formatMatchScore(result) : null;
                          const scoreStr = result.status === 'WALKOVER'
                            ? 'W.O.'
                            : scores?.length
                              ? scores.join('  ')
                              : `${result.score1}-${result.score2}`;
                          return (
                            <div key={i} className="tr-match-result-row">
                              <span className={result.winner === match.player1 ? 'tr-match-winner' : 'tr-match-loser'}>
                                {match.player1}
                              </span>
                              <span className="tr-match-score">{scoreStr}</span>
                              <span className={result.winner === match.player2 ? 'tr-match-winner' : 'tr-match-loser'}>
                                {match.player2}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {playoffRounds.length > 0 && (
          <section className="tr-section">
            <h3 className="tr-section-title">Slutspel</h3>
            {playoffRounds.map((roundGroups, roundIdx) => (
              <div key={roundIdx} className="tr-round">
                <h4 className="tr-round-title">{getRoundTitle(roundGroups)}</h4>
                <div className="tr-playoff-matches">
                  {roundGroups.map((group, matchIdx) => {
                    const matches = generateMatches(group.participants);
                    const match = matches[0];
                    if (!match) return null;
                    const result = getResultForMatch(group.id, match.player1, match.player2, matchResults);
                    const scores = result && isMultiSet ? formatMatchScore(result) : null;
                    const scoreStr = !result
                      ? null
                      : result.status === 'WALKOVER'
                        ? 'W.O.'
                        : scores?.length
                          ? scores.join('  ')
                          : `${result.score1}-${result.score2}`;
                    const isFinal = roundIdx === playoffRounds.length - 1;
                    return (
                      <div key={group.id} className={`tr-playoff-card ${isFinal ? 'tr-final-card' : ''}`}>
                        {isFinal && roundGroups.length === 1 && (
                          <div className="tr-final-badge">FINAL</div>
                        )}
                        {roundGroups.length > 1 && (
                          <div className="tr-match-label">Match {matchIdx + 1}</div>
                        )}
                        <div className="tr-playoff-row">
                          <span className={`tr-playoff-player ${result?.winner === match.player1 ? 'tr-playoff-winner' : result ? 'tr-playoff-loser' : ''}`}>
                            {match.player1}
                            {result?.winner === match.player1 && <span className="tr-win-check"> ✓</span>}
                          </span>
                          <span className="tr-playoff-vs">{scoreStr || 'vs'}</span>
                          <span className={`tr-playoff-player ${result?.winner === match.player2 ? 'tr-playoff-winner' : result ? 'tr-playoff-loser' : ''}`}>
                            {match.player2}
                            {result?.winner === match.player2 && <span className="tr-win-check"> ✓</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="print-footer no-print">Tennis Fun – Tävlingsresultat</div>
      </div>
    </div>,
    document.body
  );
}
