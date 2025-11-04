const fetch = require('node-fetch');

/**
 * Kirim notif Telegram ke chat ID tertentu.
 * @param {string} message - Pesan notif (support HTML).
 * @returns {Promise<void>}
 */
const sendTelegramNotif = async (message) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram config not set - skipping notif');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✅ Telegram notif sent successfully');
    } else {
      console.error('❌ Telegram error:', data.description);
    }
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
};

module.exports = sendTelegramNotif;
