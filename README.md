# 🤖 Instagram Bot - Vercel'da Deploy

Instagram DM va kommentlarga avtomatik javob beruvchi bot.

## ✨ Imkoniyatlar

- ✅ DM'ga "+" yozsa - avtomatik ma'lumot yuboradi
- ✅ Postga "+" komment yozsa - kommentga javob + private DM
- ✅ Salomlashuvga javob
- ✅ Kalit so'zlar bo'yicha turli javoblar

## 📦 Tezkor boshlash (5 daqiqa)

### 1. GitHub'ga yuklash

```bash
# Loyiha papkasiga kiring
cd instagram-bot

# Git boshlash
git init
git add .
git commit -m "Initial commit"

# GitHub'da yangi repo yarating (https://github.com/new)
# Repo nomi: instagram-bot (yoki istalgan nom)
# Private bo'lsin tavsiya etiladi!

# GitHub'ga ulash
git remote add origin https://github.com/USERNAME/instagram-bot.git
git branch -M main
git push -u origin main
```

### 2. Vercel'ga deploy

1. https://vercel.com ga kiring (GitHub bilan login qiling)
2. **"Add New" → "Project"** bosing
3. GitHub repo'ngizni tanlang (instagram-bot)
4. **"Import"** bosing
5. **Environment Variables** bo'limini oching va quyidagilarni qo'shing:

```
APP_SECRET = (Meta App settings > Basic > App secret)
VERIFY_TOKEN = (o'zingiz tanlagan maxfiy matn)
PAGE_ACCESS_TOKEN = (Meta Use case > Generate access token dan)
IG_USER_ID = 17841447132285232
```

6. **"Deploy"** bosing
7. 1-2 daqiqa kuting

Tugagandan keyin sizga URL beradi, masalan: `https://instagram-bot-xyz.vercel.app`

### 3. Webhook URL'ni Meta'ga ulash

Vercel sizga URL bergandan keyin:

1. **https://your-app.vercel.app** ga kirib tekshiring - bot ishlayotgan bo'lishi kerak
2. **Webhook URL:** `https://your-app.vercel.app/api/webhook`

### 4. Meta'da webhook sozlash

1. **developers.facebook.com** > Bot_Uchqun app
2. **Use cases** > **Manage messaging & content on Instagram**
3. **3. Configure webhooks** bo'limini oching
4. **"Edit"** yoki **"Configure"** bosing
5. To'ldiring:
   - **Callback URL:** `https://your-app.vercel.app/api/webhook`
   - **Verify token:** (siz Vercel'da yozgan VERIFY_TOKEN)
6. **"Verify and Save"** bosing

Agar yashil ✅ paydo bo'lsa - hammasi to'g'ri ishlayapti!

### 5. Webhook fields'larga obuna bo'lish

Webhook tasdiqlangandan keyin, quyidagi field'larga obuna bo'ling:
- ✅ `messages` - DM xabarlari
- ✅ `comments` - kommentlar
- ✅ `message_reactions` (ixtiyoriy)

## 🧪 Test qilish

1. **Tester** akkauntdan o'zingizning Instagram'ingizga DM yozing
2. "+" yoki "malumot" yozing
3. Bot avtomatik javob berishi kerak

Vercel'da loglarni ko'rish uchun: Dashboard > Project > **Functions** > **Logs**

## ⚠️ Eslatmalar

**Hozir App "Development" rejimida** - faqat siz qo'shgan **testerlar** bilan ishlaydi. Hammaga ochish uchun:

1. App Review'dan o'tish kerak (Meta tekshiradi)
2. **5. Complete app review** bo'limidan boshlanadi
3. 1-2 hafta vaqt oladi

## 🔄 Kodni yangilash

```bash
# O'zgartirishlardan keyin
git add .
git commit -m "Update bot logic"
git push

# Vercel avtomatik qayta deploy qiladi
```

## 🛠 Lokal test (ixtiyoriy)

```bash
npm install
npm install -g vercel
vercel dev
```

`.env` faylini yarating va to'ldiring.

## 📁 Loyiha tuzilishi

```
instagram-bot/
├── api/
│   ├── webhook.js    # Asosiy bot logikasi
│   └── index.js      # Bosh sahifa
├── .env.example      # Namuna .env
├── .gitignore        # Git'ga yuklanmaydigan
├── package.json      # Kutubxonalar
├── vercel.json       # Vercel sozlamalari
└── README.md         # Bu fayl
```

## 🎯 Kalit so'zlarni o'zgartirish

`api/webhook.js` faylida `handleDirectMessage` va `handleComment` funksiyalarini tahrirlang:

```javascript
if (messageText === '+' || messageText.includes('malumot')) {
  replyText = `Sizning matningiz bu yerga`;
}
```

## 🔐 Xavfsizlik

- ❌ `.env` faylini **GitHub'ga yuklamang**
- ❌ Tokenlarni **hech kimga ko'rsatmang**
- ✅ `.gitignore` to'g'ri sozlangan
- ✅ Signature tekshirish yoqilgan

## 🆘 Muammolar

**Webhook tasdiqlanmadi**
- VERIFY_TOKEN to'g'ri yozilganmi tekshiring (Vercel va Meta'da bir xil)

**Bot javob bermayapti**
- Vercel Functions Logs ni tekshiring
- PAGE_ACCESS_TOKEN amal qilish muddati tugamaganmi?
- Tester sifatida qo'shilganmi?

**500 xato**
- Environment variables to'liq to'ldirilganmi?
- IG_USER_ID to'g'rimi?
