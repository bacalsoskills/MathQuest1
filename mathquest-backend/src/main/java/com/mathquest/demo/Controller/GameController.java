package com.mathquest.demo.Controller;

import com.mathquest.demo.DTO.GameDTO;
import com.mathquest.demo.DTO.GameScoreDTO;
import com.mathquest.demo.DTO.Request.CreateGameRequest;
import com.mathquest.demo.DTO.Request.SubmitGameScoreRequest;
import com.mathquest.demo.Model.GameType;
import com.mathquest.demo.Model.User;
import com.mathquest.demo.Repository.UserRepository;
import com.mathquest.demo.Security.services.UserDetailsImpl;
import com.mathquest.demo.Service.GameService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = { "Authorization", "Content-Type",
        "Accept" }, methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS })
@RestController
@RequestMapping("/games")
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private UserRepository userRepository;

    // Endpoint for teachers to create a game
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GameDTO> createGame(@Valid @RequestBody CreateGameRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        GameDTO createdGame = gameService.createGame(request, currentUser);
        return new ResponseEntity<>(createdGame, HttpStatus.CREATED);
    }

    // Endpoint to get a specific game by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<GameDTO> getGameById(@PathVariable Long id) {
        GameDTO game = gameService.getGameById(id);
        return ResponseEntity.ok(game);
    }

    // Endpoint to get a game by activity ID
    @GetMapping("/activity/{activityId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<GameDTO> getGameByActivityId(@PathVariable Long activityId) {
        GameDTO game = gameService.getGameByActivityId(activityId);
        return ResponseEntity.ok(game);
    }

    // Endpoint to get games by classroom ID
    @GetMapping("/classroom/{classroomId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<GameDTO>> getGamesByClassroomId(@PathVariable Long classroomId) {
        List<GameDTO> games = gameService.getGamesByClassroomId(classroomId);
        return ResponseEntity.ok(games);
    }

    // Endpoint to get games by classroom ID and type
    @GetMapping("/classroom/{classroomId}/type/{type}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<GameDTO>> getGamesByClassroomIdAndType(
            @PathVariable Long classroomId,
            @PathVariable GameType type) {
        List<GameDTO> games = gameService.getGamesByClassroomIdAndType(classroomId, type);
        return ResponseEntity.ok(games);
    }

    // Endpoint for teachers to update a game
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<GameDTO> updateGame(
            @PathVariable Long id,
            @Valid @RequestBody CreateGameRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        GameDTO updatedGame = gameService.updateGame(id, request, currentUser);
        return ResponseEntity.ok(updatedGame);
    }

    // Endpoint for teachers to delete a game
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        gameService.deleteGame(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // Endpoint for students to submit a game score
    @PostMapping("/submit-score")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GameScoreDTO> submitGameScore(@Valid @RequestBody SubmitGameScoreRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        GameScoreDTO gameScore = gameService.submitGameScore(request, currentUser);
        return ResponseEntity.ok(gameScore);
    }

    // Endpoint to get leaderboard for a specific game
    @GetMapping("/{gameId}/leaderboard")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<GameScoreDTO>> getGameLeaderboard(@PathVariable Long gameId) {
        List<GameScoreDTO> leaderboard = gameService.getGameLeaderboard(gameId);
        return ResponseEntity.ok(leaderboard);
    }

    // Endpoint to get a student's game scores
    @GetMapping("/scores/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<List<GameScoreDTO>> getStudentGameScores(@PathVariable Long studentId) {
        List<GameScoreDTO> scores = gameService.getStudentGameScores(studentId);
        return ResponseEntity.ok(scores);
    }

    @GetMapping("/{gameId}/student/{studentId}/level")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<Integer> getStudentGameLevel(
            @PathVariable Long gameId,
            @PathVariable Long studentId) {
        Integer level = gameService.getStudentGameLevel(gameId, studentId);
        return ResponseEntity.ok(level);
    }

    @GetMapping("/{gameId}/student/{studentId}/level/{level}/unlocked")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<Boolean> isLevelUnlocked(
            @PathVariable Long gameId,
            @PathVariable Long studentId,
            @PathVariable Integer level) {
        boolean isUnlocked = gameService.isLevelUnlocked(gameId, studentId, level);
        return ResponseEntity.ok(isUnlocked);
    }

    // Endpoint to get leaderboard for a classroom
    @GetMapping("/classroom/{classroomId}/leaderboard")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getClassroomLeaderboard(@PathVariable Long classroomId) {
        Map<String, Object> leaderboard = gameService.getClassroomLeaderboard(classroomId);
        return ResponseEntity.ok(leaderboard);
    }

    // Endpoint to get analytics for a specific game
    @GetMapping("/{gameId}/analytics")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getGameAnalytics(@PathVariable Long gameId) {
        Map<String, Object> analytics = gameService.getGameAnalytics(gameId);
        return ResponseEntity.ok(analytics);
    }
}