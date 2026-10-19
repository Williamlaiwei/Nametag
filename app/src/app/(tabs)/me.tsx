import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import QRCode from 'react-native-qrcode-svg';
import {
  ALL_KEYS,
  emptyIntro,
  encodeIntro,
  INTRO_GROUPS,
  INTRO_LABELS,
  toPublicIntro,
  type IntroKey,
  type MyIntro,
} from '@/lib/intro';
import { getDeviceCode, getMyIntro, getSetting, saveMyIntro, setSetting } from '@/db';
import { Tag, useTags } from '@/components/Tag';
import { Button, Card, code, Field, Label, Row, Screen, Toggle } from '@/components/ui';
import { colors } from '@/theme';

// QR 碼的容量有限,超過就提醒使用者少填幾個要分享的欄位。
const QR_BYTE_LIMIT = 2200;

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

// 標記碼:D01 掃描對方 / D02 選自拍
//   自我介紹 16 個欄位依序是:輸入框 D03、分享開關 D04;下一個欄位 D05、D06;依此類推到 D33、D34
//   (順序:暱稱、一句話、職業、公司或學校、正在做的事、興趣、最近迷什麼、想認識什麼樣的人、
//          星座、血型、最愛的食物、Instagram、LINE、Facebook、Threads、X)
//   D35 App 解鎖開關 / D36 顯示標記碼開關
export default function MeScreen() {
  const db = useSQLiteContext();
  const { show, setShow } = useTags();
  const [intro, setIntro] = useState<MyIntro>(emptyIntro);
  const [deviceCode, setDeviceCode] = useState('');
  const [lock, setLock] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      setIntro(await getMyIntro(db));
      setDeviceCode(await getDeviceCode(db));
      setLock((await getSetting(db, 'app_lock')) === '1');
      loaded.current = true;
    })();
  }, [db]);

  // 每次修改自動儲存,不需要按鈕。
  useEffect(() => {
    if (loaded.current) saveMyIntro(db, intro);
  }, [db, intro]);

  const setValue = useCallback((k: IntroKey, v: string) => {
    setIntro((i) => ({ ...i, values: { ...i.values, [k]: v } }));
  }, []);
  const setShared = useCallback((k: IntroKey, v: boolean) => {
    setIntro((i) => ({ ...i, shared: { ...i.shared, [k]: v } }));
  }, []);

  const pickSelfie = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!r.canceled) setIntro((i) => ({ ...i, selfieUri: r.assets[0].uri }));
  };

  const toggleLock = async (on: boolean) => {
    if (on) {
      const ok = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      if (!ok) {
        Alert.alert('無法開啟', '這支手機沒有設定螢幕鎖定、指紋或臉部辨識。');
        return;
      }
    }
    setLock(on);
    await setSetting(db, 'app_lock', on ? '1' : '0');
  };

  const payload = deviceCode ? encodeIntro(toPublicIntro(intro, deviceCode)) : '';
  const tooBig = byteLength(payload) > QR_BYTE_LIMIT;

  return (
    <Screen>
      <Card>
        <Label>我的 QR 碼(給對方掃,或主辦人掃)</Label>
        <View style={{ alignItems: 'center', padding: 12 }}>
          {payload && !tooBig ? (
            <QRCode value={payload} size={200} ecl="L" />
          ) : (
            <Text style={{ color: colors.danger, textAlign: 'center' }}>
              要分享的內容太多,QR 碼放不下。請關掉幾個欄位的分享開關。
            </Text>
          )}
        </View>
        <Button title="掃描對方的 QR 碼" onPress={() => router.push('/scan' as never)} code="D01" />
      </Card>

      <Card>
        <Label>自拍(只存在這支手機,目前不會放進 QR 碼)</Label>
        <Row>
          <Pressable onPress={pickSelfie}>
            {intro.selfieUri ? (
              <Image source={{ uri: intro.selfieUri }} style={{ width: 72, height: 72, borderRadius: 36 }} />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.primary }}>選照片</Text>
              </View>
            )}
            <Tag code="D02" />
          </Pressable>
        </Row>
      </Card>

      {INTRO_GROUPS.map((g) => (
        <Card key={g.title}>
          <Label>{g.title}</Label>
          {g.keys.map((k) => {
            const n = ALL_KEYS.indexOf(k);
            return (
              <Row key={k} style={{ marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    code={code('D', 3 + n * 2)}
                    placeholder={INTRO_LABELS[k]}
                    value={intro.values[k]}
                    onChangeText={(t) => setValue(k, t)}
                    autoCapitalize="none"
                  />
                </View>
                <Toggle
                  value={intro.shared[k]}
                  onValueChange={(v) => setShared(k, v)}
                  code={code('D', 4 + n * 2)}
                  style={{ marginLeft: 8, marginBottom: 10 }}
                />
              </Row>
            );
          })}
        </Card>
      ))}
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 16 }}>
        右邊的開關決定這一項會不會被別人看到。全部都可以留空,社交帳號預設關閉。
      </Text>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.ink, fontSize: 16 }}>開啟 App 時需要解鎖</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>手機被別人拿到時,看不到你給誰打了幾顆星</Text>
          </View>
          <Toggle value={lock} onValueChange={toggleLock} code="D35" />
        </Row>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.ink, fontSize: 16 }}>顯示標記碼</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>每個可以互動的東西角落的 3 碼小標籤,用來溝通要改哪裡</Text>
          </View>
          <Toggle value={show} onValueChange={setShow} code="D36" />
        </Row>
      </Card>
    </Screen>
  );
}
