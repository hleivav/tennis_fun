package com.tennisfun.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTournamentRequest {
    private String name;
    private String date; // Format: YYYY-MM-DD
    private Integer numberOfWinners;
    private List<TournamentGroupDTO> groups;
}
