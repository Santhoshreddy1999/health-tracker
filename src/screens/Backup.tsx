import React, { useState } from 'react';
import { Platform, Share } from 'react-native';
import { Button, Card, confirmAsync, Field, H2, notify, Screen, Sub } from '../components/ui';
import { demoState } from '../demo';
import { useNav } from '../nav';
import { useStore } from '../store';
import { today } from '../utils';

export default function Backup() {
  const nav = useNav();
  const { exportJson, importJson } = useStore();
  const [text, setText] = useState('');

  const doExport = async () => {
    const json = exportJson();
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `health-backup-${today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      await Share.share({ message: json, title: `health-backup-${today()}.json` });
    }
  };

  const doImport = async () => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.profiles)) throw new Error('missing profiles');
      if (!(await confirmAsync('Replace all data?', 'This overwrites everything currently in the app.'))) return;
      importJson(text);
      setText('');
      notify('Backup restored.');
      nav.back();
    } catch {
      notify('That does not look like a valid backup.');
    }
  };

  return (
    <Screen title="Backup & restore" onBack={nav.back}>
      <Card>
        <H2>Export</H2>
        <Sub style={{ marginBottom: 12 }}>
          Saves every profile and log as a JSON file{Platform.OS === 'web' ? ' (downloads)' : ' (share sheet — save to Drive, email, WhatsApp to yourself…)'}.
        </Sub>
        <Button title="Export backup" onPress={doExport} />
      </Card>
      <Card>
        <H2>Restore</H2>
        <Field label="Paste backup JSON" value={text} onChangeText={setText} multiline numberOfLines={6} placeholder='{"version":1,...}' />
        <Button title="Restore from pasted text" variant="soft" onPress={doImport} />
      </Card>
      <Card>
        <H2>Sample data</H2>
        <Sub style={{ marginBottom: 12 }}>Replace everything with demo profiles to try the app.</Sub>
        <Button
          title="Load sample data"
          variant="danger"
          onPress={async () => {
            if (await confirmAsync('Replace all data with sample data?')) {
              importJson(JSON.stringify(demoState()));
              nav.back();
            }
          }}
        />
      </Card>
    </Screen>
  );
}
