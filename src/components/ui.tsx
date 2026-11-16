import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

export const MAX_WIDTH = 640;

export function confirmAsync(title: string, message = ''): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export function notify(title: string, message = '') {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function Screen({
  title,
  subtitle,
  onBack,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} style={[styles.back, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={{ color: t.text, fontSize: 18 }}>‹</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          {subtitle ? <Text style={{ color: t.sub, marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base = [styles.card, { backgroundColor: t.card, borderColor: t.border }, style];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.8 }]}>
        {children}
      </Pressable>
    );
  return <View style={base}>{children}</View>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: any }) {
  const t = useTheme();
  return <Text style={[{ color: t.text, fontSize: 17, fontWeight: '700', marginBottom: 10 }, style]}>{children}</Text>;
}

export function Sub({ children, style }: { children: React.ReactNode; style?: any }) {
  const t = useTheme();
  return <Text style={[{ color: t.sub, fontSize: 13 }, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: any }) {
  const t = useTheme();
  return <Text style={[{ color: t.text, fontSize: 15 }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  color,
  small,
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  color?: string;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const t = useTheme();
  const c = color ?? t.primary;
  const bg = variant === 'primary' ? c : variant === 'soft' ? c + '22' : variant === 'danger' ? t.danger + '1A' : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? t.danger : c;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: t.border },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.sub, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[{ marginBottom: 12, flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 0 }, style]}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={t.sub + '99'}
        {...props}
        style={[styles.input, { color: t.text, backgroundColor: t.cardAlt, borderColor: t.border }]}
      />
    </View>
  );
}

export function Row({ children, style, gap = 10 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  color,
  multi,
}: {
  options: readonly T[] | { value: T; label: string }[];
  value: T | T[];
  onChange: (v: any) => void;
  color?: string;
  multi?: boolean;
}) {
  const t = useTheme();
  const c = color ?? t.primary;
  const opts = (options as any[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o)) as { value: T; label: string }[];
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {opts.map((o) => {
        const on = selected(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (multi && Array.isArray(value)) onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value]);
              else onChange(o.value);
            }}
            style={[styles.chip, { borderColor: on ? c : t.border, backgroundColor: on ? c + '22' : t.card }]}
          >
            <Text style={{ color: on ? c : t.text, fontWeight: on ? '700' : '500', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Ring({
  progress,
  size = 84,
  stroke = 9,
  color,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress || 0));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.cardAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Progress({ value, color }: { value: number; color: string }) {
  const t = useTheme();
  const p = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={{ height: 10, borderRadius: 6, backgroundColor: t.cardAlt, overflow: 'hidden' }}>
      <View style={{ width: `${p * 100}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
    </View>
  );
}

export function ListItem({
  title,
  subtitle,
  right,
  onDelete,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  onDelete?: () => void;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.item, { borderBottomColor: t.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
        {subtitle ? <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={{ color: t.text, fontWeight: '700', marginRight: onDelete ? 10 : 0 }}>{right}</Text> : null}
      {onDelete && (
        <Pressable
          hitSlop={10}
          onPress={async () => {
            if (await confirmAsync('Delete this entry?')) onDelete();
          }}
        >
          <Text style={{ color: t.sub, fontSize: 16 }}>✕</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  const t = useTheme();
  return <Text style={{ color: t.sub, textAlign: 'center', paddingVertical: 16 }}>{text}</Text>;
}

export function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: color ?? t.text, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function Toggle({ value, onChange, color }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{ width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: value ? c : t.cardAlt, borderWidth: 1, borderColor: t.border }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: value ? 20 : 0 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 8 },
  back: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  card: { borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1 },
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
