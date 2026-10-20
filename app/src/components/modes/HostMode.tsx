import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Empty, Field, Label, Screen } from '@/components/ui';
import { Tag } from '@/components/Tag';
import { colors } from '@/theme';
import { useT } from '@/components/Settings';

// 主辦版:公開給賓客看,只有自我介紹、特色、穿搭、社交帳號,沒有胖瘦與任何私人評價。
// 標記碼:Z01 聚會名稱 / Z02 賓客暱稱 / Z03 特色 / Z04 社交帳號 / Z05 加入賓客 / Z06 穿搭照片(之後)
// 目前只做畫面:資料不存。穿搭欄位先留空位,之後做成上傳照片;篩選先空著。
type Guest = { name: string; trait: string; social: string };

export function HostMode() {
  const t = useT();
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [trait, setTrait] = useState('');
  const [social, setSocial] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);

  const add = () => {
    if (!name.trim()) return;
    setGuests([{ name: name.trim(), trait: trait.trim(), social: social.trim() }, ...guests]);
    setName('');
    setTrait('');
    setSocial('');
  };

  return (
    <Screen>
      <Card>
        <Label>{t('聚會')}</Label>
        <Field code="Z01" placeholder={t('聚會名稱(例如:小美婚禮)')} value={title} onChangeText={setTitle} style={{ paddingVertical: 8 }} />
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
          {t('這一頁是公開的:賓客只會看到自我介紹、特色、穿搭和社交帳號,不會有胖瘦、好感度或任何私人評價。')}
        </Text>
      </Card>

      <Card style={{ marginTop: 8 }}>
        <Label>{t('加入賓客')}</Label>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Field code="Z02" placeholder={t('暱稱')} value={name} onChangeText={setName} style={{ paddingVertical: 7, fontSize: 14 }} />
          </View>
          <View style={{ width: 70, height: 70, marginLeft: 8, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>{t('穿搭照片\n(之後)')}</Text>
            <Tag code="Z06" />
          </View>
        </View>
        <Field code="Z03" placeholder={t('特色(一句話自我介紹)')} value={trait} onChangeText={setTrait} style={{ paddingVertical: 7, fontSize: 14 }} />
        <Field code="Z04" placeholder={t('社交帳號(IG、微信…)')} value={social} onChangeText={setSocial} style={{ paddingVertical: 7, fontSize: 14 }} />
        <Button title={t('加入')} onPress={add} code="Z05" />
      </Card>

      {guests.length === 0 ? (
        <Empty text={t('還沒有賓客。\n加入後,這裡會像名牌一樣列出每個人。')} />
      ) : (
        guests.map((g, i) => (
          <Card key={i} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>{g.name}</Text>
            {g.trait ? <Text style={{ color: colors.ink, fontSize: 14, marginTop: 2 }}>{g.trait}</Text> : null}
            {g.social ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{g.social}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
