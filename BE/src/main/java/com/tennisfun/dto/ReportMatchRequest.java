package com.tennisfun.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportMatchRequest {
    private Long groupId;
    private String player1;
    private String player2;
    private Integer score1;
    private Integer score2;
    private String status; // "PLAYED", "WALKOVER", "RETIRED"
    private String winner;
    private Integer set2Score1;
    private Integer set2Score2;
    private Integer set3Score1;
    private Integer set3Score2;
    private Integer tiebreak1Score1;
    private Integer tiebreak1Score2;
    private Integer tiebreak2Score1;
    private Integer tiebreak2Score2;
    private Integer tiebreak3Score1;
    private Integer tiebreak3Score2;
}
