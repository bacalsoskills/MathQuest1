package com.mathquest.demo;

import com.mathquest.demo.DTO.GameDTO;
import com.mathquest.demo.DTO.GameScoreDTO;
import com.mathquest.demo.DTO.Request.CreateGameRequest;
import com.mathquest.demo.DTO.Request.SubmitGameScoreRequest;
import com.mathquest.demo.Model.Game;
import com.mathquest.demo.Model.GameType;
import com.mathquest.demo.Model.User;

import java.util.List;
import java.util.Map;

public interface GameService {
    GameDTO createGame(CreateGameRequest request, User teacher);

    GameDTO getGameById(Long id);

    GameDTO getGameByActivityId(Long activityId);

    List<GameDTO> getGamesByClassroomId(Long classroomId);

    List<GameDTO> getGamesByClassroomIdAndType(Long classroomId, GameType type);

    GameDTO updateGame(Long id, CreateGameRequest request, User teacher);

    void deleteGame(Long id, User teacher);

    String generateGameContent(String topic, GameType gameType);

    GameScoreDTO submitGameScore(SubmitGameScoreRequest request, User student);

    List<GameScoreDTO> getGameLeaderboard(Long gameId);

    List<GameScoreDTO> getStudentGameScores(Long studentId);

    Map<String, Object> getClassroomLeaderboard(Long classroomId);

    Map<String, Object> getGameAnalytics(Long gameId);

    Integer getStudentGameLevel(Long gameId, Long studentId);

    void updateStudentGameProgress(Game game, User student, Integer level);
}