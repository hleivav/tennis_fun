package com.tennisfun.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentSummaryDTO {
    private Long id;
    private String name;
    private LocalDate date;
    private LocalDateTime createdAt;
    private Integer groupCount;
    private Integer participantCount;
}
