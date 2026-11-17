import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const COLORS = {
  bgDeep: '#02130d',
  bg: '#05251a',
  bgSoft: '#0a3022',
  card: 'rgba(255,255,255,0.085)',
  cardStrong: 'rgba(12,48,34,0.94)',
  cardBorder: 'rgba(221,255,232,0.17)',
  text: '#f2fff5',
  muted: '#a5c5b2',
  lime: '#b6ef68',
  teal: '#38e0c1',
  amber: '#ffb04d',
  violet: '#c69bf7',
  blue: '#73b7ff',
  danger: '#f87171',
};

/** Glossy gradient card with a soft top highlight, like the web prototype. */
export function GlossyCard({
  children,
  gradient,
  style,
  onPress,
}: {
  children: React.ReactNode;
  gradient?: [string, string];
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <View style={styles.highlight} />
      {children}
    </>
  );
  if (gradient) {
    const card = (
      <LinearGradient colors={gradient} style={[styles.card, style]}>
        {inner}
      </LinearGradient>
    );
    return onPress ? (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {card}
      </Pressable>
    ) : (
      card
    );
  }
  const card = <View style={[styles.card, styles.plainCard, style]}>{inner}</View>;
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {card}
    </Pressable>
  ) : (
    card
  );
}

export function BigButton({
  title,
  onPress,
  glove,
  variant = 'primary',
  disabled = false,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  glove: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const pad = glove ? 20 : 14;
  const font = glove ? 19 : 16;
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={['#d6ff8a', '#82bd26']}
          style={[styles.btn, { paddingVertical: pad }]}
        >
          <View style={styles.highlight} />
          <Text style={[styles.btnTextDark, { fontSize: font }]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'danger' ? styles.btnDanger : styles.btnGhost,
        { paddingVertical: pad },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          variant === 'danger' ? styles.btnTextDanger : styles.btnTextLight,
          { fontSize: font },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  glove,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  glove: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        { paddingVertical: glove ? 12 : 8, paddingHorizontal: glove ? 18 : 14 },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected, { fontSize: glove ? 17 : 14 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  plainCard: { backgroundColor: COLORS.cardStrong },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.48 },
  btn: {
    borderRadius: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.09)' },
  btnDanger: { backgroundColor: 'rgba(248,113,113,0.14)', borderColor: 'rgba(248,113,113,0.5)' },
  btnTextDark: { color: '#1a2e05', fontWeight: '800' },
  btnTextLight: { color: COLORS.text, fontWeight: '700' },
  btnTextDanger: { color: COLORS.danger, fontWeight: '700' },
  chip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: COLORS.lime, borderColor: COLORS.lime },
  chipText: { color: COLORS.text },
  chipTextSelected: { color: '#1a2e05', fontWeight: '700' },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 10,
  },
});
