import './PrintableGroupSchedule.css';

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

export default function PrintableGroupSchedule({ tournament, onClose }) {
  const roundRobinGroups = tournament.groups.filter(g => g.participants.length > 2);
  const isMultiSet = tournament?.setsPerMatch && tournament.setsPerMatch !== 'ett-set';
  const isBestOfThree = tournament?.setsPerMatch === 'tre-set';

  const formattedDate = new Date(tournament.date).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => window.print();

  return (
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
          <h2>Matchschema – Gruppspel</h2>
        </div>

        <div className="print-groups-grid">
          {roundRobinGroups.map((group) => {
            const matches = generateMatches(group.participants);
            return (
              <div key={group.id} className="print-group-card">
                <div className="print-group-header">
                  <span className="print-group-title">Grupp {group.groupNumber}</span>
                  {(group.court1 || group.court2) && (
                    <span className="print-courts">
                      {[group.court1, group.court2].filter(Boolean).map(c => `Bana: ${c}`).join('  |  ')}
                    </span>
                  )}
                </div>

                <div className="print-players-section">
                  <strong>Spelare:</strong>
                  <ul className="print-players-list">
                    {group.participants.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="print-matches-section">
                  <strong>Matcher:</strong>
                  <table className="print-matches-table">
                    <tbody>
                      {matches.map((match, i) => (
                        <tr key={i} className="print-match-row">
                          <td className="print-player-name">{match.player1}</td>
                          {isBestOfThree ? (
                            <>
                              <td className="print-score-cell">
                                <span className="score-box"></span>
                                <span className="score-dash">–</span>
                                <span className="score-box"></span>
                              </td>
                              <td className="print-score-cell">
                                <span className="score-box"></span>
                                <span className="score-dash">–</span>
                                <span className="score-box"></span>
                              </td>
                              <td className="print-score-cell optional-set">
                                <span className="score-box"></span>
                                <span className="score-dash">–</span>
                                <span className="score-box"></span>
                              </td>
                            </>
                          ) : isMultiSet ? (
                            <>
                              <td className="print-score-cell">
                                <span className="score-box"></span>
                                <span className="score-dash">–</span>
                                <span className="score-box"></span>
                              </td>
                              <td className="print-score-cell">
                                <span className="score-box"></span>
                                <span className="score-dash">–</span>
                                <span className="score-box"></span>
                              </td>
                            </>
                          ) : (
                            <td className="print-score-cell">
                              <span className="score-box"></span>
                              <span className="score-dash">–</span>
                              <span className="score-box"></span>
                            </td>
                          )}
                          <td className="print-player-name">{match.player2}</td>
                          <td className="print-winner-cell">Vinnare: <span className="winner-line"></span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="print-footer no-print">
          Tennis Fun – Matchschema
        </div>
      </div>
    </div>
  );
}
