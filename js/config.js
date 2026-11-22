/**
 * ==============================================================================
 * NUMORIA - GAME CONFIGURATION & CONSTANTS
 * ==============================================================================
 */
const GAME_CONFIG = {
  // Round and Wave Structure
  // Ronde 1: 4 wave, Ronde 2: 5 wave, Ronde 3: 6 wave, Ronde 4: 7 wave
  ROUNDS: [
    { roundNum: 1, wavesCount: 4, waveDuration: 3.2, speed: 240, complexity: 1.0 },
    { roundNum: 2, wavesCount: 5, waveDuration: 3.0, speed: 270, complexity: 1.25 },
    { roundNum: 3, wavesCount: 6, waveDuration: 2.8, speed: 300, complexity: 1.5 },
    { roundNum: 4, wavesCount: 7, waveDuration: 2.6, speed: 340, complexity: 1.8 }
  ],

  TOTAL_WAVES: 4 + 5 + 6 + 7, // 22 total waves
  TOTAL_ROUNDS: 4,

  // Wave Line & Tracking Parameters (Clean Oscilloscope/Rhythm Line)
  TOLERANCE_RADIUS: 36,        // Pixel distance tolerance around the wave line
  LINE_WIDTH: 8,               // Ketebalan garis wave (pixel) - default 8px agar jelas terlihat
  LEAD_IN_TIME: 0.75,          // Seconds before wave head reaches judgment line
  SYNC_THRESHOLD: 0.70,        // 70% hold accuracy to clear wave
  KEY_SPEED: 520,              // Speed for keyboard slider movement (px/s)
  POPUP_DURATION_MS: 1000,     // Pop-up numbers show for max 1 second (1000ms)

  // Scoring Thresholds (Thousand scale conversion)
  MAX_WAVE_SCORE: 5000,
  MAX_MATH_SCORE: 5000,

  /**
   * Generates a random integer in [-10, 10] excluding 0
   * Valid values: -10..-1 and 1..10
   */
  generateRandomNumber() {
    const rand = Math.floor(Math.random() * 20) - 10; // -10 to 9
    return rand >= 0 ? rand + 1 : rand;
  }
};

window.GAME_CONFIG = GAME_CONFIG;
