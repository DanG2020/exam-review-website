export interface BaseQuestion {
  id: number;
  type: 'multiple-choice' | 'written' | 'matching' | 'written-dual' | 'written-single';
  text: string;
  points: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
}

export interface WrittenQuestion extends BaseQuestion {
  type: 'written';
  answerBoxes: number;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: string[];
  rightItems: string[];
}

export interface WrittenDualInputQuestion extends BaseQuestion {
  type: 'written-dual';
  imageSrc?: string;
}

export interface WrittenSingleInputQuestion extends BaseQuestion {
  type: 'written-single';
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | WrittenQuestion
  | MatchingQuestion
  | WrittenDualInputQuestion
  | WrittenSingleInputQuestion;
