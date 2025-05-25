package com.mathquest.demo.Controller;

import com.mathquest.demo.Service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/quiz-attempts")
public class QuizAttemptController {

    @Autowired
    private QuizService quizService;

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<Map<String, Object>> getQuizAttemptsByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(quizService.getQuizAttemptsByClassroom(classroomId));
    }
}