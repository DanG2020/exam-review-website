export interface BaseQuestion {
  id: number;
  type: 'multiple-choice' | 'written' | 'matching' | 'written-dual' | 'written-single';
  text: string;
  points: number;
  /** Short 1–2 sentence explanation/hint (optional, token-light) */
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  /** Index into options[] for the correct answer (optional) */
  correctIndex?: number;
}

export interface WrittenQuestion extends BaseQuestion {
  type: 'written';
  answerBoxes: number;
  /** Optional sample answers shown on review */
  expectedAnswers?: string[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: string[];
  rightItems: string[];
  /**
   * For each leftItems[i], the correct index in rightItems it should match.
   * Example: [2,0,1] -> left[0]->right[2], left[1]->right[0], left[2]->right[1]
   */
  correctMatches?: number[];
}

export interface WrittenDualInputQuestion extends BaseQuestion {
  type: 'written-dual';
  imageSrc?: string;
  expectedAnswers?: string[]; // e.g., ['125', 'F']
}

export interface WrittenSingleInputQuestion extends BaseQuestion {
  type: 'written-single';
  expectedAnswers?: string[]; // e.g., ['36.7']
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | WrittenQuestion
  | MatchingQuestion
  | WrittenDualInputQuestion
  | WrittenSingleInputQuestion;
