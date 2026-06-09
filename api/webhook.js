import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Foydalanuvchilar bilan suhbat tarixini saqlash (xotira)
const conversationHistory = new Map();

export default async function handler(req, res) {
  if (req.method === "GET") {
    return verifyWebhook(req, res);
  }

  if (req.method === "POST") {
    return handleWebhook(req, res);
  }

  res.status(405).json({ error: "Method not allowed" });
}

// ✅ Webhook tasdiqlash
function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook tasdiqlandi");
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: "Forbidden" });
}

// 📩 Webhook xabarlarini qayta ishlash
async function handleWebhook(req, res) {
  // Signature tekshirish
  const signature = req.headers["x-hub-signature-256"];
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const body = req.body;

  if (body.object === "instagram") {
    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        await processMessage(event);
      }
    }
  }

  res.status(200).json({ status: "ok" });
}

// 🔐 Meta signature tekshirish
function verifySignature(body, signature) {
  if (!signature) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", process.env.APP_SECRET)
    .update(JSON.stringify(body))
    .digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// 💬 Xabarni qayta ishlash
async function processMessage(event) {
  const senderId = event.sender?.id;
  const messageText = event.message?.text;

  // Bot o'z xabarlarini e'tiborsiz qoldirsin
  if (senderId === process.env.IG_USER_ID) return;
  if (!messageText) return;

  console.log(`📨 ${senderId}: ${messageText}`);

  try {
    const reply = await getClaudeReply(senderId, messageText);
    await sendMessage(senderId, reply);
  } catch (err) {
    console.error("Xato:", err);
    await sendMessage(senderId, "Uzr, hozir texnik muammo bor. Biroz kutib qayta yozing.");
  }
}

// 🤖 Claude dan javob olish
async function getClaudeReply(userId, userMessage) {
  // Suhbat tarixini olish (yoki yangi boshlash)
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }

  const history = conversationHistory.get(userId);

  // Yangi xabarni tarixga qo'shish
  history.push({ role: "user", content: userMessage });

  // Tarix juda uzun bo'lsa, eskisini o'chirish (10 xabardan ko'p bo'lmasin)
  if (history.length > 20) {
    history.splice(0, 2);
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `Sen Vision Group Instagram akkauntining yordamchisisisan. 
Uchqun Turdiyev — performance marketing mutaxassisi va Vision Group asoschisinng nomidan muloqot qilasan.

Qoidalar:
- Doim o'zbek tilida javob ber
- Qisqa va aniq javob ber (2-4 gap)
- Do'stona va professional bo'l
- Performance Marketing kursi haqida so'rashsa: "5-oqim kursi haqida batafsil ma'lumot uchun: vision-group.uz/target-kursi"
- Target/Meta Ads xizmatlar haqida: "Xizmatlarimiz haqida: vision-group.uz/target"
- Narx yoki to'lov haqida so'rashsa: to'g'ridan-to'g'ri narx aytma, saytga yo'naldir
- Uchqun bilan bog'lanish kerak bo'lsa: "Uchqun bilan bevosita bog'lanish uchun DM yozing yoki @uchqun_turdiyev"`,
    messages: history,
  });

  const assistantReply = response.content[0].text;

  // Claude javobini tarixga qo'shish
  history.push({ role: "assistant", content: assistantReply });

  return assistantReply;
}

// 📤 Instagram orqali xabar yuborish
async function sendMessage(recipientId, text) {
  const url = `https://graph.facebook.com/v21.0/me/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAGE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Instagram API xato:", data);
    throw new Error(data.error?.message || "Xabar yuborilmadi");
  }

  console.log(`✅ Javob yuborildi: ${recipientId}`);
  return data;
}
