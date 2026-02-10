package com.tennisfun.controller;

import com.tennisfun.dto.ReportMatchRequest;
import com.tennisfun.entity.MatchResult;
import com.tennisfun.service.MatchResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@Slf4j
public class MatchResultController {
    
    private final MatchResultService matchResultService;
    
    @PostMapping("/report")
    public ResponseEntity<?> reportMatch(@RequestBody ReportMatchRequest request) {
        try {
            log.info("Received match report: {} vs {}", request.getPlayer1(), request.getPlayer2());
            MatchResult result = matchResultService.reportMatch(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error reporting match", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid rapportering av match"));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMatch(@PathVariable Long id, @RequestBody ReportMatchRequest request) {
        try {
            log.info("Updating match result with ID: {}", id);
            MatchResult result = matchResultService.updateMatchResult(id, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating match", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Ett fel uppstod vid uppdatering av match"));
        }
    }
    
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<MatchResult>> getMatchResultsForGroup(@PathVariable Long groupId) {
        log.info("Fetching match results for group: {}", groupId);
        List<MatchResult> results = matchResultService.getMatchResultsForGroup(groupId);
        return ResponseEntity.ok(results);
    }
    
    record ErrorResponse(String message) {}
}
