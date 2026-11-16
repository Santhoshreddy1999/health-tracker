import React from 'react';
import { View } from 'react-native';
import { addDays, today } from '../utils';
import { Button, Field, Row } from './ui';

export function DateField({ value, onChange, label = 'Date' }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
      <Field label={`${label} (YYYY-MM-DD)`} value={value} onChangeText={onChange} autoCapitalize="none" maxLength={10} style={{ marginBottom: 8 }} />
      <Row gap={6} style={{ marginBottom: 12 }}>
        <Button small variant="ghost" title="Today" onPress={() => onChange(today())} />
        <Button small variant="ghost" title="Yesterday" onPress={() => onChange(addDays(today(), -1))} />
      </Row>
    </View>
  );
}
