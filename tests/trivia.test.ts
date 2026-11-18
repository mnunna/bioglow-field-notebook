import assert from 'node:assert/strict';
import test from 'node:test';
import { createTriviaRound, TRIVIA_QUESTIONS } from '../src/trivia';

test('bundled trivia keeps the complete five-theme question pool', () => {
  assert.equal(TRIVIA_QUESTIONS.length, 25);
  assert.equal(new Set(TRIVIA_QUESTIONS.map((question) => question.level)).size, 5);
  for (const question of TRIVIA_QUESTIONS) {
    assert.equal(question.options.length, 4);
    assert.ok(question.options.some((option) => option.id === question.correctAnswer));
    assert.ok(question.ahaMessage.length > 0);
    assert.ok(question.connection.length > 0);
  }
});

test('a trivia round contains five distinct questions', () => {
  const round = createTriviaRound(5, () => 0.42);

  assert.equal(round.length, 5);
  assert.equal(new Set(round.map((question) => question.id)).size, 5);
});
