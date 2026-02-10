package com.tennisfun.controller;

import com.tennisfun.dto.CreateTournamentRequest;
import com.tennisfun.dto.TournamentSummaryDTO;
import com.tennisfun.entity.Tournament;
import com.tennisfun.service.TournamentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@Slf4j
public class TournamentController {
    
    private final TournamentService tournamentService;
    
    @PostMapping
    public ResponseEntity<?> createTournament(@RequestBody CreateTournamentRequest request) {
        try {
            log.info("Received create tournament request: {}", request.getName());
            TournamentSummaryDTO tournament = tournamentService.createTournament(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(tournament);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating tournament", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid skapande av turnering"));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<TournamentSummaryDTO>> getAllTournaments() {
        log.info("Fetching all tournaments");
        List<TournamentSummaryDTO> tournaments = tournamentService.getAllTournaments();
        return ResponseEntity.ok(tournaments);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<TournamentSummaryDTO>> getActiveTournaments() {
        log.info("Fetching active tournaments");
        List<TournamentSummaryDTO> tournaments = tournamentService.getActiveTournaments();
        return ResponseEntity.ok(tournaments);
    }
    
    @GetMapping("/archived")
    public ResponseEntity<List<TournamentSummaryDTO>> getArchivedTournaments() {
        log.info("Fetching archived tournaments");
        List<TournamentSummaryDTO> tournaments = tournamentService.getArchivedTournaments();
        return ResponseEntity.ok(tournaments);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getTournamentById(@PathVariable Long id) {
        try {
            log.info("Fetching tournament with ID: {}", id);
            Tournament tournament = tournamentService.getTournamentById(id);
            return ResponseEntity.ok(tournament);
        } catch (IllegalArgumentException e) {
            log.error("Tournament not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archiveTournament(@PathVariable Long id) {
        try {
            log.info("Archiving tournament with ID: {}", id);
            tournamentService.archiveTournament(id);
            return ResponseEntity.ok(new SuccessResponse("Turneringen har arkiverats"));
        } catch (IllegalArgumentException e) {
            log.error("Tournament not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error archiving tournament", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid arkivering av turnering"));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTournament(@PathVariable Long id) {
        try {
            log.info("Deleting tournament with ID: {}", id);
            tournamentService.deleteTournament(id);
            return ResponseEntity.ok(new SuccessResponse("Turneringen har raderats"));
        } catch (IllegalArgumentException e) {
            log.error("Tournament not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting tournament", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid radering av turnering"));
        }
    }
    
    @DeleteMapping
    public ResponseEntity<?> deleteAllTournaments() {
        try {
            log.info("Deleting all active tournaments");
            tournamentService.deleteAllTournaments();
            return ResponseEntity.ok(new SuccessResponse("Alla aktiva turneringar har raderats"));
        } catch (Exception e) {
            log.error("Error deleting tournaments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid radering av turneringar"));
        }
    }
    
    @PostMapping("/{id}/next-round")
    public ResponseEntity<?> createNextRound(
            @PathVariable Long id,
            @RequestParam(required = false) Integer numberOfPlayers) {
        try {
            log.info("Creating next round for tournament ID: {} with {} players", id, numberOfPlayers);
            Tournament tournament = tournamentService.createNextRound(id, numberOfPlayers);
            return ResponseEntity.ok(tournament);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating next round", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid skapande av nästa omgång"));
        }
    }
    
    @PutMapping("/groups/{groupId}/participants")
    public ResponseEntity<?> updateGroupParticipants(
            @PathVariable Long groupId,
            @RequestBody List<String> participants) {
        try {
            log.info("Updating participants for group ID: {}", groupId);
            tournamentService.updateGroupParticipants(groupId, participants);
            return ResponseEntity.ok(new SuccessResponse("Deltagare uppdaterade"));
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating group participants", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid uppdatering av deltagare"));
        }
    }
    
    // Inner classes för meddelanden
    record ErrorResponse(String message) {}
    record SuccessResponse(String message) {}
}
