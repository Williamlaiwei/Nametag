import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { listPeople, setPersonScore, type Person } from '@/db';
import { FILTERS, scoreColor, scoreLabel } from '@/lib/score';
import { FaceAvatar, parseFace } from '@/components/Face';
import { Stars } from '@/components/Stars';
import { Tag } from '@/components/Tag';
import { Chip, code, Empty, Field, Row } from '@/components/ui';
import { colors } from '@/theme';
import { useT } from '@/components/Settings';

// 標記碼:B01 搜尋框、B02–B05 篩選(全部 / 3 星以上 / 4 星以上 / 還沒打分)、
//         B06 每一列(點進詳細頁)、B07 每一列上的星星(拖動打分)
export default function PeopleScreen() {
  const t = useT();
  const db = useSQLiteContext();
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [people, setPeople] = useState<Person[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listPeople(db, search, minScore).then((rows) => active && setPeople(rows));
      return () => {
        active = false;
      };
    }, [db, search, minScore]),
  );

  // 直接在列表上改分數:先更新畫面,再寫入資料庫;列表順序在下次進入畫面時重新排序,避免拖的時候整列跳走。
  const rate = (id: number, score: number) => {
    setPeople((list) => list.map((p) => (p.id === id ? { ...p, stars: score } : p)));
    setPersonScore(db, id, score);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Field code="B01" value={search} onChangeText={setSearch} placeholder={t('搜尋名字、記憶鉤子、介紹')} />
      <Row style={{ flexWrap: 'wrap' }}>
        {FILTERS.map((f, i) => (
          <Chip
            key={f.label}
            label={t(f.label)}
            selected={minScore === f.min}
            onPress={() => setMinScore(f.min)}
            code={code('B', 2 + i)}
          />
        ))}
      </Row>
      <FlatList
        data={people}
        keyExtractor={(p) => String(p.id)}
        ListEmptyComponent={
          <Empty text={search || minScore ? t('找不到符合的人') : t('還沒有記下任何人\n到「快速記錄」記下第一位吧')} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/person/${item.id}` as never)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <FaceAvatar face={parseFace(item.face)} size={64} build={item.build} height={item.height} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{item.name || t('(還不知道名字)')}</Text>
              <Text numberOfLines={1} style={{ color: colors.muted, marginTop: 2, marginBottom: 4 }}>
                {item.hook ? item.hook.split('、').map((w) => t(w)).join('、') : t('沒有記憶鉤子')}
              </Text>
              <Row>
                <Stars value={item.stars} size={22} onChange={(v) => rate(item.id, v)} code="B07" />
                <Text style={{ marginLeft: 8, fontSize: 12, color: scoreColor(item.stars) }}>{scoreLabel(item.stars)}</Text>
              </Row>
            </View>
            <Tag code="B06" />
          </Pressable>
        )}
      />
    </View>
  );
}
