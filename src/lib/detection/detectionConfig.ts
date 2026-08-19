export const DETECTION_CONFIG = {
  /**
   * ---------------------------------------------------------
   * Confidence
   * ---------------------------------------------------------
   */

  /**
   * Candidate must reach this score to become
   * an automatically detected signature field.
   */
  HIGH_CONFIDENCE_THRESHOLD: 70,

  /**
   * Candidates below this score should normally
   * not be shown automatically.
   */
  LOW_CONFIDENCE_THRESHOLD: 50,

  /**
   * Maximum confidence.
   */
  MAX_CONFIDENCE: 100,

  /**
   * Minimum confidence.
   */
  MIN_CONFIDENCE: 0,

  /**
   * ---------------------------------------------------------
   * Geometry
   * ---------------------------------------------------------
   */

  /**
   * Minimum horizontal line length that can
   * represent a form input/signature line.
   */
  MIN_HORIZONTAL_LINE_LENGTH: 50,

  /**
   * Maximum line thickness considered an input line.
   */
  MAX_INPUT_LINE_HEIGHT: 5,

  /**
   * Maximum vertical distance between a label
   * and its corresponding horizontal line.
   */
  MAX_LABEL_LINE_VERTICAL_DISTANCE: 60,

  /**
   * Maximum horizontal distance between a label
   * and its corresponding line.
   */
  MAX_LABEL_LINE_HORIZONTAL_DISTANCE: 250,

  /**
   * Minimum width of a likely signature area.
   */
  MIN_SIGNATURE_WIDTH: 80,

  /**
   * Default signature field width when geometry
   * is unavailable.
   */
  DEFAULT_SIGNATURE_WIDTH: 220,

  /**
   * Default signature field height.
   */
  DEFAULT_SIGNATURE_HEIGHT: 55,

  /**
   * ---------------------------------------------------------
   * Context
   * ---------------------------------------------------------
   */

  /**
   * How far around a signature section we search
   * for names/roles.
   */
  SECTION_CONTEXT_DISTANCE: 250,

  /**
   * How close two candidates can be before they
   * are considered duplicates.
   */
  DUPLICATE_X_DISTANCE: 100,

  DUPLICATE_Y_DISTANCE: 60,

  /**
   * ---------------------------------------------------------
   * Index / TOC
   * ---------------------------------------------------------
   */

  /**
   * Dotted leader:
   *
   * Signature ........ 12
   */
  INDEX_DOTTED_LEADER_MIN_LENGTH: 3,

  /**
   * Page numbers normally fall within this range.
   */
  INDEX_MAX_PAGE_NUMBER_DIGITS: 4,
} as const;
