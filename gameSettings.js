function getLevelSettings(level) {
  // This function returns different settings for each game level
  switch (level) {
    case 1:
      // Level 1: Slow drops, no obstacles
      return {
        dropSpeed: 2, // How fast the drops fall
        obstacleSpeed: 0, // No obstacles yet
        dropFrequency: 1500, // Time (ms) between drops
        fakeDrops: 0, // No fake drops
      };
    case 2:
      // Level 2: Drops a bit faster, one obstacle, one fake drop
      return {
        dropSpeed: 2.5,
        obstacleSpeed: 1,
        dropFrequency: 1200,
        fakeDrops: 1,
      };
    case 3:
      // Level 3: Drops are faster, more obstacles and fake drops
      return {
        dropSpeed: 3,
        obstacleSpeed: 1.5,
        dropFrequency: 1000,
        fakeDrops: 2,
      };
    case 4:
      // Level 4: Even faster, more challenge
      return {
        dropSpeed: 3.5,
        obstacleSpeed: 2,
        dropFrequency: 800,
        fakeDrops: 3,
      };
    case 5:
      // Level 5: Fastest, most obstacles and fake drops
      return {
        dropSpeed: 4,
        obstacleSpeed: 2.5,
        dropFrequency: 600,
        fakeDrops: 4,
      };
    default:
      // If the level is not 1-5, use level 1 settings
      return {
        dropSpeed: 2,
        obstacleSpeed: 0,
        dropFrequency: 1500,
        fakeDrops: 0,
      };
  }
}