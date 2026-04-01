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
        String setsPerMatch = group.getTournament() != null && group.getTournament().getSetsPerMatch() != null
                ? group.getTournament().getSetsPerMatch() : "ett-set";
        boolean isMultiSet = !"ett-set".equals(setsPerMatch);

        switch (status) {
            case PLAYED:
                if (isMultiSet) {
                    validateMultiSetPlayed(request);
                    result.setScore1(request.getScore1());
                    result.setScore2(request.getScore2());
                    result.setSet2Score1(request.getSet2Score1());
                    result.setSet2Score2(request.getSet2Score2());
                    result.setSet3Score1(request.getSet3Score1());
                    result.setSet3Score2(request.getSet3Score2());
                    result.setTiebreak1Score1(request.getTiebreak1Score1());
                    result.setTiebreak1Score2(request.getTiebreak1Score2());
                    result.setTiebreak2Score1(request.getTiebreak2Score1());
                    result.setTiebreak2Score2(request.getTiebreak2Score2());
                    result.setTiebreak3Score1(request.getTiebreak3Score1());
                    result.setTiebreak3Score2(request.getTiebreak3Score2());
                    result.setWinner(request.getWinner());
                } else {
                    validatePlayed(request, gamesPerSet);
                    result.setScore1(request.getScore1());
                    result.setScore2(request.getScore2());
                    result.setWinner(request.getScore1() > request.getScore2() ? request.getPlayer1() : request.getPlayer2());
                }
                break;
            case WALKOVER:
                validateWinner(request);
                result.setWinner(request.getWinner());
                result.setScore1(null);
                result.setScore2(null);
                break;
            case RETIRED:
                if (isMultiSet) {
                    validateWinner(request);
                    result.setWinner(request.getWinner());
                    result.setScore1(request.getScore1());
                    result.setScore2(request.getScore2());
                    result.setSet2Score1(request.getSet2Score1());
                    result.setSet2Score2(request.getSet2Score2());
                    result.setSet3Score1(request.getSet3Score1());
                    result.setSet3Score2(request.getSet3Score2());
                    result.setTiebreak1Score1(request.getTiebreak1Score1());
                    result.setTiebreak1Score2(request.getTiebreak1Score2());
                    result.setTiebreak2Score1(request.getTiebreak2Score1());
                    result.setTiebreak2Score2(request.getTiebreak2Score2());
                    result.setTiebreak3Score1(request.getTiebreak3Score1());
                    result.setTiebreak3Score2(request.getTiebreak3Score2());
                } else {
                    validateRetired(request, gamesPerSet);
                    result.setWinner(request.getWinner());
                    result.setScore1(request.getScore1());
                    result.setScore2(request.getScore2());
                }
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
        int s1 = request.getScore1();
        int s2 = request.getScore2();

        if (gamesPerSet == 6) {
            // Giltiga ställningar: vinnaren har 6 med minst 2 i försprung, eller 7-5, eller 7-6 (tie-break)
            boolean valid = (s1 == 6 && s2 <= 4) ||
                            (s2 == 6 && s1 <= 4) ||
                            (s1 == 7 && (s2 == 5 || s2 == 6)) ||
                            (s2 == 7 && (s1 == 5 || s1 == 6));
            if (!valid) {
                throw new IllegalArgumentException(
                    "Ogiltigt resultat. Giltiga ställningar är t.ex. 6-0 till 6-4, 7-5 eller 7-6 (tie-break).");
            }
        } else {
            // 4-games-set: vinnaren måste ha exakt 4 (4-0, 4-1, 4-2, 4-3)
            if (s1 < 0 || s2 < 0 || s1 > gamesPerSet || s2 > gamesPerSet) {
                throw new IllegalArgumentException("Resultatet måste vara mellan 0 och " + gamesPerSet + " games.");
            }
            if (s1 != gamesPerSet && s2 != gamesPerSet) {
                throw new IllegalArgumentException("En spelare måste ha vunnit med " + gamesPerSet + " games.");
            }
            if (s1 == gamesPerSet && s2 == gamesPerSet) {
                throw new IllegalArgumentException("Båda kan inte ha " + gamesPerSet + " games.");
            }
        }
    }

    private void validateMultiSetPlayed(ReportMatchRequest request) {
        if (request.getScore1() == null || request.getScore2() == null) {
            throw new IllegalArgumentException("Set 1 resultat måste anges.");
        }
        if (request.getSet2Score1() == null || request.getSet2Score2() == null) {
            throw new IllegalArgumentException("Set 2 resultat måste anges.");
        }
        validateWinner(request);
    }

    private void copyMultiSetScores(MatchResult result, ReportMatchRequest request) {
        result.setScore1(request.getScore1());
        result.setScore2(request.getScore2());
        result.setSet2Score1(request.getSet2Score1());
        result.setSet2Score2(request.getSet2Score2());
        result.setSet3Score1(request.getSet3Score1());
        result.setSet3Score2(request.getSet3Score2());
        result.setTiebreak1Score1(request.getTiebreak1Score1());
        result.setTiebreak1Score2(request.getTiebreak1Score2());
        result.setTiebreak2Score1(request.getTiebreak2Score1());
        result.setTiebreak2Score2(request.getTiebreak2Score2());
        result.setTiebreak3Score1(request.getTiebreak3Score1());
        result.setTiebreak3Score2(request.getTiebreak3Score2());
    }

    private void clearMultiSetScores(MatchResult result) {
        result.setSet2Score1(null);
        result.setSet2Score2(null);
        result.setSet3Score1(null);
        result.setSet3Score2(null);
        result.setTiebreak1Score1(null);
        result.setTiebreak1Score2(null);
        result.setTiebreak2Score1(null);
        result.setTiebreak2Score2(null);
        result.setTiebreak3Score1(null);
        result.setTiebreak3Score2(null);
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
        int s1 = request.getScore1();
        int s2 = request.getScore2();
        int maxScore = gamesPerSet == 6 ? 7 : gamesPerSet;
        if (s1 < 0 || s2 < 0 || s1 >= maxScore || s2 >= maxScore) {
            throw new IllegalArgumentException("Resultatet vid uppgiven match är ogiltigt.");
        }
        // Ingen spelare får ha ett komplett vinnande resultat
        boolean p1Won = (gamesPerSet == 6)
                ? ((s1 == 6 && s2 <= 4) || (s1 == 7 && (s2 == 5 || s2 == 6)))
                : (s1 == gamesPerSet);
        boolean p2Won = (gamesPerSet == 6)
                ? ((s2 == 6 && s1 <= 4) || (s2 == 7 && (s1 == 5 || s1 == 6)))
                : (s2 == gamesPerSet);
        if (p1Won || p2Won) {
            throw new IllegalArgumentException("Uppgiven match kan inte ha ett komplett vinnande resultat.");
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
        String setsPerMatch = existingGroup.getTournament() != null && existingGroup.getTournament().getSetsPerMatch() != null
                ? existingGroup.getTournament().getSetsPerMatch() : "ett-set";
        boolean isMultiSet = !"ett-set".equals(setsPerMatch);

        MatchStatus status = MatchStatus.valueOf(request.getStatus().toUpperCase());
        existingResult.setStatus(status);

        switch (status) {
            case PLAYED:
                if (isMultiSet) {
                    validateMultiSetPlayed(request);
                    copyMultiSetScores(existingResult, request);
                    existingResult.setWinner(request.getWinner());
                } else {
                    validatePlayed(request, gamesPerSet);
                    existingResult.setScore1(request.getScore1());
                    existingResult.setScore2(request.getScore2());
                    existingResult.setWinner(request.getScore1() > request.getScore2() ? existingResult.getPlayer1() : existingResult.getPlayer2());
                    clearMultiSetScores(existingResult);
                }
                break;
            case WALKOVER:
                validateWinner(request);
                existingResult.setWinner(request.getWinner());
                existingResult.setScore1(null);
                existingResult.setScore2(null);
                clearMultiSetScores(existingResult);
                break;
            case RETIRED:
                if (isMultiSet) {
                    validateWinner(request);
                    copyMultiSetScores(existingResult, request);
                    existingResult.setWinner(request.getWinner());
                } else {
                    validateRetired(request, gamesPerSet);
                    existingResult.setWinner(request.getWinner());
                    existingResult.setScore1(request.getScore1());
                    existingResult.setScore2(request.getScore2());
                    clearMultiSetScores(existingResult);
                }
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
