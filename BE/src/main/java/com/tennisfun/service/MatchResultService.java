package com.tennisfun.service;

import com.tennisfun.dto.ReportMatchRequest;
import com.tennisfun.entity.MatchResult;
import com.tennisfun.entity.MatchStatus;
import com.tennisfun.entity.TournamentGroup;
import com.tennisfun.repository.MatchResultRepository;
import com.tennisfun.repository.TournamentGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchResultService {
    
    private final MatchResultRepository matchResultRepository;
    private final TournamentGroupRepository groupRepository;
    
    @Transactional
    public MatchResult reportMatch(ReportMatchRequest request) {
        log.info("Reporting match: {} vs {} with status {}",
                request.getPlayer1(), request.getPlayer2(), request.getStatus());

        TournamentGroup group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new IllegalArgumentException("Grupp med ID " + request.getGroupId() + " hittades inte"));

        // Kontrollera om matchen redan har rapporterats
        Optional<MatchResult> existingMatch = matchResultRepository.findExistingMatch(
                request.getGroupId(), request.getPlayer1(), request.getPlayer2());
        
        if (existingMatch.isPresent()) {
            log.warn("Match between {} and {} in group {} already exists with ID: {}",
                    request.getPlayer1(), request.getPlayer2(), request.getGroupId(), existingMatch.get().getId());
            throw new IllegalArgumentException("Denna match har redan rapporterats. Använd uppdateringsfunktionen för att ändra resultatet.");
        }

        MatchStatus status = MatchStatus.valueOf(request.getStatus().toUpperCase());

        MatchResult result = new MatchResult();
        result.setGroup(group);
        result.setPlayer1(request.getPlayer1());
        result.setPlayer2(request.getPlayer2());
        result.setStatus(status);

        int gamesPerSet = group.getTournament() != null && group.getTournament().getGamesPerSet() != null
                ? group.getTournament().getGamesPerSet() : 4;

        switch (status) {
            case PLAYED:
                validatePlayed(request, gamesPerSet);
                result.setScore1(request.getScore1());
                result.setScore2(request.getScore2());
                // Vinnaren bestäms av poängen
                result.setWinner(request.getScore1() > request.getScore2() ? request.getPlayer1() : request.getPlayer2());
                break;
            case WALKOVER:
                validateWinner(request);
                result.setWinner(request.getWinner());
                result.setScore1(null);
                result.setScore2(null);
                break;
            case RETIRED:
                validateRetired(request, gamesPerSet);
                result.setWinner(request.getWinner());
                result.setScore1(request.getScore1());
                result.setScore2(request.getScore2());
                break;
        }
        
        MatchResult savedResult = matchResultRepository.save(result);
        log.info("Match result saved with ID: {}", savedResult.getId());
        
        return savedResult;
    }

    private void validatePlayed(ReportMatchRequest request, int gamesPerSet) {
        if (request.getScore1() == null || request.getScore2() == null) {
            throw new IllegalArgumentException("Båda spelarna måste ha ett resultat för en spelad match.");
        }
        if (request.getScore1() < 0 || request.getScore2() < 0 ||
            request.getScore1() > gamesPerSet || request.getScore2() > gamesPerSet) {
            throw new IllegalArgumentException("Resultatet måste vara mellan 0 och " + gamesPerSet + " games.");
        }
        if (request.getScore1() != gamesPerSet && request.getScore2() != gamesPerSet) {
            throw new IllegalArgumentException("En spelare måste ha vunnit med " + gamesPerSet + " games.");
        }
        if (request.getScore1().equals(gamesPerSet) && request.getScore2().equals(gamesPerSet)) {
            throw new IllegalArgumentException("Båda kan inte ha " + gamesPerSet + " games.");
        }
    }

    private void validateWinner(ReportMatchRequest request) {
        if (request.getWinner() == null || request.getWinner().trim().isEmpty()) {
            throw new IllegalArgumentException("En vinnare måste utses.");
        }
        if (!request.getWinner().equals(request.getPlayer1()) && !request.getWinner().equals(request.getPlayer2())) {
            throw new IllegalArgumentException("Vinnaren måste vara en av de två spelarna.");
        }
    }

    private void validateRetired(ReportMatchRequest request, int gamesPerSet) {
        validateWinner(request);
        if (request.getScore1() == null || request.getScore2() == null) {
            throw new IllegalArgumentException("Resultat måste anges vid uppgiven match.");
        }
        if (request.getScore1() < 0 || request.getScore2() < 0 ||
            request.getScore1() >= gamesPerSet || request.getScore2() >= gamesPerSet) {
            throw new IllegalArgumentException("Resultatet vid uppgiven match får inte vara " + gamesPerSet + ".");
        }
    }
    
    @Transactional
    public MatchResult updateMatchResult(Long id, ReportMatchRequest request) {
        log.info("Updating match result with ID: {}. New status: {}", id, request.getStatus());
        
        MatchResult existingResult = matchResultRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Matchresultat med ID " + id + " hittades inte"));

        TournamentGroup existingGroup = groupRepository.findById(existingResult.getGroup().getId())
                .orElseThrow(() -> new IllegalArgumentException("Grupp hittades inte"));
        int gamesPerSet = existingGroup.getTournament() != null && existingGroup.getTournament().getGamesPerSet() != null
                ? existingGroup.getTournament().getGamesPerSet() : 4;

        MatchStatus status = MatchStatus.valueOf(request.getStatus().toUpperCase());
        existingResult.setStatus(status);

        switch (status) {
            case PLAYED:
                validatePlayed(request, gamesPerSet);
                existingResult.setScore1(request.getScore1());
                existingResult.setScore2(request.getScore2());
                existingResult.setWinner(request.getScore1() > request.getScore2() ? existingResult.getPlayer1() : existingResult.getPlayer2());
                break;
            case WALKOVER:
                validateWinner(request);
                existingResult.setWinner(request.getWinner());
                existingResult.setScore1(null);
                existingResult.setScore2(null);
                break;
            case RETIRED:
                validateRetired(request, gamesPerSet);
                existingResult.setWinner(request.getWinner());
                existingResult.setScore1(request.getScore1());
                existingResult.setScore2(request.getScore2());
                break;
        }
        
        MatchResult updatedResult = matchResultRepository.save(existingResult);
        log.info("Match result updated successfully");
        
        return updatedResult;
    }
    
    @Transactional(readOnly = true)
    public List<MatchResult> getMatchResultsForGroup(Long groupId) {
        return matchResultRepository.findByGroupId(groupId);
    }
}
