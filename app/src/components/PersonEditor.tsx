import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { type PersonDraft } from '@/db';
import {
  AGE_MAX_YEARS,
  AGE_MIN_YEARS,
  AGE_STAGES,
  BUILD_LABELS,
  buildIndex,
  buildToValue,
  clothColor,
  DEFAULT_OUTFIT,
  FIGURE_LABELS,
  FIGURE_STEPS,
  COLOR_STEPS,
  colorName,
  FEMALE_OUTFIT,
  GENDER_STEPS,
  HAIR_COLORS,
  heightCm,
  heightRange,
  heightToT,
  hueTrack,
  isFemale,
  lerpHex,
  HAIR_STYLES,
  stageToYears,
  yearsToStage,
  MALE_OUTFIT,
  ROUGH_HEIGHT,
  roughIndex,
  roughToT,
  SHOW_HAIR_COLOR,
  skinPalette,
} from '@/lib/capture';
import { scoreColor, scoreLabel, scoreStars } from '@/lib/score';
import { Stars } from './Stars';
import { DEFAULT_VERSION, VERSIONS, VISIBLE_HOOKS } from '@/lib/versions';
import { colors } from '@/theme';
import { code, Field } from './ui';
import { Tag } from './Tag';
import { HookBadges } from './HookBadges';
import { DEFAULT_FACE, FaceAvatar, parseFace, type FaceConfig } from './Face';
import { HeatDisc } from './HeatDisc';
import { SpectrumSlider } from './SpectrumSlider';
import { useSettings, useT } from './Settings';

function splitHook(hook: string): string[] {
  return hook
    .split(/[,,、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toggleHook(hook: string, word: string): string {
  const parts = splitHook(hook);
  return (parts.includes(word) ? parts.filter((p) => p !== word) : [...parts, word]).join('、');
}

/** 緊湊的選項按鈕。 */
function MiniChip({
  label,
  selected,
  onPress,
  tag,
  hold,
  icon,
}: {
  icon?: string; // 標籤的小圖標
  label: string;
  selected?: boolean;
  onPress: () => void;
  tag: string;
  hold?: (on: boolean) => void; // 按住不放時顯示人物
}) {
  const tt = useT();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => hold?.(true)}
      onPressOut={() => hold?.(false)}
      style={{
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.line,
        backgroundColor: selected ? colors.primary : '#fff',
        marginRight: 5,
        marginBottom: 5,
      }}
    >
      <Text style={{ fontSize: 12, color: selected ? '#fff' : colors.ink }}>{icon ? `${icon} ${tt(label)}` : tt(label)}</Text>
      <Tag code={tag} />
    </Pressable>
  );
}

/** 一列:左邊標籤(含目前的值),右邊撐滿的控制項。滑桿一律放在這個寬的位置。 */
function Row2({
  label,
  value,
  children,
  right,
}: {
  label: string;
  value?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  const tt = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 38 }}>
      <View style={{ width: 58 }}>
        <Text style={{ fontSize: 11, color: colors.muted }}>{tt(label)}</Text>
        {value ? <Text style={{ fontSize: 12, color: colors.ink }}>{tt(value)}</Text> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      {right}
    </View>
  );
}

const GENDER_TRACK = Array.from({ length: GENDER_STEPS }, (_, i) =>
  lerpHex('#60A5FA', '#F472B6', i / (GENDER_STEPS - 1)),
);

/**
 * 快速記錄編輯器。由上到下:性別 → 模式與重要度 →(圓盤)→ 服裝 → 身高 → 體型 → 上衣 → 下身 → 髮型 → 膚色 → 年紀 → 髮色 → 鉤子 → 名字。
 * 按住任何外觀控制項時,人物蓋滿畫面,只剩正在動的那個放大放在下面(單選的按住不放就顯示人物)。
 *
 * 標記碼:
 *   P01 性別 / P02 捏臉 / P03 圓盤 / P04 重要度星星
 *   P05–P07 服裝 / P08 身高精度 / P09 身高 −1 / P10 身高滑桿 / P11 身高 +1 / P12 體型
 *   P13 上衣色(上下拖 = 亮暗)/ P17 下身色(上下拖 = 亮暗)
 *   P21–P25 髮型 / P26 膚色 / P27 年紀 / P28 髮色
 *   P29–P36 記憶鉤子標籤 / P37 新增標籤 / P38 新標籤輸入 / P39 名字
 *   P40 小記 / P41 圓盤(熟悉度 × 重要度)/ P42 圓盤(身高 × 體型)
 *   P43 身材 / P44 年紀精度(粗略 / 歲數)/ P45 年紀 −1 / P46 年紀 +1(P27 是年紀滑桿)
 */
export function PersonEditor({
  value,
  onChange,
  onActiveChange,
  scoreSlot,
  hideClothColor,
}: {
  value: PersonDraft;
  onChange: (p: PersonDraft) => void;
  onActiveChange?: (active: boolean) => void; // 拖動中:外層鎖住頁面捲動
  hideClothColor?: boolean; // 約會版不需要上衣 / 下身顏色(P13 / P17)
  scoreSlot?: ReactNode; // 有的話取代名字旁的星星(約會版用自己的好感度控制)
}) {
  const win = useWindowDimensions();
  const t = useT();
  const { version, style } = useSettings();
  const hookList = VERSIONS[version ?? DEFAULT_VERSION].hooks;

  const [mode, setMode] = useState<'face' | 'disc'>('face');
  const [precise, setPrecise] = useState(false);
  const [preciseAge, setPreciseAge] = useState(false);
  const [tags, setTags] = useState(() => hookList.slice(0, VISIBLE_HOOKS));
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const act = (key: string) => (on: boolean) => {
    setActive(on ? key : null);
    onActiveChange?.(on);
  };

  // 在設定頁換了版本,標籤清單跟著換
  useEffect(() => {
    setTags(hookList.slice(0, VISIBLE_HOOKS));
  }, [hookList]);

  const face = parseFace(value.face) ?? DEFAULT_FACE;
  const female = isFemale(face.gender);
  const skins = skinPalette();
  const setFace = (patch: Partial<FaceConfig>) =>
    onChange({ ...value, face: JSON.stringify({ ...face, ...patch }) });

  const setGender = (g: number) => {
    // 跨過中線,髮型與服裝的選項整組不同,改回該側的預設
    if (isFemale(g) !== female) setFace({ gender: g, outfit: isFemale(g) ? DEFAULT_OUTFIT.female : DEFAULT_OUTFIT.male });
    else setFace({ gender: g });
  };

  // 身高
  const [lo, hi] = heightRange(face.gender);
  const cm = heightCm(face.gender, value.height);
  const heightLabel = precise ? t('{0} 公分', cm) : t(ROUGH_HEIGHT[roughIndex(value.height)]);
  const years = face.years ?? stageToYears(face.age);
  const setYears = (y: number) => setFace({ years: y, age: yearsToStage(y) });
  const nudgeAge = (d: number) => setYears(Math.min(AGE_MAX_YEARS, Math.max(AGE_MIN_YEARS, years + d)));
  const nudge = (d: number) =>
    onChange({ ...value, height: heightToT(face.gender, Math.min(hi, Math.max(lo, cm + d))) });

  // 記憶鉤子:預設清單加上這個人已經有的字
  const hookWords = splitHook(value.hook);
  const shownTags = [...tags, ...hookWords.filter((w) => !tags.includes(w))];
  const addTag = () => {
    const tag = newTag.trim();
    if (tag) {
      if (!tags.includes(tag)) setTags([...tags, tag]);
      if (!hookWords.includes(tag)) onChange({ ...value, hook: toggleHook(value.hook, tag) });
    }
    setNewTag('');
    setAdding(false);
  };


  const outfits = female ? FEMALE_OUTFIT : MALE_OUTFIT;
  const lock = (on: boolean) => onActiveChange?.(on); // 只鎖捲動,不顯示人物
  const glasses = hookWords.includes('眼鏡');
  const discSize = Math.min(168, (win.width - 48) / 2);
  const faceSize = Math.min(win.width * 0.92, win.height * 0.52);

  const slider = (
    steps: number,
    v: number,
    set: (i: number) => void,
    h?: number,
    track?: string[],
    extra?: { code?: string; key?: string; vertical?: (d: 0 | 1) => void },
  ) => (
    <SpectrumSlider
      steps={steps}
      value={v}
      onChange={set}
      colors={track}
      height={h}
      code={extra?.code}
      onActive={extra?.key ? act(extra.key) : undefined}
      onVertical={extra?.vertical}
    />
  );

  const heightSteps = precise ? hi - lo + 1 : ROUGH_HEIGHT.length;
  const heightVal = precise ? cm - lo : roughIndex(value.height);
  const setHeightIdx = (i: number) =>
    onChange({ ...value, height: precise ? heightToT(face.gender, lo + i) : roughToT(i) });

  const discA = (size: number, tag?: string, key?: string) => (
    <HeatDisc
      size={size}
      x={value.familiarity}
      y={value.stars / 10}
      onChange={(x, y) => onChange({ ...value, familiarity: x, stars: Math.round(y * 10) })}
      onActive={lock}
      xLabel={t('熟悉度')}
      yLabel={t('重要度')}
      code={tag}
    />
  );
  const discB = (size: number, tag?: string, key?: string) => (
    <HeatDisc
      size={size}
      x={value.height}
      y={value.build}
      onChange={(x, y) => onChange({ ...value, height: x, build: y })}
      onActive={key ? act(key) : undefined}
      xLabel={t('身高')}
      yLabel={t('體型')}
      code={tag}
    />
  );

  // 按住時蓋在最上面的放大版(只看、不接觸控,手指仍在原本的控制項上)
  const tc = (name: string) => name.split('・').map((x) => t(x)).join('・');
  const info = (key: string): string => {
    switch (key) {
      case 'gender': return `${t('性別')} ${face.gender + 1} / ${GENDER_STEPS}`;
      case 'height': return `${t('身高')} ${heightLabel}`;
      case 'build': return `${t('體型')} ${t(BUILD_LABELS[buildIndex(value.build)])}`;
      case 'topHue': return `${t('上衣')} ${tc(colorName(face.topHue, face.topLight))}${t('(上下拖 = 亮暗)')}`;
      case 'botHue': return `${t('下身')} ${tc(colorName(face.botHue, face.botLight))}${t('(上下拖 = 亮暗)')}`;
      case 'skin': return `${t('膚色')} ${face.skin + 1} / ${skins.length}`;
      case 'age': return `${t('年紀')} ${preciseAge ? t('{0} 歲', years) : t(AGE_STAGES[face.age] ?? '')}`;
      case 'hairColor': return `${t('髮色')} ${face.hairColor + 1} / ${HAIR_COLORS.length}`;
      case 'discB': return `${t('身高')} ${heightLabel}・${t('體型')} ${t(BUILD_LABELS[buildIndex(value.build)])}`;
      case 'outfit': return `${t('服裝')} ${t(outfits[face.outfit] ?? '')}`;
      case 'figure': return `${female ? t('曲線') : t('肌肉')} ${t(FIGURE_LABELS[face.figure ?? 0])}`;
      case 'hairStyle': return `${t('髮型')} ${t(HAIR_STYLES[face.hair] ?? '')}`;
      default: return '';
    }
  };

  const mirror = (key: string): ReactNode => {
    switch (key) {
      case 'gender': return slider(GENDER_STEPS, face.gender, setGender, 48, GENDER_TRACK);
      case 'height': return slider(heightSteps, heightVal, setHeightIdx, 48);
      case 'build': return slider(BUILD_LABELS.length, buildIndex(value.build), () => {}, 48);
      case 'topHue': return slider(COLOR_STEPS, face.topHue, () => {}, 48, hueTrack(face.topLight));
      case 'botHue': return slider(COLOR_STEPS, face.botHue, () => {}, 48, hueTrack(face.botLight));
      case 'skin': return slider(skins.length, face.skin, () => {}, 48, skins);
      case 'age': return preciseAge ? slider(AGE_MAX_YEARS - AGE_MIN_YEARS + 1, years - AGE_MIN_YEARS, () => {}, 48) : slider(AGE_STAGES.length, face.age, () => {}, 48);
      case 'outfit': return slider(outfits.length, face.outfit, () => {}, 48);
      case 'figure': return slider(FIGURE_STEPS, face.figure ?? 0, () => {}, 48);
      case 'hairStyle': return slider(HAIR_STYLES.length, face.hair, () => {}, 48);
      case 'hairColor': return slider(HAIR_COLORS.length, face.hairColor, () => {}, 48, HAIR_COLORS);
      case 'discB': return discB(Math.min(260, win.width * 0.7));
      default: return null;
    }
  };

  return (
    <View
      // 保險:任何手指離開畫面就解除鎖定,避免頁面卡在不能捲動
      onTouchEnd={() => active !== null && act(active)(false)}
      onTouchCancel={() => active !== null && act(active)(false)}
    >
      {/* 模式 + 重要度 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 4 }}>
        {(
          [
            ['face', '捏臉', 'P02'],
            ['disc', '圓盤', 'P03'],
          ] as const
        ).map(([m, label, tag]) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={{
              flex: 1,
              marginHorizontal: 4,
              paddingVertical: 11,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: mode === m ? colors.primary : colors.line,
              backgroundColor: mode === m ? colors.primary : '#fff',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: mode === m ? '#fff' : colors.ink }}>{t(label)}</Text>
            <Tag code={tag} />
          </Pressable>
        ))}
      </View>

      {/* 性別(滑桿) */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#60A5FA' }}>♂</Text>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          {slider(GENDER_STEPS, face.gender, setGender, undefined, GENDER_TRACK, { code: 'P01', key: 'gender' })}
        </View>
        <Text style={{ fontSize: 18, color: '#F472B6' }}>♀</Text>
      </View>

      {/* 圓盤模式:左 = 熟悉度 × 重要度,右 = 身高 × 體型 */}
      {mode === 'disc' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 }}>
          {discA(discSize, 'P41')}
          {discB(discSize, 'P42', 'discB')}
        </View>
      )}

      {/* 服裝:往右 = 汗衫 / 小可愛 → … → Casual → 正裝(女生最右邊是禮服) */}
      <Row2 label="服裝" value={outfits[face.outfit] ?? ''}>
        {slider(outfits.length, face.outfit, (i) => setFace({ outfit: i }), undefined, undefined, { code: 'P05', key: 'outfit' })}
      </Row2>

      {/* 身高 / 體型:圓盤模式已經有圓盤取代 */}
      {mode === 'face' && (
      <>
      <Row2
        label="身高"
        value={heightLabel}
        right={
          <View style={{ marginLeft: 6 }}>
            <MiniChip label={precise ? '公分' : '粗略'} selected={precise} onPress={() => setPrecise(!precise)} tag="P08" />
          </View>
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {precise && (
            <Pressable onPress={() => nudge(-1)} style={{ paddingRight: 8 }}>
              <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
              <Tag code="P09" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            {slider(heightSteps, heightVal, setHeightIdx, undefined, undefined, { code: 'P10', key: 'height' })}
          </View>
          {precise && (
            <Pressable onPress={() => nudge(1)} style={{ paddingLeft: 8 }}>
              <Text style={{ fontSize: 22, color: colors.primary }}>›</Text>
              <Tag code="P11" />
            </Pressable>
          )}
        </View>
      </Row2>

      {/* 體型 */}
      <Row2 label="體型" value={BUILD_LABELS[buildIndex(value.build)]}>
        {slider(BUILD_LABELS.length, buildIndex(value.build), (i) => onChange({ ...value, build: buildToValue(i) }), undefined, undefined, { code: 'P12', key: 'build' })}
      </Row2>

      </>
      )}

      {/* 身材:男女各一條,0 = 一般,往上越明顯 */}
      <Row2 label={female ? '曲線' : '肌肉'} value={FIGURE_LABELS[face.figure ?? 0]}>
        {slider(FIGURE_STEPS, face.figure ?? 0, (i) => setFace({ figure: i }), undefined, undefined, { code: 'P43', key: 'figure' })}
      </Row2>

      {!hideClothColor && (
        <>
      {/* 上衣:左右選顏色,按住往上拖 = 亮、往下拖 = 暗 */}
      <Row2 label="上衣" value={face.topLight ? '亮 ↑' : '暗 ↓'}>
        {slider(COLOR_STEPS, face.topHue, (i) => setFace({ topHue: i }), undefined, hueTrack(face.topLight), {
          code: 'P13',
          key: 'topHue',
          vertical: (d) => setFace({ topLight: d }),
        })}
      </Row2>

      {/* 下身 */}
      <Row2 label="下身" value={face.botLight ? '亮 ↑' : '暗 ↓'}>
        {slider(COLOR_STEPS, face.botHue, (i) => setFace({ botHue: i }), undefined, hueTrack(face.botLight), {
          code: 'P17',
          key: 'botHue',
          vertical: (d) => setFace({ botLight: d }),
        })}
      </Row2>

        </>
      )}

      {/* 髮型:光頭 → 長髮 */}
      <Row2 label="髮型" value={HAIR_STYLES[face.hair] ?? ''}>
        {slider(HAIR_STYLES.length, face.hair, (i) => setFace({ hair: i }), undefined, undefined, { code: 'P21', key: 'hairStyle' })}
      </Row2>

      {/* 膚色(多半差不多,放後面) */}
      <Row2 label="膚色">
        {slider(skins.length, face.skin, (i) => setFace({ skin: i }), undefined, skins, { code: 'P26', key: 'skin' })}
      </Row2>

      {/* 年紀:粗略 = 6 個階段;進階 = 直接選歲數(和身高一樣可切換) */}
      <Row2
        label="年紀"
        value={preciseAge ? t('{0} 歲', years) : (AGE_STAGES[face.age] ?? '')}
        right={
          <View style={{ marginLeft: 6 }}>
            <MiniChip
              label={preciseAge ? '歲數' : '粗略'}
              selected={preciseAge}
              onPress={() => {
                if (!preciseAge) setFace({ years: stageToYears(face.age) });
                setPreciseAge(!preciseAge);
              }}
              tag="P44"
            />
          </View>
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {preciseAge && (
            <Pressable onPress={() => nudgeAge(-1)} style={{ paddingRight: 8 }}>
              <Text style={{ fontSize: 22, color: colors.primary }}>‹</Text>
              <Tag code="P45" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            {preciseAge
              ? slider(AGE_MAX_YEARS - AGE_MIN_YEARS + 1, years - AGE_MIN_YEARS, (i) => setYears(i + AGE_MIN_YEARS), undefined, undefined, { code: 'P27', key: 'age' })
              : slider(AGE_STAGES.length, face.age, (i) => setFace({ age: i, years: undefined }), undefined, undefined, { code: 'P27', key: 'age' })}
          </View>
          {preciseAge && (
            <Pressable onPress={() => nudgeAge(1)} style={{ paddingLeft: 8 }}>
              <Text style={{ fontSize: 22, color: colors.primary }}>›</Text>
              <Tag code="P46" />
            </Pressable>
          )}
        </View>
      </Row2>

      {/* 髮色:先關閉,用預設髮色 */}
      {SHOW_HAIR_COLOR && (
        <Row2 label="髮色">
          {slider(HAIR_COLORS.length, face.hairColor, (i) => setFace({ hairColor: i }), undefined, HAIR_COLORS, { code: 'P28', key: 'hairColor' })}
        </Row2>
      )}

      {/* 記憶鉤子 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
        {shownTags.map((w, i) => (
          <MiniChip
            key={w}
            label={w}
            selected={hookWords.includes(w)}
            onPress={() => onChange({ ...value, hook: toggleHook(value.hook, w) })}
            tag={code('P', 29 + Math.min(i, 7))}
          />
        ))}
        {adding ? (
          <View style={{ width: 110 }}>
            <Field
              code="P38"
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={addTag}
              onBlur={() => setAdding(false)}
              autoFocus
              placeholder={t('新標籤')}
              style={{ paddingVertical: 4, fontSize: 13 }}
            />
          </View>
        ) : (
          <MiniChip label="＋" onPress={() => setAdding(true)} tag="P37" />
        )}
      </View>

      {/* 名字 + 小記 */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Field
            code="P39"
            value={value.name}
            onChangeText={(v) => onChange({ ...value, name: v })}
            placeholder={t('名字(選填)')}
            style={{ paddingVertical: 8 }}
          />
        </View>
        {scoreSlot ?? (
          <View style={{ marginLeft: 8, marginBottom: 10, alignItems: 'center' }}>
            <Stars value={value.stars} size={22} onChange={(v) => onChange({ ...value, stars: v })} code="P04" />
            <Text style={{ fontSize: 10, color: scoreColor(value.stars) }}>{t(scoreLabel(value.stars))}</Text>
          </View>
        )}
      </View>
      <Field
        code="P40"
        value={value.note}
        onChangeText={(v) => onChange({ ...value, note: v })}
        placeholder={t('小記(例如:戴眼鏡、聊過登山)')}
        style={{ paddingVertical: 6, fontSize: 14 }}
      />

      {/* 按住任何外觀控制項:人物蓋滿畫面,只剩正在動的那個放大放在下面 */}
      {active !== null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: -16,
            right: -16,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>{info(active)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FaceAvatar face={face} size={faceSize} build={value.build} height={value.height} style={style} glasses={glasses} />
            <HookBadges hook={value.hook} size={28} />
          </View>
          <View style={{ alignSelf: 'stretch', alignItems: 'center' }}>{mirror(active)}</View>
        </View>
      )}
    </View>
  );
}
