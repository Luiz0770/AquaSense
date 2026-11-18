import React, { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/SettingsContext';
import { fonts } from '@/styles/theme';
import { AppText, ErrorText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Props extends TextInputProps {
  label: string;
  /** Texto menor ao lado do rótulo, como "(mín. 6)" ou o contador. */
  labelHint?: string;
  hint?: string;
  error?: string | null;
  mono?: boolean;
  /** Elemento à direita do campo (ex.: botão de localização). */
  right?: React.ReactNode;
  /** Ícone decorativo dentro do campo, à esquerda do texto. */
  icon?: IconName;
}

/** Campo do design: rótulo em negrito, 54 px de altura, cantos de 16 px e borda de 2 px. */
export function TextField({ label, labelHint, hint, error, mono, right, icon, multiline, style, onFocus, onBlur, ...rest }: Props) {
  const { palette, fontScale } = useTheme();
  const [focused, setFocused] = useState(false);
  const fs = 16 * fontScale;
  return (
    <View style={{ gap: 6 }}>
      <AppText weight={700} accessibilityElementsHidden importantForAccessibility="no">
        {label}
        {labelHint ? (
          <AppText weight={400} muted>
            {` ${labelHint}`}
          </AppText>
        ) : null}
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            flex: 1,
            borderRadius: 18,
            borderWidth: 3,
            borderColor: focused ? palette.focus : 'transparent',
            margin: -3,
          }}
        >
          {icon ? (
            <View style={{ position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 }}>
              <Icon name={icon} size={22 * fontScale} color={palette.inkMuted} />
            </View>
          ) : null}
          <TextInput
            accessibilityLabel={label}
            accessibilityHint={hint}
            placeholderTextColor={palette.inkMuted}
            multiline={multiline}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              {
                minHeight: multiline ? 54 + fs * 2.8 : 54,
                paddingHorizontal: 16,
                paddingLeft: icon ? 44 : 16,
                paddingVertical: multiline ? 14 : 0,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: error ? palette.error : palette.border,
                backgroundColor: palette.surface,
                color: palette.ink,
                fontFamily: mono ? fonts.mono : fonts.sans,
                fontSize: fs,
                textAlignVertical: multiline ? 'top' : 'center',
              },
              style,
            ]}
            {...rest}
          />
        </View>
        {right}
      </View>
      {error ? <ErrorText>{error}</ErrorText> : hint ? <AppText size={14} muted>{hint}</AppText> : null}
    </View>
  );
}
