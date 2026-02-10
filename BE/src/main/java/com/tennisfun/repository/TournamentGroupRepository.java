package com.tennisfun.repository;

import com.tennisfun.entity.TournamentGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TournamentGroupRepository extends JpaRepository<TournamentGroup, Long> {
}
