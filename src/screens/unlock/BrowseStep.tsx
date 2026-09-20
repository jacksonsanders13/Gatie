import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { Button, Screen } from '../../components/ui';
import type { BlockableApp } from '../../services/blocking';
import { UNLOCK_WINDOWS } from '../../state/actions';
import { isFilled } from '../../state/selectors';
import { colors, type } from '../../theme';
import { Field, inputStyles, LockedHeader } from './shared';

type Props = {
  app: BlockableApp;
  onUnlock: (note: string) => void;
  onBack: () => void;
};

export default function BrowseStep({ app, onUnlock, onBack }: Props) {
  const [note, setNote] = useState('');

  return (
    <Screen
      footer={
        <>
          <Button
            label={`Open for ${UNLOCK_WINDOWS.browsing} min`}
            onPress={() => onUnlock(note)}
            disabled={!isFilled(note)}
          />
          <Button label="Back" variant="ghost" onPress={onBack} />
        </>
      }
    >
      <LockedHeader app={app} subtitle="Browsing is fine. Say what for, so future you can check." />
      <Field label="What are you looking for?">
        <TextInput
          style={inputStyles.input}
          value={note}
          onChangeText={setNote}
          autoFocus
          placeholder="e.g. nothing really, just bored"
          placeholderTextColor={colors.disabled}
        />
      </Field>
      <Text style={type.caption}>
        It locks again after {UNLOCK_WINDOWS.browsing} minutes, even mid-scroll. Next time, Gatie asks whether you
        bought anything.
      </Text>
    </Screen>
  );
}
