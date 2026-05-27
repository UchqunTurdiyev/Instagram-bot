import axios from 'axios';
import crypto from 'crypto';

const {
  APP_SECRET,
  VERIFY_TOKEN,
  PAGE_ACCESS_TOKEN,
  IG_USER_ID,
} = process.env;

// Vercel'da raw body olish uchun
export const config = {
  api: {
    bodyParser: false,
  },
};

// Raw body'ni o'qish funksiyasi
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Asosiy handler
export default async function handler(req, res) {
  // ============================================
  // GET - Webhook verification
  // ============================================
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook tasdiqlandi');
      return res.status(200).send(challenge);
    }
    
    console.log('❌ Webhook tasdiqlanmadi');
    return res.status(403).send('Forbidden');
  }

  // ============================================
  // POST - Webhook events
  // ============================================
  if (req.method === 'POST') {
    const rawBody = await getRawBody(req);
    
    // Signature tekshirish
    if (!verifySignature(req, rawBody)) {
      console.log('❌ Signature noto\'g\'ri');
      return res.status(403).send('Invalid signature');
    }

    const body = JSON.parse(rawBody);

    // Tezkor javob (Instagram 20 soniya kutadi)
    res.status(200).send('EVENT_RECEIVED');

    // Eventlarni asynxron qayta ishlash
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        // DM xabarlari
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message && !event.message.is_echo) {
              await handleDirectMessage(event);
            }
          }
        }

        // Komment va boshqa changes
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              await handleComment(change.value);
            }
          }
        }
      }
    }
    
    return;
  }

  // Boshqa methodlar
  return res.status(405).send('Method not allowed');
}

// ============================================
// DM'ga javob berish
// ============================================
async function handleDirectMessage(event) {
  const senderId = event.sender.id;
  const messageText = event.message.text?.toLowerCase().trim() || '';

  console.log(`📩 DM keldi: "${messageText}" - ${senderId}`);

  let replyText;

  if (messageText === '+' || messageText.includes('malumot') || messageText.includes('ma\'lumot')) {
    replyText = `Salom! Ma'lumot uchun rahmat 🙏\n\nMana siz so'ragan ma'lumot:\n[bu yerga sizning ma'lumotingiz]`;
  } else if (messageText.includes('salom') || messageText.includes('assalom')) {
    replyText = `Vaalaykum assalom! Qanday yordam bera olaman?\n\n"+" yuboring - ma'lumot olish uchun`;
  } else {
    replyText = `Xabaringiz uchun rahmat! Tez orada javob beramiz.\n\nTezkor ma'lumot uchun "+" yuboring.`;
  }

  await sendDirectMessage(senderId, replyText);
}

// ============================================
// Kommentga javob berish
// ============================================
async function handleComment(comment) {
  const commentId = comment.id;
  const commentText = comment.text?.toLowerCase().trim() || '';
  const fromId = comment.from?.id;
  const fromUsername = comment.from?.username;

  // O'zimizning kommentimizga javob bermaslik
  if (fromId === IG_USER_ID) return;

  console.log(`💬 Komment: "${commentText}" - @${fromUsername}`);

  if (commentText === '+' || commentText.includes('malumot')) {
    // Kommentga javob
    await replyToComment(commentId, `@${fromUsername} DM'ga ma'lumot yubordim ✉️`);

    // DM'ga private reply
    await sendPrivateReply(commentId, `Salom @${fromUsername}! Mana so'ragan ma'lumotingiz:\n\n[ma'lumot]`);
  }
}

// ============================================
// Instagram API funksiyalari
// ============================================

async function sendDirectMessage(recipientId, text) {
  try {
    await axios.post(
      `https://graph.instagram.com/v21.0/${IG_USER_ID}/messages`,
      {
        recipient: { id: recipientId },
        message: { text },
      },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
    console.log(`✅ DM yuborildi: ${recipientId}`);
  } catch (error) {
    console.error('❌ DM yuborishda xato:', error.response?.data || error.message);
  }
}

async function replyToComment(commentId, message) {
  try {
    await axios.post(
      `https://graph.instagram.com/v21.0/${commentId}/replies`,
      { message },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
    console.log(`✅ Kommentga javob yozildi`);
  } catch (error) {
    console.error('❌ Komment javobida xato:', error.response?.data || error.message);
  }
}

async function sendPrivateReply(commentId, text) {
  try {
    await axios.post(
      `https://graph.instagram.com/v21.0/${IG_USER_ID}/messages`,
      {
        recipient: { comment_id: commentId },
        message: { text },
      },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
    console.log(`✅ Private reply yuborildi`);
  } catch (error) {
    console.error('❌ Private reply xato:', error.response?.data || error.message);
  }
}

// ============================================
// Xavfsizlik - Signature tekshirish
// ============================================
function verifySignature(req, rawBody) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !rawBody || !APP_SECRET) return false;

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
