import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);
    const { bot_id, message } = body;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    const botRes = await fetch(`${SUPABASE_URL}/rest/v1/bots?id=eq.${bot_id}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    const [bot] = await botRes.json();

    if (!bot) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Bot not found" }),
      };
    }

    const webhookRes = await fetch(bot.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await webhookRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.reply || "No response from webhook",
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}
