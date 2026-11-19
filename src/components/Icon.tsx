import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { glyphs, type IconName } from './icons/glyphs';
import { svgHidden } from './svgA11y';

export type { IconName };

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  /** Versão preenchida (FILL 1 no design). */
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Ícones Material Symbols Rounded (peso 500), os mesmos do design. Decorativos: o texto ao lado dá o sentido. */
export function Icon({ name, size = 24, color = '#000', filled, style }: Props) {
  const g = glyphs[name] as { box: string; d: string; fill?: string };
  return (
    <Svg
      width={size}
      height={size}
      viewBox={g.box}
      style={style}
      {...svgHidden}
    >
      <Path d={filled && g.fill ? g.fill : g.d} fill={color} />
    </Svg>
  );
}
