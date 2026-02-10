package com.tennisfun.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentGroupDTO {
    private Integer groupNumber;
    private List<String> participants;
    private String court1;
    private String court2;
}
