import axios from 'axios';

// Use environment variable for API URL, fallback to /api for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const createTournament = async (tournamentData) => {
  const response = await api.post('/tournaments', tournamentData);
  return response.data;
};

export const getAllTournaments = async () => {
  const response = await api.get('/tournaments');
  return response.data;
};

export const getActiveTournaments = async () => {
  const response = await api.get('/tournaments/active');
  return response.data;
};

export const getArchivedTournaments = async () => {
  const response = await api.get('/tournaments/archived');
  return response.data;
};

export const getTournamentById = async (id) => {
  const response = await api.get(`/tournaments/${id}`);
  return response.data;
};

export const archiveTournament = async (id) => {
  const response = await api.put(`/tournaments/${id}/archive`);
  return response.data;
};

export const deleteTournament = async (id) => {
  const response = await api.delete(`/tournaments/${id}`);
  return response.data;
};

export const deleteAllTournaments = async () => {
  const response = await api.delete('/tournaments');
  return response.data;
};

export const reportMatch = async (matchData) => {
  const response = await api.post('/matches/report', matchData);
  return response.data;
};

export const updateMatch = async (matchId, matchData) => {
  const response = await api.put(`/matches/${matchId}`, matchData);
  return response.data;
};

export const getMatchResultsForGroup = async (groupId) => {
  const response = await api.get(`/matches/group/${groupId}`);
  return response.data;
};

export const createNextRound = async (tournamentId, numberOfPlayers = null) => {
  const url = numberOfPlayers 
    ? `/tournaments/${tournamentId}/next-round?numberOfPlayers=${numberOfPlayers}`
    : `/tournaments/${tournamentId}/next-round`;
  const response = await api.post(url);
  return response.data;
};

export const updateGroupParticipants = async (groupId, participants) => {
  const response = await api.put(`/tournaments/groups/${groupId}/participants`, participants);
  return response.data;
};

export default api;
