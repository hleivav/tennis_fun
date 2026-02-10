package com.tennisfun.service;

import com.tennisfun.dto.CreateTournamentRequest;
import com.tennisfun.dto.TournamentGroupDTO;
import com.tennisfun.dto.TournamentSummaryDTO;
import com.tennisfun.entity.MatchResult;
import com.tennisfun.entity.Tournament;
import com.tennisfun.entity.TournamentGroup;
import com.tennisfun.repository.MatchResultRepository;
import com.tennisfun.repository.TournamentRepository;
import com.tennisfun.repository.TournamentGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TournamentService {
    
    private final TournamentRepository tournamentRepository;
    private final TournamentGroupRepository groupRepository;
    private final MatchResultRepository matchResultRepository;
    
    @Transactional
    public TournamentSummaryDTO createTournament(CreateTournamentRequest request) {
        log.info("Creating tournament: {}", request.getName());
        
        // Validera att namn och datum finns
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Turneringsnamn måste anges");
        }
        
        if (request.getDate() == null || request.getDate().trim().isEmpty()) {
            throw new IllegalArgumentException("Datum måste anges");
        }
        
        // Filtrera bort tomma grupper (grupper utan deltagare)
        List<TournamentGroupDTO> nonEmptyGroups = request.getGroups().stream()
                .filter(group -> group.getParticipants() != null && !group.getParticipants().isEmpty())
                .collect(Collectors.toList());
        
        if (nonEmptyGroups.isEmpty()) {
            throw new IllegalArgumentException("Minst en grupp måste ha deltagare");
        }
        
        log.info("Filtered groups: {} non-empty groups out of {}", nonEmptyGroups.size(), request.getGroups().size());
        
        // Skapa Tournament entity
        Tournament tournament = new Tournament();
        tournament.setName(request.getName().trim());
        tournament.setDate(LocalDate.parse(request.getDate(), DateTimeFormatter.ISO_LOCAL_DATE));
        tournament.setNumberOfWinners(request.getNumberOfWinners() != null ? request.getNumberOfWinners() : 1);
        
        // Skapa TournamentGroup entities för icke-tomma grupper
        for (TournamentGroupDTO groupDTO : nonEmptyGroups) {
            TournamentGroup group = new TournamentGroup();
            group.setGroupNumber(groupDTO.getGroupNumber());
            group.setParticipants(groupDTO.getParticipants());
            
            // Sätt court1 och court2 till null om de är tomma strängar
            group.setCourt1(isNullOrEmpty(groupDTO.getCourt1()) ? null : groupDTO.getCourt1());
            group.setCourt2(isNullOrEmpty(groupDTO.getCourt2()) ? null : groupDTO.getCourt2());
            
            tournament.addGroup(group);
        }
        
        // Spara tournament (cascade sparar även groups)
        Tournament savedTournament = tournamentRepository.save(tournament);
        
        log.info("Tournament created with ID: {}", savedTournament.getId());
        
        // Returnera sammanfattning
        int participantCount = savedTournament.getGroups().stream()
                .mapToInt(group -> group.getParticipants().size())
                .sum();
        
        return new TournamentSummaryDTO(
                savedTournament.getId(),
                savedTournament.getName(),
                savedTournament.getDate(),
                savedTournament.getCreatedAt(),
                savedTournament.getGroups().size(),
                participantCount
        );
    }
    
    @Transactional(readOnly = true)
    public List<TournamentSummaryDTO> getAllTournaments() {
        return tournamentRepository.findAllByOrderByDateDesc().stream()
                .map(tournament -> {
                    int participantCount = tournament.getGroups().stream()
                            .mapToInt(group -> group.getParticipants().size())
                            .sum();
                    return new TournamentSummaryDTO(
                            tournament.getId(),
                            tournament.getName(),
                            tournament.getDate(),
                            tournament.getCreatedAt(),
                            tournament.getGroups().size(),
                            participantCount
                    );
                })
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TournamentSummaryDTO> getActiveTournaments() {
        return tournamentRepository.findByArchivedOrderByDateDesc(false).stream()
                .map(tournament -> {
                    int participantCount = tournament.getGroups().stream()
                            .mapToInt(group -> group.getParticipants().size())
                            .sum();
                    return new TournamentSummaryDTO(
                            tournament.getId(),
                            tournament.getName(),
                            tournament.getDate(),
                            tournament.getCreatedAt(),
                            tournament.getGroups().size(),
                            participantCount
                    );
                })
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TournamentSummaryDTO> getArchivedTournaments() {
        return tournamentRepository.findByArchivedOrderByDateDesc(true).stream()
                .map(tournament -> {
                    int participantCount = tournament.getGroups().stream()
                            .mapToInt(group -> group.getParticipants().size())
                            .sum();
                    return new TournamentSummaryDTO(
                            tournament.getId(),
                            tournament.getName(),
                            tournament.getDate(),
                            tournament.getCreatedAt(),
                            tournament.getGroups().size(),
                            participantCount
                    );
                })
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Tournament getTournamentById(Long id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Turnering med ID " + id + " hittades inte"));
    }
    
    @Transactional
    public void archiveTournament(Long id) {
        log.info("Archiving tournament with ID: {}", id);
        Tournament tournament = getTournamentById(id);
        tournament.setArchived(true);
        tournamentRepository.save(tournament);
        log.info("Tournament archived successfully");
    }
    
    @Transactional
    public void deleteTournament(Long id) {
        log.info("Deleting tournament with ID: {}", id);
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Turnering med ID " + id + " hittades inte"));
        tournamentRepository.delete(tournament);
        log.info("Tournament deleted successfully");
    }
    
    @Transactional
    public void deleteAllTournaments() {
        log.info("Deleting all non-archived tournaments from database");
        List<Tournament> activeTournaments = tournamentRepository.findByArchivedOrderByDateDesc(false);
        tournamentRepository.deleteAll(activeTournaments);
        log.info("All active tournaments deleted successfully");
    }
    
    @Transactional
    public Tournament createNextRound(Long tournamentId, Integer numberOfPlayers) {
        log.info("Creating next round for tournament ID: {} with {} players", tournamentId, numberOfPlayers);
        
        Tournament tournament = getTournamentById(tournamentId);
        
        // Om numberOfPlayers inte anges, beräkna från föregående omgång (halvera)
        if (numberOfPlayers == null) {
            // Räkna hur många knockout-matcher som finns (grupper med exakt 2 deltagare)
            long knockoutMatches = tournament.getGroups().stream()
                .filter(g -> g.getParticipants().size() == 2)
                .count();
            
            if (knockoutMatches > 0) {
                numberOfPlayers = (int) knockoutMatches; // Halvera antal matcher = antal spelare
            } else {
                throw new IllegalArgumentException("Antal spelare måste anges för första playoff-omgången");
            }
        }
        
        if (numberOfPlayers < 2) {
            throw new IllegalArgumentException("Antal spelare måste vara minst 2");
        }
        
        if (numberOfPlayers % 2 != 0) {
            throw new IllegalArgumentException("Antal spelare måste vara jämnt delbart med 2");
        }
        
        // Skapa tomma grupper för knockout-matcher
        int numMatches = numberOfPlayers / 2;
        int nextGroupNumber = tournament.getGroups().size() + 1;
        
        for (int i = 0; i < numMatches; i++) {
            TournamentGroup knockoutMatch = new TournamentGroup();
            knockoutMatch.setGroupNumber(nextGroupNumber + i);
            knockoutMatch.setParticipants(new ArrayList<>()); // Tom lista
            
            tournament.addGroup(knockoutMatch);
        }
        
        Tournament updatedTournament = tournamentRepository.save(tournament);
        
        log.info("Created {} empty knockout matches for {} players", numMatches, numberOfPlayers);
        
        return updatedTournament;
    }
    
    @Transactional
    public TournamentGroup updateGroupParticipants(Long groupId, List<String> participants) {
        log.info("Updating participants for group ID: {}", groupId);
        
        TournamentGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupp med ID " + groupId + " hittades inte"));
        
        if (participants == null || participants.isEmpty()) {
            throw new IllegalArgumentException("Deltagarlista får inte vara tom");
        }
        
        if (participants.size() != 2) {
            throw new IllegalArgumentException("En knockout-match måste ha exakt 2 deltagare");
        }
        
        group.setParticipants(new ArrayList<>(participants));
        TournamentGroup updatedGroup = groupRepository.save(group);
        
        log.info("Updated group {} with participants: {}", groupId, participants);
        
        return updatedGroup;
    }
    
    // Hjälpklass för att hålla statistik för varje spelare
    private static class PlayerStats {
        String playerName;
        int points = 0;
        int gamesWon = 0;
        int gamesLost = 0;
        
        PlayerStats(String playerName) {
            this.playerName = playerName;
        }
        
        int getSetDifference() {
            return gamesWon - gamesLost;
        }
    }
    
    private boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
}
