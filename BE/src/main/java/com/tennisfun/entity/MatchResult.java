package com.tennisfun.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "match_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnore
    private TournamentGroup group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.PLAYED;

    @Column
    private String winner;
    
    @Column(nullable = false)
    private String player1;
    
    @Column(nullable = false)
    private String player2;
    
    @Column
    private Integer score1;
    
    @Column
    private Integer score2;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime reportedAt;
    
    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
    }
}
