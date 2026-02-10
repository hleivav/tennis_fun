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
}
