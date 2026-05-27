// Long-lived token (60 kun) olish uchun yordamchi script
// Brauzerda quyidagi URL'ni oching (TOKEN va APP_SECRET ni almashtiring):
//
// https://graph.instagram.com/access_token
//   ?grant_type=ig_exchange_token
//   &client_secret=APP_SECRET
//   &access_token=SHORT_LIVED_TOKEN
//
// Yoki bu scriptni node bilan ishga tushuring:
// node tools/get-long-token.js

import axios from 'axios';

const SHORT_TOKEN = process.env.SHORT_TOKEN || 'BU_YERGA_QISQA_TOKEN';
const APP_SECRET = process.env.APP_SECRET || 'BU_YERGA_APP_SECRET';

async function getLongLivedToken() {
  try {
    const response = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: APP_SECRET,
        access_token: SHORT_TOKEN,
      },
    });

    console.log('✅ Long-lived token olindi!');
    console.log('\nToken:', response.data.access_token);
    console.log('Amal qilish muddati:', response.data.expires_in, 'soniya');
    console.log('(taxminan', Math.floor(response.data.expires_in / 86400), 'kun)');
    console.log('\n📋 Bu tokenni Vercel Environment Variables ga qo\'ying:');
    console.log('PAGE_ACCESS_TOKEN=' + response.data.access_token);
  } catch (error) {
    console.error('❌ Xato:', error.response?.data || error.message);
  }
}

getLongLivedToken();
