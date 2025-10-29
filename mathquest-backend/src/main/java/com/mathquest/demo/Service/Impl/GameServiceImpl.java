package com.mathquest.demo.Service.Impl;

import com.mathquest.demo.DTO.ActivityDTO;
import com.mathquest.demo.DTO.GameDTO;
import com.mathquest.demo.DTO.GameScoreDTO;
import com.mathquest.demo.DTO.Request.CreateActivityRequest;
import com.mathquest.demo.DTO.Request.CreateGameRequest;
import com.mathquest.demo.DTO.Request.SubmitGameScoreRequest;
import com.mathquest.demo.Exception.ResourceNotFoundException;
import com.mathquest.demo.Exception.UnauthorizedException;
import com.mathquest.demo.Model.*;
import com.mathquest.demo.Repository.*;
import com.mathquest.demo.Service.ActivityService;
import com.mathquest.demo.Service.GameService;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GameServiceImpl implements GameService {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private GameScoreRepository gameScoreRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private ClassroomStudentRepository classroomStudentRepository;

    @Override
    @Transactional
    public GameDTO createGame(CreateGameRequest request, User teacher) {
        Activity activity;

        // Case 1: Creating a game for an existing activity
        if (request.getActivityId() != null) {
            activity = activityRepository.findById(request.getActivityId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Activity not found with id: " + request.getActivityId()));

            // Verify teacher has permission to this activity's classroom
            if (!activity.getClassroom().getTeacher().getId().equals(teacher.getId())) {
                throw new UnauthorizedException("You are not authorized to add games to this activity");
            }
        }
        // Case 2: Creating a game with a new activity
        else if (request.getClassroomId() != null) {
            // Find the classroom
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Classroom not found with id: " + request.getClassroomId()));

            // Verify teacher has permission to this classroom
            if (!classroom.getTeacher().getId().equals(teacher.getId())) {
                throw new UnauthorizedException("You are not authorized to add activities to this classroom");
            }

            // Create a new activity
            CreateActivityRequest activityRequest = new CreateActivityRequest();
            activityRequest.setTitle(request.getName());
            activityRequest.setDescription(request.getInstructions());
            activityRequest.setType(ActivityType.GAME);
            activityRequest.setClassroomId(request.getClassroomId());
            activityRequest.setOrderIndex(request.getOrderIndex());
            activityRequest.setContent(request.getCustomContent());

            // Create activity and get it from the repository
            ActivityDTO activityDTO = activityService.createActivity(activityRequest, teacher);
            activity = activityRepository.findById(activityDTO.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Activity not found after creation"));
        } else {
            throw new IllegalArgumentException("Either activityId or classroomId must be provided");
        }

        // Generate game content if not provided
        String gameContent = request.getCustomContent();
        if (gameContent == null || gameContent.isEmpty()) {
            gameContent = generateGameContent(request.getTopic(), request.getLevel(), request.getType());
        }

        // Create the game
        Game game = new Game();
        game.setName(request.getName());
        game.setInstructions(request.getInstructions());
        game.setTopic(request.getTopic());
        game.setLevel(request.getLevel());
        game.setType(request.getType());
        game.setGameContent(gameContent);
        game.setActivity(activity);

        game = gameRepository.save(game);
        return convertToDTO(game);
    }

    @Override
    public GameDTO getGameById(Long id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id: " + id));
        return convertToDTO(game);
    }

    @Override
    public GameDTO getGameByActivityId(Long activityId) {
        Game game = gameRepository.findByActivityId(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found for activity id: " + activityId));
        return convertToDTO(game);
    }

    @Override
    public List<GameDTO> getGamesByClassroomId(Long classroomId) {
        List<Game> games = gameRepository.findByActivityClassroomId(classroomId);
        return games.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<GameDTO> getGamesByClassroomIdAndType(Long classroomId, GameType type) {
        List<Game> games = gameRepository.findByActivityClassroomIdAndType(classroomId, type);
        return games.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GameDTO updateGame(Long id, CreateGameRequest request, User teacher) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id: " + id));

        // Check authorization
        if (!game.getActivity().getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new UnauthorizedException("You are not authorized to update this game");
        }

        // If activity is changing, verify the new activity
        if (request.getActivityId() != null && !request.getActivityId().equals(game.getActivity().getId())) {
            Activity newActivity = activityRepository.findById(request.getActivityId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Activity not found with id: " + request.getActivityId()));

            // Check if the teacher owns the new activity's classroom
            if (!newActivity.getClassroom().getTeacher().getId().equals(teacher.getId())) {
                throw new UnauthorizedException("You are not authorized to move game to this activity");
            }

            game.setActivity(newActivity);
        }

        // Update game details
        game.setName(request.getName());
        game.setInstructions(request.getInstructions());
        game.setTopic(request.getTopic());
        game.setLevel(request.getLevel());
        game.setType(request.getType());

        // Update game content if provided
        if (request.getCustomContent() != null && !request.getCustomContent().isEmpty()) {
            game.setGameContent(request.getCustomContent());
        } else if (!game.getTopic().equals(request.getTopic()) ||
                !game.getLevel().equals(request.getLevel()) ||
                !game.getType().equals(request.getType())) {
            // Regenerate content if topic, level or type has changed
            game.setGameContent(generateGameContent(request.getTopic(), request.getLevel(), request.getType()));
        }

        game = gameRepository.save(game);
        return convertToDTO(game);
    }

    @Override
    @Transactional
    public void deleteGame(Long id, User teacher) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id: " + id));

        // Check authorization
        if (!game.getActivity().getClassroom().getTeacher().getId().equals(teacher.getId())) {
            throw new UnauthorizedException("You are not authorized to delete this game");
        }

        // Set isDeleted to true in the associated Activity
        Activity activity = game.getActivity();
        activity.setIsDeleted(true);
        activityRepository.save(activity);

        gameRepository.delete(game);
    }

    @Override
    public String generateGameContent(String topic, String level, GameType gameType) {
        JSONArray contentArray = new JSONArray();

        // Generate random math questions based on topic and level
        int numberOfQuestions = "easy".equalsIgnoreCase(level) ? 10 : "medium".equalsIgnoreCase(level) ? 15 : 20;

        Random random = new Random();

        if (gameType == GameType.FALLING_GAME) {
            // Generate math operations based on topic
            for (int i = 0; i < numberOfQuestions; i++) {
                JSONObject question = new JSONObject();
                int num1, num2, answer;
                String operation, questionText;

                if ("addition".equalsIgnoreCase(topic)) {
                    num1 = getDifficultyBasedNumber(level, random);
                    num2 = getDifficultyBasedNumber(level, random);
                    answer = num1 + num2;
                    questionText = num1 + " + " + num2;
                    operation = "addition";
                } else if ("subtraction".equalsIgnoreCase(topic)) {
                    num1 = getDifficultyBasedNumber(level, random);
                    num2 = getDifficultyBasedNumber(level, random);
                    // Ensure no negative results for simplicity
                    if (num1 < num2) {
                        int temp = num1;
                        num1 = num2;
                        num2 = temp;
                    }
                    answer = num1 - num2;
                    questionText = num1 + " - " + num2;
                    operation = "subtraction";
                } else if ("multiplication".equalsIgnoreCase(topic)) {
                    num1 = getDifficultyBasedMultiplicationNumber(level, random);
                    num2 = getDifficultyBasedMultiplicationNumber(level, random);
                    answer = num1 * num2;
                    questionText = num1 + " × " + num2;
                    operation = "multiplication";
                } else if ("division".equalsIgnoreCase(topic)) {
                    // Create division problems with whole number answers
                    num2 = getDifficultyBasedMultiplicationNumber(level, random);
                    answer = getDifficultyBasedMultiplicationNumber(level, random);
                    num1 = num2 * answer;
                    questionText = num1 + " ÷ " + num2;
                    operation = "division";
                } else {
                    // Default to mixed operations
                    int opType = random.nextInt(4);
                    switch (opType) {
                        case 0: // Addition
                            num1 = getDifficultyBasedNumber(level, random);
                            num2 = getDifficultyBasedNumber(level, random);
                            answer = num1 + num2;
                            questionText = num1 + " + " + num2;
                            operation = "addition";
                            break;
                        case 1: // Subtraction
                            num1 = getDifficultyBasedNumber(level, random);
                            num2 = getDifficultyBasedNumber(level, random);
                            if (num1 < num2) {
                                int temp = num1;
                                num1 = num2;
                                num2 = temp;
                            }
                            answer = num1 - num2;
                            questionText = num1 + " - " + num2;
                            operation = "subtraction";
                            break;
                        case 2: // Multiplication
                            num1 = getDifficultyBasedMultiplicationNumber(level, random);
                            num2 = getDifficultyBasedMultiplicationNumber(level, random);
                            answer = num1 * num2;
                            questionText = num1 + " × " + num2;
                            operation = "multiplication";
                            break;
                        default: // Division
                            num2 = getDifficultyBasedMultiplicationNumber(level, random);
                            answer = getDifficultyBasedMultiplicationNumber(level, random);
                            num1 = num2 * answer;
                            questionText = num1 + " ÷ " + num2;
                            operation = "division";
                            break;
                    }
                }

                question.put("question", questionText);
                question.put("answer", String.valueOf(answer));
                question.put("operation", operation);
                contentArray.put(question);
            }
        } else if (gameType == GameType.MULTIPLE_CHOICE) {
            // Generate multiple choice questions
            for (int i = 0; i < numberOfQuestions; i++) {
                JSONObject question = new JSONObject();
                int num1, num2, correctAnswer;
                String operation, questionText;
                JSONArray options = new JSONArray();

                if ("addition".equalsIgnoreCase(topic)) {
                    num1 = getDifficultyBasedNumber(level, random);
                    num2 = getDifficultyBasedNumber(level, random);
                    correctAnswer = num1 + num2;
                    questionText = "What is " + num1 + " + " + num2 + "?";
                    operation = "addition";
                } else if ("subtraction".equalsIgnoreCase(topic)) {
                    num1 = getDifficultyBasedNumber(level, random);
                    num2 = getDifficultyBasedNumber(level, random);
                    if (num1 < num2) {
                        int temp = num1;
                        num1 = num2;
                        num2 = temp;
                    }
                    correctAnswer = num1 - num2;
                    questionText = "What is " + num1 + " - " + num2 + "?";
                    operation = "subtraction";
                } else if ("multiplication".equalsIgnoreCase(topic)) {
                    num1 = getDifficultyBasedMultiplicationNumber(level, random);
                    num2 = getDifficultyBasedMultiplicationNumber(level, random);
                    correctAnswer = num1 * num2;
                    questionText = "What is " + num1 + " × " + num2 + "?";
                    operation = "multiplication";
                } else if ("division".equalsIgnoreCase(topic)) {
                    num2 = getDifficultyBasedMultiplicationNumber(level, random);
                    correctAnswer = getDifficultyBasedMultiplicationNumber(level, random);
                    num1 = num2 * correctAnswer;
                    questionText = "What is " + num1 + " ÷ " + num2 + "?";
                    operation = "division";
                } else {
                    // Default to mixed operations
                    int opType = random.nextInt(4);
                    switch (opType) {
                        case 0: // Addition
                            num1 = getDifficultyBasedNumber(level, random);
                            num2 = getDifficultyBasedNumber(level, random);
                            correctAnswer = num1 + num2;
                            questionText = "What is " + num1 + " + " + num2 + "?";
                            operation = "addition";
                            break;
                        case 1: // Subtraction
                            num1 = getDifficultyBasedNumber(level, random);
                            num2 = getDifficultyBasedNumber(level, random);
                            if (num1 < num2) {
                                int temp = num1;
                                num1 = num2;
                                num2 = temp;
                            }
                            correctAnswer = num1 - num2;
                            questionText = "What is " + num1 + " - " + num2 + "?";
                            operation = "subtraction";
                            break;
                        case 2: // Multiplication
                            num1 = getDifficultyBasedMultiplicationNumber(level, random);
                            num2 = getDifficultyBasedMultiplicationNumber(level, random);
                            correctAnswer = num1 * num2;
                            questionText = "What is " + num1 + " × " + num2 + "?";
                            operation = "multiplication";
                            break;
                        default: // Division
                            num2 = getDifficultyBasedMultiplicationNumber(level, random);
                            correctAnswer = getDifficultyBasedMultiplicationNumber(level, random);
                            num1 = num2 * correctAnswer;
                            questionText = "What is " + num1 + " ÷ " + num2 + "?";
                            operation = "division";
                            break;
                    }
                }

                // Generate options (including the correct answer)
                Set<Integer> usedOptions = new HashSet<>();
                usedOptions.add(correctAnswer);

                // Add correct answer
                options.put(String.valueOf(correctAnswer));

                // Add 3 wrong options
                for (int j = 0; j < 3; j++) {
                    int wrongOption;
                    do {
                        // Generate a wrong option that's reasonably close to the correct answer
                        int offset = random.nextInt(10) + 1;
                        if (random.nextBoolean()) {
                            wrongOption = correctAnswer + offset;
                        } else {
                            wrongOption = correctAnswer - offset;
                            if (wrongOption < 0)
                                wrongOption = correctAnswer + offset; // Avoid negative
                        }
                    } while (usedOptions.contains(wrongOption));

                    usedOptions.add(wrongOption);
                    options.put(String.valueOf(wrongOption));
                }

                question.put("question", questionText);
                question.put("options", options);
                question.put("correctAnswer", String.valueOf(correctAnswer));
                question.put("operation", operation);
                contentArray.put(question);
            }
        }

        return contentArray.toString();
    }

    // Helper method to generate difficulty-based numbers
    private int getDifficultyBasedNumber(String level, Random random) {
        if ("easy".equalsIgnoreCase(level)) {
            return random.nextInt(10) + 1; // 1-10
        } else if ("medium".equalsIgnoreCase(level)) {
            return random.nextInt(50) + 1; // 1-50
        } else {
            return random.nextInt(100) + 1; // 1-100
        }
    }

    // Helper method for multiplication/division difficulties
    private int getDifficultyBasedMultiplicationNumber(String level, Random random) {
        if ("easy".equalsIgnoreCase(level)) {
            return random.nextInt(10) + 1; // 1-10
        } else if ("medium".equalsIgnoreCase(level)) {
            return random.nextInt(12) + 1; // 1-12
        } else {
            return random.nextInt(20) + 1; // 1-20
        }
    }

    @Override
    @Transactional
    public GameScoreDTO submitGameScore(SubmitGameScoreRequest request, User student) {
        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id: " + request.getGameId()));

        // Check if student belongs to the classroom
        Classroom classroom = game.getActivity().getClassroom();
        boolean isStudentInClassroom = classroomStudentRepository.existsByClassroomAndStudentAndIsActiveTrue(classroom,
                student);

        if (!isStudentInClassroom) {
            throw new UnauthorizedException("You are not enrolled in this classroom");
        }

        // Find existing game score record for this user and game
        Optional<GameScore> existingScore = gameScoreRepository.findByGameIdAndStudentId(game.getId(), student.getId())
                .stream()
                .findFirst();

        GameScore gameScore;
        if (existingScore.isPresent()) {
            gameScore = existingScore.get();
            // Update if either:
            // 1. The new level is higher than the current one
            // 2. The new score is higher than the current one at the same level
            if (request.getLevel() > gameScore.getLevelAchieved() ||
                    (request.getLevel().equals(gameScore.getLevelAchieved())
                            && request.getScore() > gameScore.getScore())) {
                gameScore.setLevelAchieved(request.getLevel());
                gameScore.setScore(request.getScore());
                gameScore.setTimeTaken(request.getTimeTaken());
            }
        } else {
            // Create new record only if no previous record exists
            gameScore = new GameScore(
                    request.getScore(),
                    request.getTimeTaken(),
                    request.getLevel(),
                    game,
                    student);
        }

        gameScore = gameScoreRepository.save(gameScore);
        return convertToScoreDTO(gameScore);
    }

    @Override
    public List<GameScoreDTO> getGameLeaderboard(Long gameId) {
        // First, check if the game exists
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id: " + gameId));

        List<GameScore> scores = gameScoreRepository.findTopScoresByGameId(gameId);
        List<GameScoreDTO> scoresDTOs = scores.stream()
                .map(this::convertToScoreDTO)
                .sorted(Comparator.comparing(GameScoreDTO::getScore).reversed())
                .collect(Collectors.toList());

        // Add rank information
        for (int i = 0; i < scoresDTOs.size(); i++) {
            GameScoreDTO score = scoresDTOs.get(i);
            // Since we can't add rank to the DTO directly, we can create a map with the DTO
            // and rank
            // However, in a real-world scenario, it would be better to extend the DTO
            score.setRank(i + 1);
        }

        return scoresDTOs;
    }

    @Override
    public List<GameScoreDTO> getStudentGameScores(Long studentId) {
        List<GameScore> scores = gameScoreRepository.findByStudentId(studentId);
        return scores.stream().map(this::convertToScoreDTO).collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getClassroomLeaderboard(Long classroomId) {
        // Get classroom to verify it exists
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        // Get all scores from both classroom-based games and lesson-based games in this
        // classroom
        List<GameScore> scores = gameScoreRepository.findTopScoresByClassroomId(classroomId);

        // Group scores by student
        Map<Long, List<GameScoreDTO>> scoresByStudent = scores.stream()
                .map(this::convertToScoreDTO)
                .collect(Collectors.groupingBy(GameScoreDTO::getStudentId));

        // Calculate aggregated stats for each student
        List<Map<String, Object>> leaderboard = new ArrayList<>();

        scoresByStudent.forEach((studentId, studentScores) -> {
            Map<String, Object> entry = new HashMap<>();
            String studentName = studentScores.get(0).getStudentName();
            String username = studentScores.get(0).getStudentUsername();

            int totalScore = studentScores.stream().mapToInt(GameScoreDTO::getScore).sum();
            double avgScore = studentScores.stream().mapToInt(GameScoreDTO::getScore).average().orElse(0);
            int gamesPlayed = studentScores.size();
            int highestScore = studentScores.stream().mapToInt(GameScoreDTO::getScore).max().orElse(0);

            entry.put("studentId", studentId);
            entry.put("studentName", studentName);
            entry.put("username", username);
            entry.put("totalScore", totalScore);
            entry.put("averageScore", avgScore);
            entry.put("gamesPlayed", gamesPlayed);
            entry.put("highestScore", highestScore);

            leaderboard.add(entry);
        });

        // Sort leaderboard by total score (descending)
        leaderboard.sort((a, b) -> Integer.compare(
                (Integer) b.get("totalScore"),
                (Integer) a.get("totalScore")));

        // Add rank information
        for (int i = 0; i < leaderboard.size(); i++) {
            leaderboard.get(i).put("rank", i + 1);
        }

        // Add information about game types
        List<Map<String, Object>> gameTypes = new ArrayList<>();

        // Get counts of each game type in the classroom
        Map<GameType, Long> gameTypeCounts = scores.stream()
                .map(score -> score.getGame().getType())
                .collect(Collectors.groupingBy(type -> type, Collectors.counting()));

        gameTypeCounts.forEach((type, count) -> {
            Map<String, Object> gameTypeInfo = new HashMap<>();
            gameTypeInfo.put("type", type.toString());
            gameTypeInfo.put("count", count);
            gameTypes.add(gameTypeInfo);
        });

        Map<String, Object> result = new HashMap<>();
        result.put("leaderboard", leaderboard);
        result.put("totalGamesPlayed", scores.size());
        result.put("totalStudents", scoresByStudent.size());
        result.put("gameTypes", gameTypes);
        result.put("classroomName", classroom.getName());

        return result;
    }

    @Override
    public Map<String, Object> getGameAnalytics(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id: " + gameId));

        List<GameScore> scores = gameScoreRepository.findByGameId(gameId);
        List<GameScoreDTO> scoreDTOs = scores.stream().map(this::convertToScoreDTO).collect(Collectors.toList());

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("gameId", game.getId());
        analytics.put("gameName", game.getName());
        analytics.put("gameType", game.getType());
        analytics.put("topic", game.getTopic());
        analytics.put("level", game.getLevel());
        analytics.put("totalPlays", scores.size());

        // Calculate statistics
        OptionalDouble avgScore = scores.stream().mapToInt(GameScore::getScore).average();
        OptionalInt highScore = scores.stream().mapToInt(GameScore::getScore).max();
        OptionalInt lowScore = scores.stream().mapToInt(GameScore::getScore).min();

        analytics.put("averageScore", avgScore.orElse(0));
        analytics.put("highestScore", highScore.orElse(0));
        analytics.put("lowestScore", lowScore.orElse(0));

        // Top players
        List<GameScoreDTO> topScores = scoreDTOs.stream()
                .sorted(Comparator.comparing(GameScoreDTO::getScore).reversed())
                .limit(10)
                .collect(Collectors.toList());

        analytics.put("topScores", topScores);

        return analytics;
    }

    @Override
    public Integer getStudentGameLevel(Long gameId, Long studentId) {
        List<GameScore> scores = gameScoreRepository.findByGameIdAndStudentId(gameId, studentId);
        return scores.stream()
                .map(GameScore::getLevelAchieved)
                .filter(level -> level != null)
                .max(Integer::compareTo)
                .orElse(0); // Return 0 if no levels completed, allowing access to level 1
    }

    @Override
    @Transactional
    public void updateStudentGameProgress(Game game, User student, Integer level) {
        // Find existing game score record for this user and game
        Optional<GameScore> existingScore = gameScoreRepository.findByGameIdAndStudentId(game.getId(), student.getId())
                .stream()
                .findFirst();

        if (existingScore.isPresent()) {
            GameScore score = existingScore.get();
            // Only update if the new level is higher
            if (score.getLevelAchieved() == null || level > score.getLevelAchieved()) {
                score.setLevelAchieved(level);
                gameScoreRepository.save(score);
            }
        } else {
            // Create new record only if no previous record exists
            GameScore gameScore = new GameScore();
            gameScore.setGame(game);
            gameScore.setStudent(student);
            gameScore.setLevelAchieved(level);
            gameScore.setScore(0); // This is just a level progression record
            gameScore.setTimeTaken(0);
            gameScoreRepository.save(gameScore);
        }
    }

    @Override
    public boolean isLevelUnlocked(Long gameId, Long studentId, Integer level) {
        Integer currentLevel = getStudentGameLevel(gameId, studentId);
        return level <= currentLevel + 1; // Allow access to current level and next level
    }

    // Helper methods to convert entities to DTOs
    private GameDTO convertToDTO(Game game) {
        return new GameDTO(
                game.getId(),
                game.getName(),
                game.getInstructions(),
                game.getTopic(),
                game.getLevel(),
                game.getType(),
                game.getGameContent(),
                game.getActivity().getId(),
                game.getMaxLevels(),
                game.getCreatedDate(),
                game.getUpdatedDate());
    }

    private GameScoreDTO convertToScoreDTO(GameScore score) {
        GameScoreDTO dto = new GameScoreDTO();
        dto.setId(score.getId());
        dto.setScore(score.getScore());
        dto.setTimeTaken(score.getTimeTaken());
        dto.setLevelAchieved(score.getLevelAchieved());
        if (score.getGame() != null) {
            dto.setGameId(score.getGame().getId());
            dto.setGameName(score.getGame().getName());
            dto.setGameType(score.getGame().getType().toString());
        }
        if (score.getStudent() != null) {
            dto.setStudentId(score.getStudent().getId());
            dto.setStudentName(score.getStudent().getFirstName() + " " + score.getStudent().getLastName());
            dto.setStudentUsername(score.getStudent().getUsername());
        }
        dto.setPlayedAt(score.getCreatedDate());
        // Rank is typically set elsewhere, e.g., when fetching a leaderboard
        return dto;
    }
}