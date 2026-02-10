package com.tennisfun.repository;

import com.tennisfun.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findAllByOrderByDateDesc();
    List<Tournament> findByArchivedOrderByDateDesc(Boolean archived);
    Tournament findFirstByArchivedOrderByDateDesc(Boolean archived);
}
