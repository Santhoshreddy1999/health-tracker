import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from './theme';

/**
 * Not cryptographic: the PIN is a privacy screen for a shared family phone, not encryption.
 * The data itself remains in the app's local storage.
 */
export const hashPin = (pin: string) => {
  let h = 5381;
  for (const ch of `health-tracker:${pin}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
};

export function LockScreen({ pinHash, onUnlock }: { pinHash: string; onUnlock: () => void }) {
  const t = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const press = (k: string) => {
    setError(false);
    if (k === '⌫') return setPin((p) => p.slice(0, -1));
    const next = (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      if (hashPin(next) === pinHash) onUnlock();
      else {
        setError(true);
        setTimeout(() => setPin(''), 300);
      }
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 44 }}>🔒</Text>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', marginTop: 8 }}>Enter PIN</Text>
      <View style={{ flexDirection: 'row', gap: 14, marginVertical: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: i < pin.length ? (error ? t.danger : t.primary) : t.border }} />
        ))}
      </View>
      <View style={{ width: 260, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k ? (
            <Pressable
              key={i}
              onPress={() => press(k)}
              style={({ pressed }) => ({ width: 74, height: 74, borderRadius: 37, backgroundColor: pressed ? t.primarySoft : t.card, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' })}
            >
              <Text style={{ color: t.text, fontSize: 26, fontWeight: '600' }}>{k}</Text>
            </Pressable>
          ) : (
            <View key={i} style={{ width: 74, height: 74 }} />
          ),
        )}
      </View>
      {error && <Text style={{ color: t.danger, marginTop: 16 }}>Wrong PIN</Text>}
    </View>
  );
}
