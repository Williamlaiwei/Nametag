import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { deletePerson, getPerson, parseStoredIntro, updatePerson, type PersonDraft } from '@/db';
import { INTRO_LABELS, type IntroKey } from '@/lib/intro';
import { PersonEditor } from '@/components/PersonEditor';
import { Button, Card, Label, Screen } from '@/components/ui';
import { colors } from '@/theme';
import { useT } from '@/components/Settings';

export default function PersonScreen() {
  const t = useT();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState<PersonDraft | null>(null);

  useEffect(() => {
    getPerson(db, Number(id)).then((p) => {
      if (p) setDraft(p);
    });
  }, [db, id]);

  if (!draft) return <Screen>{null}</Screen>;
  const intro = parseStoredIntro(draft.introJson);

  const save = async () => {
    await updatePerson(db, Number(id), draft);
    router.back();
  };

  const remove = () =>
    Alert.alert(t('刪除這個人?'), t('私人筆記會一併刪除,無法復原。'), [
      { text: t('取消'), style: 'cancel' },
      {
        text: t('刪除'),
        style: 'destructive',
        onPress: async () => {
          await deletePerson(db, Number(id));
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: draft.name || t('認識的人') }} />
      {intro && (
        <Card>
          <Label>{t('對方分享的自我介紹')}</Label>
          {(Object.keys(intro.fields) as IntroKey[]).map((k) => (
            <Text key={k} style={{ color: colors.ink, marginTop: 4 }}>
              <Text style={{ color: colors.muted }}>{t(INTRO_LABELS[k])}:</Text>
              {intro.fields[k]}
            </Text>
          ))}
        </Card>
      )}
      <PersonEditor value={draft} onChange={setDraft} />
      <Button title={t('儲存')} onPress={save} style={{ marginBottom: 10 }} code="E01" />
      <Button title={t('刪除')} kind="danger" onPress={remove} code="E02" />
    </Screen>
  );
}
