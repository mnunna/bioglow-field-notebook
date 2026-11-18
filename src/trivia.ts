import triviaContent from './content/biodiversityQuiz.json';

export interface TriviaOption {
  id: string;
  text: string;
}

export interface TriviaQuestion {
  id: string;
  level: string;
  question: string;
  options: TriviaOption[];
  correctAnswer: string;
  correctMessage: string;
  incorrectMessage: string;
  ahaMessage: string;
  connection: string;
  funFact?: string;
  actionTip?: string;
}

const levelNames = new Map(
  triviaContent.levels.map((level) => [level.id, level.name]),
);

export const TRIVIA_QUESTIONS = triviaContent.questions as TriviaQuestion[];

export function triviaCategoryName(levelId: string): string {
  return levelNames.get(levelId) ?? 'Biodiversity';
}

export function createTriviaRound(
  count = 5,
  random: () => number = Math.random,
): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
