import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BigButton, COLORS, GlossyCard } from '../components/ui';
import {
  createTriviaRound,
  triviaCategoryName,
  type TriviaQuestion,
} from '../trivia';

const ROUND_SIZE = 5;

function optionState(
  question: TriviaQuestion,
  optionId: string,
  selectedOptionId: string | null,
): 'default' | 'selected' | 'correct' | 'incorrect' | 'muted' {
  if (!selectedOptionId) return 'default';
  if (optionId === question.correctAnswer) return 'correct';
  if (optionId === selectedOptionId) return 'incorrect';
  return 'muted';
}

export function TriviaScreen({ glove }: { glove: boolean }) {
  const [round, setRound] = useState(() => createTriviaRound(ROUND_SIZE));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [complete, setComplete] = useState(false);
  const question = round[questionIndex];

  function selectAnswer(optionId: string) {
    if (!question || selectedOptionId) return;
    setSelectedOptionId(optionId);
    if (optionId === question.correctAnswer) setCorrectAnswers((value) => value + 1);
  }

  function advance() {
    if (questionIndex >= round.length - 1) {
      setComplete(true);
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelectedOptionId(null);
  }

  function startNewRound() {
    setRound(createTriviaRound(ROUND_SIZE));
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setCorrectAnswers(0);
    setComplete(false);
  }

  if (complete) {
    return (
      <ScrollView contentContainerStyle={styles.completeWrap}>
        <View style={styles.completeIcon}>
          <Ionicons name="leaf" size={46} color={COLORS.lime} />
        </View>
        <Text style={[styles.completeTitle, glove && styles.headingGlove]}>Round complete</Text>
        <Text style={[styles.completeScore, glove && styles.completeScoreGlove]}>
          {correctAnswers} / {round.length}
        </Text>
        <Text style={[styles.completeBody, glove && styles.bodyGlove]}>
          You explored how plants, animals, fungi, habitats, and people depend on one another.
        </Text>

        <GlossyCard gradient={['#124232', '#176858']} style={styles.closingCard}>
          <Text style={[styles.closingTitle, glove && styles.titleGlove]}>The network is the lesson</Text>
          <Text style={[styles.closingBody, glove && styles.bodyGlove]}>
            Biodiversity is not only how many species exist. It is also the relationships between living things—change one part, and other parts can be affected.
          </Text>
        </GlossyCard>
        <View style={styles.newRoundButton}>
          <BigButton title="Start a new round" glove={glove} onPress={startNewRound} />
        </View>
      </ScrollView>
    );
  }

  if (!question) return null;
  const answeredCorrectly = selectedOptionId === question.correctAnswer;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.metaRow}>
        <Text style={[styles.category, glove && styles.categoryGlove]}>
          {triviaCategoryName(question.level)}
        </Text>
        <Text style={[styles.progressLabel, glove && styles.categoryGlove]}>
          {questionIndex + 1} of {round.length}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((questionIndex + 1) / round.length) * 100}%` }]} />
      </View>

      <Text style={[styles.question, glove && styles.questionGlove]}>{question.question}</Text>

      <View style={styles.options}>
        {question.options.map((option) => {
          const state = optionState(question, option.id, selectedOptionId);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedOptionId === option.id, disabled: selectedOptionId !== null }}
              disabled={selectedOptionId !== null}
              onPress={() => selectAnswer(option.id)}
              style={({ pressed }) => [
                styles.option,
                glove && styles.optionGlove,
                state === 'correct' && styles.optionCorrect,
                state === 'incorrect' && styles.optionIncorrect,
                state === 'muted' && styles.optionMuted,
                pressed && styles.pressed,
              ]}
            >
              <View style={[
                styles.optionLetter,
                glove && styles.optionLetterGlove,
                state === 'correct' && styles.optionLetterCorrect,
                state === 'incorrect' && styles.optionLetterIncorrect,
              ]}>
                <Text style={[styles.optionLetterText, glove && styles.optionLetterTextGlove]}>{option.id}</Text>
              </View>
              <Text style={[styles.optionText, glove && styles.optionTextGlove]}>{option.text}</Text>
              {state === 'correct' ? <Ionicons name="checkmark-circle" size={23} color={COLORS.lime} /> : null}
              {state === 'incorrect' ? <Ionicons name="close-circle" size={23} color={COLORS.danger} /> : null}
            </Pressable>
          );
        })}
      </View>

      {selectedOptionId ? (
        <View style={styles.feedbackWrap}>
          <GlossyCard
            gradient={answeredCorrectly ? ['#14532d', '#237d45'] : ['#5b2a2a', '#773838']}
            style={styles.reactionCard}
          >
            <Text style={[styles.reactionTitle, glove && styles.titleGlove]}>
              {answeredCorrectly ? '✓ You found the connection' : '🌱 Keep exploring'}
            </Text>
            <Text style={[styles.reactionBody, glove && styles.bodyGlove]}>
              {answeredCorrectly ? question.correctMessage : question.incorrectMessage}
            </Text>
          </GlossyCard>

          <GlossyCard style={styles.ahaCard}>
            <Text style={[styles.ahaLabel, glove && styles.categoryGlove]}>AHA!</Text>
            <Text style={[styles.ahaText, glove && styles.bodyGlove]}>{question.ahaMessage}</Text>
            <View style={styles.connectionRow}>
              <Ionicons name="git-network-outline" size={20} color={COLORS.teal} />
              <Text style={[styles.connectionText, glove && styles.connectionTextGlove]}>{question.connection}</Text>
            </View>
            {question.funFact ? (
              <Text style={[styles.extraText, glove && styles.bodyGlove]}>Did you know? {question.funFact}</Text>
            ) : null}
            {question.actionTip ? (
              <Text style={[styles.extraText, glove && styles.bodyGlove]}>Try this: {question.actionTip}</Text>
            ) : null}
          </GlossyCard>

          <BigButton
            title={questionIndex === round.length - 1 ? 'See results' : 'Next question'}
            glove={glove}
            onPress={advance}
          />
        </View>
      ) : (
        <Text style={[styles.prompt, glove && styles.promptGlove]}>Choose the answer that fits best.</Text>
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  category: { flex: 1, color: COLORS.lime, fontSize: 12, lineHeight: 17, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryGlove: { fontSize: 15, lineHeight: 21 },
  progressLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.11)', overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: COLORS.lime },
  question: { color: COLORS.text, fontSize: 25, lineHeight: 32, fontWeight: '900', letterSpacing: -0.4, marginTop: 24 },
  questionGlove: { fontSize: 30, lineHeight: 38 },
  options: { marginTop: 18, gap: 10 },
  option: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: COLORS.cardStrong, borderWidth: 1, borderColor: COLORS.cardBorder },
  optionGlove: { minHeight: 80, paddingVertical: 15 },
  optionCorrect: { borderColor: COLORS.lime, backgroundColor: 'rgba(69,125,43,0.55)' },
  optionIncorrect: { borderColor: COLORS.danger, backgroundColor: 'rgba(116,45,45,0.52)' },
  optionMuted: { opacity: 0.5 },
  optionLetter: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 11 },
  optionLetterGlove: { width: 44, height: 44, borderRadius: 14 },
  optionLetterCorrect: { backgroundColor: 'rgba(182,239,104,0.2)' },
  optionLetterIncorrect: { backgroundColor: 'rgba(248,113,113,0.2)' },
  optionLetterText: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  optionLetterTextGlove: { fontSize: 17 },
  optionText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20, fontWeight: '600', paddingRight: 8 },
  optionTextGlove: { fontSize: 18, lineHeight: 25 },
  pressed: { opacity: 0.75 },
  prompt: { color: COLORS.muted, fontSize: 12.5, textAlign: 'center', marginTop: 15 },
  promptGlove: { fontSize: 15 },
  feedbackWrap: { marginTop: 16, gap: 12 },
  reactionCard: { paddingVertical: 14 },
  reactionTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  reactionBody: { color: 'rgba(255,255,255,0.92)', fontSize: 13.5, lineHeight: 20, marginTop: 5 },
  ahaCard: { borderColor: 'rgba(56,224,193,0.4)' },
  ahaLabel: { color: COLORS.teal, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  ahaText: { color: COLORS.text, fontSize: 14, lineHeight: 21, marginTop: 6 },
  connectionRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  connectionText: { flex: 1, color: COLORS.teal, fontSize: 12.5, lineHeight: 18, fontWeight: '700', marginLeft: 8 },
  connectionTextGlove: { fontSize: 15.5, lineHeight: 22 },
  extraText: { color: COLORS.muted, fontSize: 12.5, lineHeight: 18, marginTop: 10 },
  completeWrap: { flexGrow: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  completeIcon: { width: 86, height: 86, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(182,239,104,0.14)', borderWidth: 1, borderColor: 'rgba(182,239,104,0.35)' },
  completeTitle: { color: COLORS.text, fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  headingGlove: { fontSize: 34, lineHeight: 41 },
  completeScore: { color: COLORS.lime, fontSize: 24, fontWeight: '900', marginTop: 6 },
  completeScoreGlove: { fontSize: 29 },
  completeBody: { color: COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 480, marginTop: 10 },
  bodyGlove: { fontSize: 17, lineHeight: 25 },
  closingCard: { width: '100%', maxWidth: 560, marginTop: 22 },
  closingTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  titleGlove: { fontSize: 20 },
  closingBody: { color: 'rgba(255,255,255,0.9)', fontSize: 13.5, lineHeight: 20, marginTop: 7 },
  newRoundButton: { width: '100%', maxWidth: 560, marginTop: 16 },
  bottomSpace: { height: 24 },
});
