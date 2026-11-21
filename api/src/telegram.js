/**
 * Optional Telegram Alert Service
 * Dispatches instant push alerts on TOXIC_SHOCK events if configured.
 */

async function sendTelegramAlert(node, detail, ts) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Silently skip if not configured in environment
    return;
  }

  const dateStr = new Date(ts || Date.now()).toISOString();
  const text = 
`🚨 *BIOWATT AUTONOMOUS ALARM*
━━━━━━━━━━━━━━━━━━━━
⚠️ *TOXIC SHOCK DETECTED*
📍 *Node:* \`${node}\`
🔒 *Autonomous Action:* *IRRIGATION VALVE LOCKED*
📝 *Detail:* ${detail || 'Electrogenic metabolic collapse (>40% drop)'}
⏱ *Timestamp:* ${dateStr}

_Indicator only, autonomous safeguard triggered._`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    
    if (!res.ok) {
      console.warn(`[TELEGRAM] Failed to send alert: ${res.statusText}`);
    } else {
      console.log(`[TELEGRAM] Alert sent successfully for node ${node}`);
    }
  } catch (err) {
    console.warn(`[TELEGRAM] Error sending notification: ${err.message}`);
  }
}

module.exports = {
  sendTelegramAlert
};

