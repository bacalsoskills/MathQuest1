-- Update indexes for more efficient score queries
CREATE INDEX idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_game_scores_score ON game_scores(score DESC);

-- Make sure game_scores have proper constraints
ALTER TABLE game_scores
ADD CONSTRAINT fk_game_scores_game FOREIGN KEY (game_id) REFERENCES games(id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE game_scores
ADD CONSTRAINT fk_game_scores_user FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE ON UPDATE CASCADE; 