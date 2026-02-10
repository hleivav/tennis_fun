import { useState, useEffect } from 'react';
import './AdminForm.css';
import { createTournament, getActiveTournaments, deleteAllTournaments, archiveTournament } from './services/api';

export default function AdminForm() {
  const [tournamentName, setTournamentName] = useState('');
  const [date, setDate] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [participantList, setParticipantList] = useState('');
  const [groups, setGroups] = useState(Array(9).fill().map(() => []));
  const [groupCourts, setGroupCourts] = useState(Array(9).fill().map(() => ({ court1: '', court2: '' })));
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasTournament, setHasTournament] = useState(false);
  const [currentTournamentId, setCurrentTournamentId] = useState(null);

  const courtOptions = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

  // Kontrollera om det finns turneringar när komponenten laddas
  useEffect(() => {
    checkForTournaments();
  }, []);

  const checkForTournaments = async () => {
    try {
      const tournaments = await getActiveTournaments();
      setHasTournament(tournaments.length > 0);
      if (tournaments.length > 0) {
        setCurrentTournamentId(tournaments[0].id);
      } else {
        setCurrentTournamentId(null);
      }
    } catch (error) {
      console.error('Fel vid kontroll av turneringar:', error);
      setHasTournament(false);
      setCurrentTournamentId(null);
    }
  };

  const handleCourtChange = (groupIndex, courtNumber, value) => {
    const newGroupCourts = [...groupCourts];
    newGroupCourts[groupIndex][courtNumber] = value;
    setGroupCourts(newGroupCourts);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        
        // Försök olika encodings för att hitta rätt för svenska tecken
        let content = '';
        try {
          // Försök först med Windows-1252 (vanligast för Windows-textfiler i Sverige)
          const decoder = new TextDecoder('windows-1252');
          content = decoder.decode(arrayBuffer);
        } catch (error) {
          // Om det misslyckas, försök UTF-8
          try {
            const decoder = new TextDecoder('utf-8');
            content = decoder.decode(arrayBuffer);
          } catch (e) {
            // Sista försöket: ISO-8859-1
            const decoder = new TextDecoder('iso-8859-1');
            content = decoder.decode(arrayBuffer);
          }
        }
        
        // Rensa bort eventuella BOM-markeringar och andra problem
        content = content.replace(/^\uFEFF/, ''); // Ta bort UTF-8 BOM
        content = content.replace(/\r\n/g, '\n'); // Normalisera radbrytningar
        content = content.replace(/\r/g, '\n'); // Ta bort eventuella kvarvarande \r
        content = content.trim();
        
        // Lägg till innehållet från filen till deltagarlistan
        if (participantList.trim()) {
          setParticipantList(`${participantList}\n${content}`);
        } else {
          setParticipantList(content);
        }
      };
      reader.onerror = () => {
        alert('Kunde inte läsa filen. Försök igen.');
      };
      // Läs filen som ArrayBuffer för bättre kontroll över encoding
      reader.readAsArrayBuffer(file);
    }
    // Återställ input så samma fil kan laddas igen om behov finns
    e.target.value = '';
  };

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      const newList = participantList
        ? `${participantList}\n${playerName.trim()}`
        : playerName.trim();
      setParticipantList(newList);
      setPlayerName('');
    }
  };

  const handlePlayerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  const handleRemovePlayer = (nameToRemove) => {
    const participants = participantList.split('\n').filter(name => name.trim());
    const updatedList = participants.filter(name => name.trim() !== nameToRemove.trim());
    setParticipantList(updatedList.join('\n'));
  };

  const getParticipantArray = () => {
    return participantList.split('\n').filter(name => name.trim());
  };

  const handleClearParticipants = () => {
    if (participantList.trim() && window.confirm('Vill du verkligen tömma deltagarlistan?')) {
      setParticipantList('');
    }
  };

  // Drag and drop funktioner
  const handleDragStart = (e, name, source, groupIndex = null) => {
    // Förhindra drag and drop om det finns en pågående turnering
    if (hasTournament) {
      e.preventDefault();
      return;
    }
    setDraggedItem({ name, source, groupIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToGroup = (e, targetGroupIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    const targetGroup = groups[targetGroupIndex];
    
    // Kolla om gruppen redan har 5 namn
    if (targetGroup.length >= 5) {
      alert('Denna grupp är full (max 5 deltagare)');
      return;
    }

    // Kolla om namnet redan finns i målgruppen
    if (targetGroup.includes(draggedItem.name)) {
      return;
    }

    const newGroups = [...groups];

    // Ta bort från källan
    if (draggedItem.source === 'participant') {
      // Ta bort från deltagarlistan
      handleRemovePlayer(draggedItem.name);
    } else if (draggedItem.source === 'group') {
      // Ta bort från ursprungsgruppen
      newGroups[draggedItem.groupIndex] = newGroups[draggedItem.groupIndex].filter(
        n => n !== draggedItem.name
      );
    }

    // Lägg till i målgruppen
    newGroups[targetGroupIndex] = [...newGroups[targetGroupIndex], draggedItem.name];
    setGroups(newGroups);
    setDraggedItem(null);
  };

  const handleRemoveFromGroup = (groupIndex, name) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = newGroups[groupIndex].filter(n => n !== name);
    setGroups(newGroups);
    // Lägg tillbaka i deltagarlistan
    const newList = participantList
      ? `${participantList}\n${name}`
      : name;
    setParticipantList(newList);
  };

  const handleDeleteTournament = async () => {
    if (!confirm('Är du säker på att du vill radera pågående turnering?')) {
      return;
    }
    
    try {
      await deleteAllTournaments();
      console.log('Alla turneringar raderade');
      alert('Turneringen har raderats!');
      setHasTournament(false);
      setCurrentTournamentId(null);
    } catch (error) {
      console.error('Fel vid radering av turneringar:', error);
      alert('Fel: ' + (error.response?.data?.message || 'Ett fel uppstod vid radering'));
    }
  };

  const handleArchiveTournament = async () => {
    if (!currentTournamentId) {
      alert('Ingen turnering att arkivera');
      return;
    }

    if (!confirm('Vill du flytta pågående turnering till arkivet?')) {
      return;
    }

    try {
      await archiveTournament(currentTournamentId);
      console.log('Turnering arkiverad');
      alert('Turneringen har flyttats till arkivet!');
      setHasTournament(false);
      setCurrentTournamentId(null);
    } catch (error) {
      console.error('Fel vid arkivering av turnering:', error);
      alert('Fel: ' + (error.response?.data?.message || 'Ett fel uppstod vid arkivering'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validering: Deltagarlistan måste vara tom
    if (participantList.trim() !== '') {
      alert('Deltagarlistan måste vara tom innan du skapar turneringen. Dra över alla deltagare till grupperna.');
      return;
    }
    
    // Validering: Kontrollera att namn och datum finns
    if (!tournamentName.trim()) {
      alert('Du måste ange ett turneringsnamn');
      return;
    }
    
    if (!date) {
      alert('Du måste välja ett datum');
      return;
    }
    
    // Validering: Minst en grupp måste ha deltagare
    const hasParticipants = groups.some(group => group.length > 0);
    if (!hasParticipants) {
      alert('Minst en grupp måste ha deltagare');
      return;
    }
    
    try {
      // Formatera data för backend
      const tournamentData = {
        name: tournamentName.trim(),
        date: date, // Format: YYYY-MM-DD (från input type="date")
        groups: groups.map((group, index) => ({
          groupNumber: index + 1,
          participants: group,
          court1: groupCourts[index].court1 || null,
          court2: groupCourts[index].court2 || null
        }))
      };
      
      console.log('Skickar turnering till backend:', tournamentData);
      
      // Skicka till backend
      const response = await createTournament(tournamentData);
      
      console.log('Turnering skapad:', response);
      alert(`Turnering "${response.name}" har skapats med ${response.groupCount} grupper!`);
      
      // Uppdatera state för att visa att det nu finns en turnering
      setHasTournament(true);
      setCurrentTournamentId(response.id);
      
      // Återställ formuläret
      setTournamentName('');
      setDate('');
      setPlayerName('');
      setParticipantList('');
      setGroups(Array(9).fill().map(() => []));
      setGroupCourts(Array(9).fill().map(() => ({ court1: '', court2: '' })));
      
    } catch (error) {
      console.error('Fel vid skapande av turnering:', error);
      const errorMessage = error.response?.data?.message || 'Ett fel uppstod vid skapande av turnering';
      alert('Fel: ' + errorMessage);
    }
  };

  return (
    <div className="admin-form-container">
      <form onSubmit={handleSubmit} className="admin-form">
        <h2 className="form-title">Skapa Turnering</h2>
        
        <div className="form-section">
          <h3 className="section-title">Turnering</h3>
          
          <div className="time-group">
            <div className="form-group">
              <label htmlFor="tournament-name">Turneringens namn</label>
              <input
                id="tournament-name"
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="form-input"
                placeholder="Ange turneringens namn"
                disabled={hasTournament}
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Datum</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                disabled={hasTournament}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Spelare och grupper</h3>
          
          <div className="form-group">
            <label htmlFor="player-name">Spelarens namn</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={handlePlayerKeyDown}
                className="form-input"
                placeholder="Ange spelarens namn"
                style={{ flex: 1 }}
                disabled={hasTournament}
              />
              <button
                type="button"
                onClick={handleAddPlayer}
                className="add-player-btn"
                title="Lägg till spelare"
                disabled={hasTournament}
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="participant-list">Deltagarlista (dra namn till grupper eller dubbelklicka för att ta bort)</label>
            {getParticipantArray().length > 0 ? (
              <div className="participant-list">
                {getParticipantArray().map((name, index) => (
                  <div
                    key={index}
                    className="participant-item"
                    draggable={!hasTournament}
                    onDragStart={(e) => handleDragStart(e, name, 'participant')}
                    onDoubleClick={() => !hasTournament && handleRemovePlayer(name)}
                    style={{ cursor: hasTournament ? 'not-allowed' : 'move' }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-participant-list">Inga deltagare ännu</div>
            )}
          </div>

          <div className="form-group">
            <input
              id="file-upload"
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => document.getElementById('file-upload').click()}
                className="file-upload-btn"
                style={{ flex: 1 }}
                disabled={hasTournament}
              >
                Ladda lista från fil
              </button>
              <button
                type="button"
                onClick={handleClearParticipants}
                className="file-upload-btn clear-btn"
                style={{ flex: 1 }}
                disabled={hasTournament}
              >
                Töm deltagarlistan
              </button>
            </div>
          </div>

          <div className="form-group" style={{marginTop: '30px'}}>
            <label>Grupper (dra deltagare hit, max 5 per grupp)</label>
            <div className="groups-grid">
              {groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="group-box"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropToGroup(e, groupIndex)}
                >
                  <div className="group-header">
                    <span>Grupp {groupIndex + 1}</span>
                    <div className="court-selectors">
                      <select
                        value={groupCourts[groupIndex].court1}
                        onChange={(e) => handleCourtChange(groupIndex, 'court1', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={hasTournament}
                      >
                        <option value="">Välj</option>
                        {courtOptions.map(court => (
                          <option key={court} value={court}>{court}</option>
                        ))}
                      </select>
                      <select
                        value={groupCourts[groupIndex].court2}
                        onChange={(e) => handleCourtChange(groupIndex, 'court2', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={hasTournament}
                      >
                        <option value="">Välj</option>
                        {courtOptions.map(court => (
                          <option key={court} value={court}>{court}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="group-members">
                    {group.length === 0 ? (
                      <div className="empty-group">Släpp deltagare här</div>
                    ) : (
                      group.map((name, nameIndex) => (
                        <div
                          key={nameIndex}
                          className="group-member"
                          draggable={!hasTournament}
                          onDragStart={(e) => handleDragStart(e, name, 'group', groupIndex)}
                          onDoubleClick={() => !hasTournament && handleRemoveFromGroup(groupIndex, name)}
                          style={{ cursor: hasTournament ? 'not-allowed' : 'move' }}
                        >
                          {name}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="group-count">{group.length}/5</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="button-group">
          <button 
            type="submit" 
            className="submit-btn create-btn"
            disabled={hasTournament}
          >
            Skapa turnering
          </button>
          <button 
            type="button" 
            className="submit-btn delete-btn"
            onClick={handleDeleteTournament}
            disabled={!hasTournament}
          >
            Ta bort pågående turnering
          </button>
          <button 
            type="button" 
            className="submit-btn archive-btn"
            onClick={handleArchiveTournament}
            disabled={!hasTournament}
          >
            Flytta pågående till arkiv
          </button>
        </div>
      </form>
    </div>
  );
}
