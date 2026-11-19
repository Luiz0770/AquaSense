import { Platform } from 'react-native';

/**
 * Props para esconder um <Svg> decorativo do leitor de tela.
 * No celular o react-native-svg entende `accessible`/`importantForAccessibility`;
 * na web ele repassa tudo para a tag <svg>, e o React avisa que esses nomes não
 * existem no HTML. Lá o equivalente é `aria-hidden`.
 */
export const svgHidden =
  Platform.OS === 'web'
    ? ({ 'aria-hidden': true } as const)
    : ({ accessible: false, importantForAccessibility: 'no-hide-descendants' } as const);

/** Props para um <Svg> que é uma imagem com descrição (ex.: foto de demonstração). */
export function svgImage(label: string) {
  return Platform.OS === 'web'
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ accessible: true, accessibilityLabel: label } as const);
}
