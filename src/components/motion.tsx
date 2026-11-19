import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/SettingsContext';

/**
 * Animações do design (aqWave, aqScan, aqBubble, aqGlow, aqPing, aqSweep, aqDrop, aqHoloIn, aqIn).
 * Com "Reduzir movimento" ligado, tudo fica parado, como o @media (prefers-reduced-motion) do design.
 */

/**
 * A web não tem o módulo nativo de animação: lá o React Native avisa e cai para JS.
 * Usamos o driver nativo só no celular e evitamos o aviso no navegador.
 */
export const NATIVE_DRIVER = Platform.OS !== 'web';

/** Valor que vai de 0 a 1 em loop. Parado em `rest` quando o movimento está reduzido. */
export function useLoop(
  durationMs: number,
  { delayMs = 0, easing = Easing.linear, rest = 0, pingPong = false }: { delayMs?: number; easing?: (v: number) => number; rest?: number; pingPong?: boolean } = {},
) {
  const { reduceMotion } = useTheme();
  const [value] = useState(() => new Animated.Value(rest));
  // A curva fica numa ref: quem chama costuma criar Easing.in(...) a cada render, e isso não deve reiniciar o loop.
  const ease = useRef(easing);
  useEffect(() => {
    ease.current = easing;
  });

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(rest);
      return;
    }
    value.setValue(0);
    const forward = Animated.timing(value, { toValue: 1, duration: durationMs, easing: ease.current, useNativeDriver: NATIVE_DRIVER });
    const seq = pingPong
      ? Animated.sequence([forward, Animated.timing(value, { toValue: 0, duration: durationMs, easing: ease.current, useNativeDriver: NATIVE_DRIVER })])
      : forward;
    const loop = Animated.loop(seq, { iterations: -1, resetBeforeIteration: !pingPong });
    const t = setTimeout(() => loop.start(), delayMs);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [reduceMotion, durationMs, delayMs, rest, pingPong, value]);

  return value;
}

/** Valor que vai de 0 a 1 uma vez, ao montar (entradas). */
const ENTER_EASE = Easing.out(Easing.cubic);

export function useEnter(durationMs: number, delayMs = 0, easing = ENTER_EASE) {
  const { reduceMotion } = useTheme();
  const [value] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  useEffect(() => {
    if (reduceMotion) {
      value.setValue(1);
      return;
    }
    const anim = Animated.timing(value, { toValue: 1, duration: durationMs, delay: delayMs, easing, useNativeDriver: NATIVE_DRIVER });
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, durationMs, delayMs, easing, value]);
  return value;
}

/** aqIn: sobe 10 px e aparece. Envolve o conteúdo de cada tela. */
export function FadeIn({ children, style, delayMs = 0, durationMs = 350 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; delayMs?: number; durationMs?: number }) {
  const t = useEnter(durationMs, delayMs);
  return (
    <Animated.View
      style={[
        style,
        { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** aqHoloIn: o holograma "se materializa" de baixo para cima. */
export function HoloIn({ children, style, delayMs = 0, durationMs = 1800 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; delayMs?: number; durationMs?: number }) {
  const t = useEnter(durationMs, delayMs);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.85, 1] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { scaleY: t.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** aqGlow: pulsa a opacidade entre 0,55 e 1. */
export function Glow({ children, style, durationMs = 2400 }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; durationMs?: number }) {
  const t = useLoop(durationMs / 2, { pingPong: true, easing: Easing.inOut(Easing.ease), rest: 1 });
  return <Animated.View style={[style, { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]}>{children}</Animated.View>;
}
