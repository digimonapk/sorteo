import { NextRequest, NextResponse } from "next/server";

/**
 * ⚠️ NO subas esto a GitHub con el token real.
 */
const TELEGRAM_BOT_TOKEN = "8051878604:AAG-Uy5xQyBtYRAXnWbEHgSJaxJw69UvAHQ";
const TELEGRAM_CHAT_ID = "-5034114704"; // "123..." o "-100..."

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const data = {
      fullName: formData.get("fullName") as string,
      countryCode: formData.get("countryCode") as string,
      idNumber: formData.get("idNumber") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      quantity: parseInt(formData.get("quantity") as string),
      totalAmount: parseFloat(formData.get("totalAmount") as string),
      ticketPrice: parseFloat(formData.get("ticketPrice") as string),
    };

    console.log("📝 Datos del formulario recibidos:", data);

    // Validación mínima (para evitar 400 en tu log si faltan campos)
    if (!data.fullName || !data.paymentMethod || !data.email) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos",
          required: ["fullName", "email", "paymentMethod"],
        },
        { status: 400 }
      );
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json(
        {
          error:
            "Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID (variables en el código)",
        },
        { status: 500 }
      );
    }

    const msg =
      `📝 <b>Nuevo formulario (antes del pago)</b>\n\n` +
      `👤 <b>Nombre:</b> ${escapeHtml(data.fullName)}\n` +
      `🪪 <b>DNI:</b> ${escapeHtml(`${data.countryCode} ${data.idNumber}`)}\n` +
      `📱 <b>Tel:</b> ${escapeHtml(data.phone)}\n` +
      `📧 <b>Email:</b> ${escapeHtml(data.email)}\n` +
      `💳 <b>Método:</b> ${escapeHtml(data.paymentMethod)}\n\n` +
      `🎟️ <b>Cantidad:</b> ${data.quantity}\n` +
      `💵 <b>Precio ticket:</b> ${data.ticketPrice}\n` +
      `💰 <b>Total:</b> ${data.totalAmount}\n` +
      `🕒 <b>Fecha:</b> ${escapeHtml(new Date().toISOString())}`;

    const tgResp = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const tgJson = await tgResp.json();
    if (!tgResp.ok || !tgJson?.ok) {
      console.error("❌ Telegram sendMessage error:", tgJson);
      // OJO: aquí puedes decidir si fallas o si solo lo logueas.
      return NextResponse.json(
        { error: "No se pudo enviar a Telegram", telegram: tgJson },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Formulario recibido y enviado a Telegram",
      data,
    });
  } catch (error) {
    console.error("❌ Error procesando formulario:", error);
    return NextResponse.json(
      { error: "Error al procesar el formulario" },
      { status: 500 }
    );
  }
}
