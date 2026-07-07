import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Typography } from '../constants/colors';

interface MeasurementInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}

export const MeasurementInput: React.FC<MeasurementInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'numeric',
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || '0'}
          keyboardType={keyboardType}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Text style={styles.unit}>in</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: Colors.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelFocused: {
    color: Colors.primary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: Colors.textDark,
    fontFamily: Typography.bold,
  },
  unit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Typography.semiBold,
  },
});
