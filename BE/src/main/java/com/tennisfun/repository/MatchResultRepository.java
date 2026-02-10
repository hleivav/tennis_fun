package com.tennisfun.repository;

import com.tennisfun.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    List<MatchResult> findByGroupId(Long groupId);
    
    @Query("SELECT m FROM MatchResult m WHERE m.group.id = :groupId AND " +
           "((m.player1 = :player1 AND m.player2 = :player2) OR " +
           "(m.player1 = :player2 AND m.player2 = :player1))")
    Optional<MatchResult> findExistingMatch(@Param("groupId") Long groupId, 
                                            @Param("player1") String player1, 
                                            @Param("player2") String player2);
}
