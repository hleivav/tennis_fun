import { useState, useEffect } from 'react';
import { getAllTournaments, getTournamentById, reportMatch, updateMatch, getMatchResultsForGroup, getActiveTournaments, createNextRound, updateGroupParticipants } from './services/api';
import MatchReportModal from './MatchReportModal';
import './OngoingTournament.css';

export default function OngoingTournament({ tournamentData = null, isReadOnly = false, isAdmin = false }) {
  const [tournament, setTournament] = useState(tournamentData);
  const [loading, setLoading] = useState(!tournamentData);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchResults, setMatchResults] = useState({}); // groupId -> array of results
  const [playoffSetup, setPlayoffSetup] = useState({}); // groupId -> { player1: null, player2: null, filled: false }

  useEffect(() => {
    if (!tournamentData) {
      loadLatestTournament();
    } else {
      // If tournamentData is provided, set it and load match results
      setTournament(tournamentData);
      initializePlayoffSetup(tournamentData);
      loadAllMatchResults(tournamentData.groups);
    }
  }, [tournamentData]);

  // Automatisk uppdatering var 10:e sekund
  useEffect(() => {
    if (!tournament || isReadOnly || tournamentData) {
      // Inget polling för arkiverade turneringar eller om tournamentData är given
      return;
    }

    const intervalId = setInterval(() => {
      refreshData();
    }, 10000); // 10 sekunder

    return () => clearInterval(intervalId);
  }, [tournament, isReadOnly, tournamentData]);

  // Uppdatera data i bakgrunden utan att visa loading-spinner
  const refreshData = async () => {
    if (!tournament) return;

    try {
      console.log('Uppdaterar data i bakgrunden...');
      const fullTournament = await getTournamentById(tournament.id);
      setTournament(fullTournament);
      
      // Uppdatera playoff setup för nya tomma grupper
      initializePlayoffSetup(fullTournament);
      
      // Hämta matchresultat för alla grupper
      await loadAllMatchResults(fullTournament.groups);
    } catch (err) {
      console.error('Fel vid uppdatering av data:', err);
      // Fortsätt tysta, försök igen vid nästa intervall
    }
  };

  // Initiera playoff setup för tomma grupper
  const initializePlayoffSetup = (tournament) => {
    const newSetup = {};
    tournament.groups.forEach(group => {
      if (group.participants.length === 0) {
        newSetup[group.id] = { player1: null, player2: null, filled: false };
      }
    });
    if (Object.keys(newSetup).length > 0) {
      console.log('Initierar playoff setup:', newSetup);
      setPlayoffSetup(newSetup); // Ersätt helt
    }
  };

  const loadLatestTournament = async () => {
    try {
      setLoading(true);
      console.log('Hämtar turneringar från backend...');
      const tournaments = await getActiveTournaments();
      console.log('Turneringar hämtade:', tournaments);
      
      if (tournaments.length === 0) {
        setError('Ingen turnering hittades. Skapa en turnering först.');
        setLoading(false);
        return;
      }

      // Hämta den senaste turneringen (första i listan då den är sorterad efter datum)
      const latestTournament = tournaments[0];
      console.log('Hämtar fullständig turnering för ID:', latestTournament.id);
      const fullTournament = await getTournamentById(latestTournament.id);
      console.log('Fullständig turnering:', fullTournament);
      setTournament(fullTournament);
      
      // Initiera playoff setup för tomma grupper
      initializePlayoffSetup(fullTournament);
      
      // Hämta matchresultat för alla grupper
      await loadAllMatchResults(fullTournament.groups);
      
      setLoading(false);
    } catch (err) {
      console.error('Fel vid hämtning av turnering:', err);
      console.error('Error detaljer:', err.message, err.response?.status, err.response?.data);
      setError(`Kunde inte hämta turnering från backend: ${err.message}`);
      setLoading(false);
    }
  };

  const loadAllMatchResults = async (groups) => {
    const results = {};
    for (const group of groups) {
      try {
        const groupResults = await getMatchResultsForGroup(group.id);
        results[group.id] = groupResults;
      } catch (error) {
        console.error(`Fel vid hämtning av resultat för grupp ${group.id}:`, error);
        results[group.id] = [];
      }
    }
    setMatchResults(results);
  };

  // Generera alla möjliga matcher för en grupp (round-robin)
  const generateMatches = (participants) => {
    // För knockout-grupper (exakt 2 spelare): visa bara 1 match
    if (participants.length === 2) {
      return [{
        player1: participants[0],
        player2: participants[1]
      }];
    }
    
    // För round-robin grupper: generera alla möjliga matcher
    const matches = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          player1: participants[i],
          player2: participants[j]
        });
      }
    }
    return matches;
  };

  // Hitta resultat för en specifik match
  const getResultForMatch = (groupId, player1, player2) => {
    const results = matchResults[groupId] || [];
    return results.find(r => 
      (r.player1 === player1 && r.player2 === player2) ||
      (r.player1 === player2 && r.player2 === player1)
    );
  };

  // Beräkna poäng för en spelare (2 poäng för vinst, 0 för förlust)
  const calculatePoints = (groupId, playerName) => {
    const results = matchResults[groupId] || [];
    let points = 0;

    results.forEach(result => {
      if (result.winner === playerName) {
        points += 2;
      }
    });

    return points;
  };

  // Beräkna setskillnad för en spelare i en grupp
  const calculateSetDifference = (groupId, playerName) => {
    const results = matchResults[groupId] || [];
    let gamesWon = 0;
    let gamesLost = 0;

    results.forEach(result => {
      if (result.player1 === playerName) {
        gamesWon += result.score1;
        gamesLost += result.score2;
      } else if (result.player2 === playerName) {
        gamesWon += result.score2;
        gamesLost += result.score1;
      }
    });

    return gamesWon - gamesLost;
  };

  // Beräkna totalt antal vunna games för en spelare
  const calculateGamesWon = (groupId, playerName) => {
    const results = matchResults[groupId] || [];
    let gamesWon = 0;

    results.forEach(result => {
      if (result.player1 === playerName) {
        gamesWon += result.score1;
      } else if (result.player2 === playerName) {
        gamesWon += result.score2;
      }
    });

    return gamesWon;
  };

  // Sortera spelare efter poäng, setskillnad och vunna games
  const getSortedParticipants = (groupId, participants) => {
    return [...participants].sort((a, b) => {
      const pointsA = calculatePoints(groupId, a);
      const pointsB = calculatePoints(groupId, b);
      
      // Sortera efter poäng först
      if (pointsA !== pointsB) {
        return pointsB - pointsA; // Högst poäng först
      }
      
      // Om lika poäng, använd setskillnad
      const setDiffA = calculateSetDifference(groupId, a);
      const setDiffB = calculateSetDifference(groupId, b);
      if (setDiffA !== setDiffB) {
        return setDiffB - setDiffA; // Högst setskillnad först
      }

      // Om lika setskillnad, använd totalt antal vunna games
      const gamesWonA = calculateGamesWon(groupId, a);
      const gamesWonB = calculateGamesWon(groupId, b);
      return gamesWonB - gamesWonA; // Flest vunna games först
    });
  };

  // Beräkna total poäng för en spelare över alla grupper
  const calculateTotalPoints = (playerName) => {
    let totalPoints = 0;
    tournament.groups.forEach(group => {
      if (group.participants.includes(playerName)) {
        totalPoints += calculatePoints(group.id, playerName);
      }
    });
    return totalPoints;
  };

  // Beräkna total setskillnad för en spelare över alla grupper
  const calculateTotalSetDifference = (playerName) => {
    let totalSetDiff = 0;
    tournament.groups.forEach(group => {
      if (group.participants.includes(playerName)) {
        totalSetDiff += calculateSetDifference(group.id, playerName);
      }
    });
    return totalSetDiff;
  };

  // Beräkna totalt antal vunna games för en spelare över alla grupper
  const calculateTotalGamesWon = (playerName) => {
    let totalGamesWon = 0;
    tournament.groups.forEach(group => {
      if (group.participants.includes(playerName)) {
        totalGamesWon += calculateGamesWon(group.id, playerName);
      }
    });
    return totalGamesWon;
  };

  // Hämta alla unika spelare från alla grupper
  const getAllPlayers = () => {
    const allPlayers = new Set();
    tournament.groups.forEach(group => {
      group.participants.forEach(participant => {
        allPlayers.add(participant);
      });
    });
    return Array.from(allPlayers);
  };

  // Sortera alla spelare efter total poäng, setskillnad och vunna games
  const getTotalRanking = () => {
    const allPlayers = getAllPlayers();
    return allPlayers.sort((a, b) => {
      const pointsA = calculateTotalPoints(a);
      const pointsB = calculateTotalPoints(b);
      
      if (pointsA !== pointsB) {
        return pointsB - pointsA;
      }
      
      const setDiffA = calculateTotalSetDifference(a);
      const setDiffB = calculateTotalSetDifference(b);
      if (setDiffA !== setDiffB) {
        return setDiffB - setDiffA;
      }

      const gamesWonA = calculateTotalGamesWon(a);
      const gamesWonB = calculateTotalGamesWon(b);
      return gamesWonB - gamesWonA;
    });
  };

  // Kolla om alla matcher i turneringen är rapporterade
  const areAllMatchesReported = () => {
    return tournament.groups.every(group => {
      if (group.participants.length === 0) return false; // Tomma grupper är inte klara
      const matches = generateMatches(group.participants);
      return matches.every(match => 
        getResultForMatch(group.id, match.player1, match.player2) !== undefined
      );
    });
  };

  // Kolla om det finns tomma playoff-slots att fylla
  const hasEmptyPlayoffSlots = () => {
    return Object.values(playoffSetup).some(setup => !setup.filled);
  };

  // Identifiera vilka grupper som är round-robin (> 2 deltagare) kontra playoff (2 eller 0 deltagare)
  const getRoundRobinGroups = () => {
    return tournament.groups.filter(g => g.participants.length > 2);
  };

  const getPlayoffGroups = () => {
    return tournament.groups.filter(g => g.participants.length <= 2);
  };

  // Gruppera playoff-grupper efter omgång
  const getPlayoffRounds = () => {
    const playoffGroups = getPlayoffGroups();
    if (playoffGroups.length === 0) return [];
    
    // Sortera efter groupNumber
    const sorted = [...playoffGroups].sort((a, b) => a.groupNumber - b.groupNumber);
    
    // Gruppera baserat på antal matcher (4 matcher = omgång 1, 2 matcher = omgång 2, 1 match = final)
    const rounds = [];
    let currentRound = [];
    let expectedMatchCount = null;
    
    sorted.forEach(group => {
      if (currentRound.length === 0) {
        currentRound.push(group);
      } else {
        // Kolla om denna grupp tillhör samma omgång baserat på antal matcher
        // Om vi har 4 matcher och får en 5:e, betyder det ny omgång
        const prevMatchCount = currentRound.length;
        
        // Om nästa match skulle göra antalet till en potens av 2 gånger 2, börja ny omgång
        if (currentRound.length > 0 && (prevMatchCount === 1 || prevMatchCount === 2 || prevMatchCount === 4 || prevMatchCount === 8)) {
          // Anta att vi har kommit till en ny omgång
          if (group.groupNumber > currentRound[currentRound.length - 1].groupNumber + 1 || 
              currentRound.length >= prevMatchCount) {
            rounds.push([...currentRound]);
            currentRound = [group];
          } else {
            currentRound.push(group);
          }
        } else {
          currentRound.push(group);
        }
      }
    });
    
    if (currentRound.length > 0) {
      rounds.push(currentRound);
    }
    
    // Enklare logik: gruppera baserat på antal matcher som är typiska
    // Om vi har 8, 4, 2, 1 matcher per omgång
    const betterRounds = [];
    let tempGroups = [...sorted];
    
    while (tempGroups.length > 0) {
      // Försök hitta logisk gruppstorlek
      let roundSize = tempGroups.length >= 4 ? 4 : tempGroups.length >= 2 ? 2 : 1;
      
      // Specialfall: om första gruppen har många, ta alla från första setet
      if (betterRounds.length === 0 && tempGroups.length >= 4) {
        // Ta första 4 eller 8 beroende på storlek
        roundSize = tempGroups.length >= 8 ? 8 : 4;
      } else if (tempGroups.length >= 4) {
        roundSize = 4;
      } else if (tempGroups.length >= 2) {
        roundSize = 2;
      } else {
        roundSize = 1;
      }
      
      betterRounds.push(tempGroups.slice(0, roundSize));
      tempGroups = tempGroups.slice(roundSize);
    }
    
    return betterRounds;
  };

  // Hämta alla spelare från en specific omgång
  const getPlayersFromRound = (roundGroups) => {
    const players = new Set();
    roundGroups.forEach(group => {
      group.participants.forEach(p => players.add(p));
    });
    return Array.from(players);
  };

  // Hämta vinnare från en omgång
  const getWinnersFromRound = (roundGroups) => {
    const winners = [];
    roundGroups.forEach(group => {
      const results = matchResults[group.id] || [];
      results.forEach(result => {
        if (result.winner && !winners.includes(result.winner)) {
          winners.push(result.winner);
        }
      });
    });
    return winners;
  };

  // Bestäm rubrik baserat på antal matcher i omgången
  const getRoundTitle = (roundGroups) => {
    const matchCount = roundGroups.length;
    if (matchCount === 1) return 'Final';
    if (matchCount === 2) return 'Semifinaler';
    if (matchCount === 4) return 'Kvartsfinaler';
    if (matchCount === 8) return 'Åttondelsfinaler';
    if (matchCount === 16) return 'Sextondelsfinaler';
    return `Omgång (${matchCount} matcher)`;
  };

  // Hitta vilken omgång som är aktiv (har tomma slots)
  const getActiveRoundIndex = () => {
    const rounds = getPlayoffRounds();
    for (let i = 0; i < rounds.length; i++) {
      const hasEmptySlots = rounds[i].some(g => g.participants.length === 0);
      if (hasEmptySlots) return i;
    }
    return -1;
  };

  // Hantera matchrapportering
  const handleMatchClick = (match, groupId) => {
    setSelectedMatch({ ...match, groupId });
  };

  const handleEditMatch = (match, groupId, existingResult) => {
    setSelectedMatch({ ...match, groupId, existingResult });
  };

  const handlePlayerDoubleClick = async (playerName) => {
    if (isReadOnly) return;
    
    // Hitta första tomma slotten i playoff setup
    const emptyGroups = Object.entries(playoffSetup)
      .filter(([_, setup]) => !setup.filled)
      .sort((a, b) => {
        const groupA = tournament.groups.find(g => g.id === parseInt(a[0]));
        const groupB = tournament.groups.find(g => g.id === parseInt(b[0]));
        return groupA.groupNumber - groupB.groupNumber;
      });
    
    if (emptyGroups.length === 0) {
      alert('Alla matchplatser är redan ifyllda');
      return;
    }
    
    // Kolla om spelaren redan är placerad någonstans
    const alreadyPlaced = Object.entries(playoffSetup).some(([_, setup]) => 
      setup.player1 === playerName || setup.player2 === playerName
    );
    
    if (alreadyPlaced) {
      alert('Denna spelare är redan placerad i en match');
      return;
    }
    
    const [groupId, setup] = emptyGroups[0];
    const newSetup = { ...playoffSetup };
    
    if (!setup.player1) {
      newSetup[groupId] = { ...setup, player1: playerName };
    } else if (!setup.player2) {
      newSetup[groupId] = { ...setup, player2: playerName, filled: true };
      
      // Uppdatera backend när båda players är ifyllda
      try {
        await updateGroupParticipants(parseInt(groupId), [setup.player1, playerName]);
        
        // Uppdatera turneringen lokalt
        const updatedTournament = { ...tournament };
        const group = updatedTournament.groups.find(g => g.id === parseInt(groupId));
        if (group) {
          group.participants = [setup.player1, playerName];
        }
        setTournament(updatedTournament);
      } catch (error) {
        console.error('Fel vid uppdatering av gruppdeltagare:', error);
        alert('Fel vid uppdatering av deltagare: ' + (error.response?.data?.message || error.message));
        return;
      }
    }
    
    setPlayoffSetup(newSetup);
  };

  // Funktion för att ta bort en spelare från en match
  const handleRemovePlayerFromMatch = (groupId, playerName) => {
    // Återställ matchuppställningen lokalt (utan att uppdatera backend)
    // Backend uppdateras först när användaren väljer nya spelare
    const updatedTournament = { ...tournament };
    const group = updatedTournament.groups.find(g => g.id === parseInt(groupId));
    if (group) {
      group.participants = [];
    }
    setTournament(updatedTournament);
    
    // Återställ hela setupen för denna grupp
    const newSetup = { ...playoffSetup };
    newSetup[groupId] = { player1: null, player2: null, filled: false };
    setPlayoffSetup(newSetup);
  };

  const handleReportSubmit = async (reportData) => {
    const isEditMode = !!reportData.matchId;
    try {
      if (isEditMode) {
        console.log('Uppdaterar match:', reportData);
        await updateMatch(reportData.matchId, reportData);
      } else {
        console.log('Rapporterar match:', reportData);
        await reportMatch(reportData);
      }
      
      // Uppdatera matchresultat för gruppen
      const updatedResults = await getMatchResultsForGroup(reportData.groupId);
      setMatchResults(prev => ({
        ...prev,
        [reportData.groupId]: updatedResults
      }));
      
      setSelectedMatch(null);
      alert(isEditMode ? 'Match uppdaterad!' : 'Match rapporterad!');
    } catch (error) {
      console.error(`Fel vid ${isEditMode ? 'uppdatering' : 'rapportering'}:`, error);
      alert(`Fel: ${error.response?.data?.message || `Ett fel uppstod vid ${isEditMode ? 'uppdatering' : 'rapportering'}`}`);
    }
  };

  const handleCreateNextRound = async () => {
    let numberOfPlayers;
    
    // Kolla om det finns knockout-grupper (grupper med 2 deltagare som är ifyllda)
    const playoffRounds = getPlayoffRounds();
    
    if (playoffRounds.length === 0) {
      // Första playoff-omgången - fråga användaren
      const input = prompt('Hur många spelare ska gå vidare till knockout-omgången?');
      if (!input) return; // Användaren avbröt
      
      numberOfPlayers = parseInt(input);
      if (isNaN(numberOfPlayers) || numberOfPlayers < 2 || numberOfPlayers % 2 !== 0) {
        alert('Antal spelare måste vara ett jämnt tal som är minst 2');
        return;
      }
    } else {
      // Efterföljande omgångar - antal spelare = antal grupper i senaste omgången
      const lastRound = playoffRounds[playoffRounds.length - 1];
      numberOfPlayers = lastRound.length; // Antal matcher i senaste omgången = antal vinnare
    }
    
    // Bestäm vilken rubrik nästa omgång kommer att ha
    const nextMatchCount = numberOfPlayers / 2;
    let nextRoundTitle = 'nästa omgång';
    if (nextMatchCount === 1) nextRoundTitle = 'finalen';
    else if (nextMatchCount === 2) nextRoundTitle = 'semifinalerna';
    else if (nextMatchCount === 4) nextRoundTitle = 'kvartsfinalen';
    else if (nextMatchCount === 8) nextRoundTitle = 'åttondelsfinalen';
    
    if (!window.confirm(`Skapa ${nextMatchCount} ${nextMatchCount === 1 ? 'match' : 'matcher'} för ${nextRoundTitle}?`)) {
      return;
    }
    
    try {
      console.log('Skapar nästa omgång med antal spelare:', numberOfPlayers);
      const updatedTournament = await createNextRound(tournament.id, numberOfPlayers);
      setTournament(updatedTournament);
      
      // Rensa och återskapa playoff setup för ALLA tomma grupper
      const newSetup = {};
      updatedTournament.groups.forEach(group => {
        if (group.participants.length === 0) {
          newSetup[group.id] = { player1: null, player2: null, filled: false };
        }
      });
      console.log('Nytt playoff setup:', newSetup);
      setPlayoffSetup(newSetup); // Ersätt helt, sprida inte gamla värden
      
      // Hämta matchresultat för alla grupper
      await loadAllMatchResults(updatedTournament.groups);
      
    } catch (error) {
      console.error('Fel vid skapande av nästa omgång:', error);
      alert(`Fel: ${error.response?.data?.message || 'Ett fel uppstod vid skapande av nästa omgång'}`);
    }
  };

  if (loading) {
    return (
      <div className="ongoing-tournament-container">
        <div className="loading">Laddar turnering...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ongoing-tournament-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="ongoing-tournament-container">
        <div className="error-message">Ingen turnering hittades</div>
      </div>
    );
  }

  return (
    <div className="ongoing-tournament-container">
      <div className="tournament-header">
        <h1>{tournament.name}</h1>
        <h3>{new Date(tournament.date).toLocaleDateString('sv-SE', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h3>
      </div>

      {/* Round-robin groups (gruppspel) */}
      {getRoundRobinGroups().length > 0 && (
        <>
          <h2 className="section-header">Gruppspel</h2>
          <div className="groups-container">
            {getRoundRobinGroups().map((group) => (
              <div key={group.id} className="group-section">
                <h2 className="group-title">Grupp {group.groupNumber}</h2>
                
                {group.court1 || group.court2 ? (
                  <div className="group-courts">
                    {group.court1 && <span className="court-badge">Bana: {group.court1}</span>}
                    {group.court2 && <span className="court-badge">Bana: {group.court2}</span>}
                  </div>
                ) : null}
                
                <div className="participants-list">
                  <h3>Spelare:</h3>
                  {getSortedParticipants(group.id, group.participants).map((participant, index) => {
                    const points = calculatePoints(group.id, participant);
                    const setDiff = calculateSetDifference(group.id, participant);
                    return (
                      <div key={index} className="participant-name">
                        <span className="player-info">
                          <span className="player-position">{index + 1}.</span>
                          <span>{participant}</span>
                        </span>
                        <span className="player-stats">
                          <span className="points">{points}p</span>
                          <span className={`set-diff ${setDiff >= 0 ? 'positive' : 'negative'}`}>
                            ({setDiff >= 0 ? '+' : ''}{setDiff})
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="matches-list">
                  <h3>Matcher:</h3>
                  {generateMatches(group.participants).map((match, index) => {
                    const result = getResultForMatch(group.id, match.player1, match.player2);
                    return (
                      <div 
                        key={index} 
                        className={`match-row ${result ? 'completed' : isReadOnly ? '' : 'clickable'}`}
                        onClick={() => !result && !isReadOnly && handleMatchClick(match, group.id)}
                        style={isReadOnly && !result ? { cursor: 'default' } : {}}
                      >
                        {result ? (
                          <>
                            <span className="player">{result.player1}</span>
                            {result.status === 'WALKOVER' ? (
                              <span className="score-wo">W.O.</span>
                            ) : (
                              <>
                                <span className="score">{result.score1 ?? '-'}</span>
                                <span className="vs">-</span>
                                <span className="score">{result.score2 ?? '-'}</span>
                              </>
                            )}
                            <span className="player">{result.player2}</span>
                            {!isReadOnly && (
                              <button 
                                className="edit-match-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditMatch(match, group.id, result);
                                }}
                                title="Redigera resultat"
                              >
                                ✏️
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="player">{match.player1}</span>
                            <span className="vs">vs</span>
                            <span className="player">{match.player2}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Playoff rounds */}
      {getPlayoffRounds().map((roundGroups, roundIndex) => {
        const roundNumber = roundIndex + 1;
        const activeRoundIndex = getActiveRoundIndex();
        const isActiveRound = roundIndex === activeRoundIndex;
        const prevRoundGroups = roundIndex > 0 ? getPlayoffRounds()[roundIndex - 1] : null;
        const roundTitle = getRoundTitle(roundGroups);
        const prevRoundTitle = prevRoundGroups ? getRoundTitle(prevRoundGroups) : '';
        
        return (
          <div key={`round-${roundIndex}`} className="playoff-round-section">
            <h2 className="section-header">{roundTitle}</h2>
            
            {/* Visa spelare från föregående omgång om den finns */}
            {isActiveRound && prevRoundGroups && hasEmptyPlayoffSlots() && !isReadOnly && (
              <div className="previous-round-players">
                <h3>Välj spelare från {prevRoundTitle.toLowerCase()}:</h3>
                <div className="player-selection-list">
                  {getPlayersFromRound(prevRoundGroups).map((player, idx) => {
                    const isPlaced = Object.values(playoffSetup).some(s => s.player1 === player || s.player2 === player);
                    const isWinner = getWinnersFromRound(prevRoundGroups).includes(player);
                    return (
                      <div
                        key={idx}
                        className={`selectable-player ${isPlaced ? 'placed' : ''} ${isWinner ? 'winner' : 'loser'}`}
                        onDoubleClick={() => !isPlaced && !isReadOnly && handlePlayerDoubleClick(player)}
                        title={isPlaced ? 'Redan placerad' : 'Dubbelklicka för att placera'}
                      >
                        <span>{player}</span>
                        {isWinner && <span className="winner-badge">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Visa matcher för denna omgång */}
            <div className="playoff-matches">
              {roundGroups.map((group, matchIndex) => (
                <div key={group.id} className="playoff-match-card">
                  <h3 className="match-title">Match {matchIndex + 1}</h3>
                  
                  {group.participants.length === 0 ? (
                    <div className="empty-playoff-setup">
                      {playoffSetup[group.id] ? (
                        <div className="playoff-slots">
                          <div className={`player-slot ${playoffSetup[group.id].player1 ? 'filled' : 'empty'}`}>
                            {playoffSetup[group.id].player1 || 'Väntar på spelare...'}
                          </div>
                          <span className="vs">VS</span>
                          <div className={`player-slot ${playoffSetup[group.id].player2 ? 'filled' : 'empty'}`}>
                            {playoffSetup[group.id].player2 || 'Väntar på spelare...'}
                          </div>
                        </div>
                      ) : (
                        <p>Väntar på matchuppställning</p>
                      )}
                    </div>
                  ) : (
                    <div className="playoff-match-display">
                      {generateMatches(group.participants).map((match, idx) => {
                        const result = getResultForMatch(group.id, match.player1, match.player2);
                        return (
                          <div key={idx} className={`playoff-match-row ${result ? 'completed' : ''}`}>
                            <div className="player-side">
                              <span 
                                className="player-name"
                                onDoubleClick={() => !result && !isReadOnly && handleRemovePlayerFromMatch(group.id, match.player1)}
                                style={!result && !isReadOnly ? { cursor: 'pointer' } : {}}
                                title={!result && !isReadOnly ? 'Dubbelklicka för att ta bort från match' : ''}
                              >
                                {match.player1}
                              </span>
                              {result && <span className="player-score">{result.score1 ?? '-'}</span>}
                            </div>
                            <div className="match-divider">
                              {result ? (
                                result.status === 'WALKOVER' ? 'W.O.' : 'vs'
                              ) : 'vs'}
                            </div>
                            <div className="player-side">
                              {result && <span className="player-score">{result.score2 ?? '-'}</span>}
                              <span 
                                className="player-name"
                                onDoubleClick={() => !result && !isReadOnly && handleRemovePlayerFromMatch(group.id, match.player2)}
                                style={!result && !isReadOnly ? { cursor: 'pointer' } : {}}
                                title={!result && !isReadOnly ? 'Dubbelklicka för att ta bort från match' : ''}
                              >
                                {match.player2}
                              </span>
                            </div>
                            {!result && !isReadOnly && (
                              <button 
                                className="report-btn"
                                onClick={() => handleMatchClick(match, group.id)}
                              >
                                Rapportera
                              </button>
                            )}
                            {result && !isReadOnly && (
                              <button 
                                className="edit-match-btn"
                                onClick={() => handleEditMatch(match, group.id, result)}
                                title="Redigera resultat"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="total-ranking-section">
        <h2 className="ranking-title">Total Ranking</h2>
        {hasEmptyPlayoffSlots() && getActiveRoundIndex() === 0 && !isReadOnly && (() => {
          const firstPlayoffRound = getPlayoffRounds()[0];
          const firstRoundTitle = firstPlayoffRound ? getRoundTitle(firstPlayoffRound).toLowerCase() : 'första playoff-omgången';
          return <p className="playoff-instruction">Dubbelklicka på en spelare för att placera i {firstRoundTitle}</p>;
        })()}
        <div className="ranking-list">
          {getTotalRanking().map((player, index) => {
            const totalPoints = calculateTotalPoints(player);
            const totalSetDiff = calculateTotalSetDifference(player);
            const isPlaced = Object.values(playoffSetup).some(s => s.player1 === player || s.player2 === player);
            const canSelect = hasEmptyPlayoffSlots() && getActiveRoundIndex() === 0 && !isReadOnly && !isPlaced;
            return (
              <div 
                key={index} 
                className={`ranking-item ${index < 3 ? `rank-${index + 1}` : ''} ${canSelect ? 'clickable' : ''} ${isPlaced ? 'placed' : ''}`}
                onDoubleClick={() => canSelect && handlePlayerDoubleClick(player)}
                title={isPlaced ? 'Redan placerad i match' : (canSelect ? 'Dubbelklicka för att placera i match' : '')}
              >
                <span className="rank-position">{index + 1}</span>
                <span className="rank-player">{player}</span>
                <span className="rank-stats">
                  <span className="rank-points">{totalPoints}p</span>
                  <span className={`rank-set-diff ${totalSetDiff >= 0 ? 'positive' : 'negative'}`}>
                    ({totalSetDiff >= 0 ? '+' : ''}{totalSetDiff})
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        {!isReadOnly && isAdmin && areAllMatchesReported() && !hasEmptyPlayoffSlots() && (
          <button className="create-next-round-btn" onClick={handleCreateNextRound}>
            Skapa nästa omgång
          </button>
        )}
      </div>

      {selectedMatch && !isReadOnly && (
        <MatchReportModal
          match={selectedMatch}
          groupId={selectedMatch.groupId}
          onClose={() => setSelectedMatch(null)}
          onSubmit={handleReportSubmit}
          existingResult={selectedMatch.existingResult}
        />
      )}
    </div>
  );
}
