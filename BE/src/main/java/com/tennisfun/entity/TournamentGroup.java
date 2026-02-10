package com.tennisfun.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournament_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    @JsonIgnore  // Förhindrar cirkulär referens vid serialisering
    private Tournament tournament;
    
    @Column(nullable = false)
    private Integer groupNumber;
    
    @ElementCollection
    @CollectionTable(name = "group_participants", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "participant_name")
    private List<String> participants = new ArrayList<>();
    
    @Column
    private String court1;
    
    @Column
    private String court2;
    
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatchResult> matchResults = new ArrayList<>();
}
