# 要補的圖:給圖片模型的 prompt

盤點見 `docs/avatar-status.md`。使用方式:每次**附上對應風格的現有總表當風格參考圖**,再貼 prompt。
全部用英文,因為圖片模型對英文最穩。`[ ]` 內是要替換的地方。

## 共同規則(每個 prompt 開頭都貼這一段)

```
Use the attached image as the STRICT style reference. Keep exactly the same art style,
line weight, outline color, shading method, face style and body proportions as the reference.
Full-body, front view, standing straight, arms slightly away from the torso, feet shoulder-width apart,
facing the camera. Plain pure white background. No text except the small labels requested, no watermark,
no ground shadow, no props in the hands. Every character on the sheet must be drawn at the same
scale, with feet on the same baseline. Characters must be original (no existing franchise characters).
```

風格參考圖:美式 `Image/American girl.jpg`、日系 `Image/JP_ALL.jpg`、韓漫 `Image/KR_all.jpg`。

## 新規則:從 batch2 起,新圖一律「單一色塊」(2026-10-20)

在每個 prompt 的共同規則後面再加這一段:

```
FLAT COLOR ONLY: every area is ONE solid flat color. No gradients, no soft shading, no texture,
no fabric pattern, no highlights, no blur. Only a uniform dark outline. At most ONE slightly darker flat
tone per garment for a fold or shadow. Skin = one flat tone, hair = one flat tone (brown), each garment = one
flat tone. No prints, logos or patterns (party wear and dresses are also a single plain color).
```

batch1 的日系 / 韓漫圖有漸層與紋理,只能當**造型參考**,不能直接描成可換色的向量;要重出平塗版。

## 全部還缺的圖(平塗版)

一張表出一個風格 × 一個年紀的男女(男女並排,同比例、同基準線)。✓ = 已有可用的平塗素材。

| 風格 \ 年紀 | 0 <10 | 1 10–15 | 2 15–20 | 3 20–30 | 4 30–35 | 5 40–50 | 5b 65+ |
|---|---|---|---|---|---|---|---|
| **基準人物(單人高解析,男女)** 美式 | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| 日系 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| 韓漫 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **髮型表 5 款(男、女各一張)** 美式 | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| 日系 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| 韓漫 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **服裝表 6 套(男、女各一張)** 美式 | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| 日系 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| 韓漫 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

另外各風格要一次的:

| 項目 | 美式 | 日系 | 韓漫 |
|---|---|---|---|
| 身材 4 級(男肌肉、女曲線,20–30) | ✓ | ✗ | ✗ |
| 穿衣瘦 / 普通 / 胖(男女,20–30) | ✓(程式伸縮) | ✗ | ✗ |
| 眼鏡 | ✓ | ✗ | ✗ |

共 **基準人物 20 組、髮型表 40 張、服裝表 40 張**(以男女各一張算),加日系 / 韓漫的身材、體型、眼鏡 8 項。
量太大,建議先做:**美式 4 個年紀(0、1、2、4、5 共 5 組)→ 日系 / 韓漫 20–30 → 其他年紀**;
髮型與服裝表可以把男女併成一張(每張 10 個頭或 12 套衣服),張數就減半。

---

## A. 缺的年紀(最優先)

### A1. 日系 30–35 歲
```
[共同規則] Japanese Clear Anime style. Draw TWO characters side by side: one male and one female,
both aged 30 to 35, adults in their early thirties (slightly more mature face than a 20-year-old,
subtle laugh lines, no wrinkles). Casual-smart office-casual outfits. Label under the sheet:
"Japanese Clear Anime - Age 30-35". Same size and baseline as the 20-30 characters in the reference.
```

### A2. 韓漫 30–35 歲
```
[共同規則] Korean Webtoon style. Draw TWO characters side by side: one male and one female,
both aged 30 to 35, slender webtoon proportions, a slightly more mature face than a 20-year-old.
Smart-casual outfits (shirt, knit, trousers, simple coat). Label: "Korean Webtoon - Age 30-35".
```

### A3. 日系 40–50 歲(補 35–65)
```
[共同規則] Japanese Clear Anime style. TWO characters, male and female, both aged 40 to 50:
visible maturity, a few fine lines near the eyes and mouth, hair with a little grey.
Ordinary middle-aged everyday clothes. Label: "Japanese Clear Anime - Age 40-50".
```

### A4. 韓漫 40–50 歲
```
[共同規則] Korean Webtoon style. TWO characters, male and female, both aged 40 to 50:
elegant mature faces, a few fine lines, hair with a little grey, tidy everyday clothes.
Label: "Korean Webtoon - Age 40-50".
```

### A5. 日系 / 韓漫:把少年拆成 10–15 和 15–20
```
[共同規則] [Japanese Clear Anime | Korean Webtoon] style. Draw FOUR characters in two groups:
Group 1 "Age 10-15": a boy and a girl, early teens, shorter and slimmer than adults, childlike faces,
school-casual clothes. Group 2 "Age 15-20": a boy and a girl, older teens, almost adult height,
fashionable casual or school-uniform clothes. Labels under each group.
```

---

## B. 每個年紀的髮型與服裝(讓每個年紀都有 5 髮型 × 6 服裝)

App 的順序:髮型 = 光頭、寸頭、短髮、油頭、長髮;男服裝 = 汗衫、短短、短長、長長、Casual、正裝;
女服裝 = 小可愛、短褲、長長、Casual、正裝、禮服。

### B1. 髮型表(每個風格 × 每個年紀 × 男女各一張)
```
[共同規則] [STYLE] style, age group [AGE], [male | female].
A hair design sheet: the SAME head and face (neutral smile, no neck below the collarbone) shown 5 times
in a row with these hairstyles, in this exact order, each with a small label under it:
1 Bald, 2 Buzz cut, 3 Short hair, 4 Slicked-back hair, 5 Long hair.
Use one natural brown hair color on every head so the color can be changed later. Show ears.
```

### B2. 服裝表(每個風格 × 每個年紀 × 男女各一張)
```
[共同規則] [STYLE] style, age group [AGE], [male | female].
A clothing sheet: the SAME neutral base body (plain gray underwear) wearing 6 outfits in a row, in this
exact order, each labelled underneath:
Male: 1 Sleeveless undershirt + shorts, 2 T-shirt + shorts, 3 T-shirt + long trousers,
4 Long-sleeve shirt + long trousers, 5 Casual (rolled-sleeve shirt + cropped chinos), 6 Formal suit with tie.
Female: 1 Camisole + wide jeans, 2 T-shirt + denim shorts, 3 Hoodie + sweatpants,
4 Casual (blouse + wrap midi skirt), 5 Formal blazer + trousers, 6 Evening dress.
Single flat color per garment (so it can be recolored), keep the outline and shading style of the reference.
For children (age under 10 and 10-15) replace "Formal suit/blazer/evening dress" with a school uniform,
a party dress or a smart shirt, and say so in the label.
```

---

## C. 身材 4 級(日系、韓漫補;美式已有)

```
[共同規則] [Japanese Clear Anime | Korean Webtoon] style, age 20-30, [male | female].
Draw the SAME character 4 times in a row, same plain outfit (tank top + shorts), labelled:
"Standard", "Slightly [muscular | curvy]", "Clearly [muscular | curvy]", "Very [muscular | curvy]".
Male = increasing chest, shoulder and arm muscle. Female = increasing bust, narrower waist, wider hips.
Only the body changes; face, hair, height and outfit stay identical.
```

---

## D. 體型補圖

### D1. 韓漫:穿衣的瘦 / 普通 / 胖(現在只有內衣版)
```
[共同規則] Korean Webtoon style, age 20-30. Draw 6 characters: slim, average and heavy for male and
female, all wearing a plain white T-shirt and jeans (female: white T-shirt and a knee-length skirt).
Same faces and hair as the existing Korean underwear body sheet. Labels: Slim, Average, Heavy.
```

---

## E. 單人高解析度圖(描向量時最準)

總表裡每個人只有 250–500 像素高。描向量要細節時,請每個角色單獨出一張:
```
[共同規則] ONE character only, centered, filling the image height (head to feet), high resolution.
[STYLE], [AGE], [male | female], the exact same character and outfit as in the attached sheet.
```
優先順序:美式 5 個年紀 → 日系 / 韓漫 20–30 歲男女。

---

## 檢查清單(拿到圖之後我會檢查)

- 同一張表裡所有人物的比例、線條粗細、腳底基準線一致。
- 髮色是單一棕色(之後才能換色)、服裝是單色平塗(之後才能換色)。
- 沒有文字以外的雜物、沒有真人臉、沒有現有角色或品牌。
- 授權:請附上使用的模型與授權說明(見 `docs/avatar-spec.md` 第 6 節)。
