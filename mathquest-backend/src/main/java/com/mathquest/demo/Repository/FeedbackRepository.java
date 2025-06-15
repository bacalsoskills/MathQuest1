package com.mathquest.demo.Repository;

import com.mathquest.demo.Model.Feedback;
import com.mathquest.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUser(User user);

    List<Feedback> findAllByOrderByDateSubmissionDesc();

    Feedback findByTicketNumber(String ticketNumber);
}