import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

/**
 * ⚠️ NO SUBAS ESTO A GITHUB con credenciales reales.
 * Cambia estos valores en tu PC y no los compartas.
 */

// Telegram
const TELEGRAM_BOT_TOKEN = "8051878604:AAG-Uy5xQyBtYRAXnWbEHgSJaxJw69UvAHQ";
const TELEGRAM_CHAT_ID = "-5034114704";

// Email SMTP (ejemplo: Gmail con App Password)
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
const SMTP_SECURE = true;
const SMTP_USER = "ganaconivans@gmail.com";
const SMTP_PASS = "iusg psbo pbjs oyqv"; // NO tu contraseña normal
const EMAIL_FROM = `"Gana con Iván" <${SMTP_USER}>`;

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildTicketsEmailHTML(params: {
  fullName: string;
  quantity: number;
  totalAmount: number;
  bank: string;
  referenceNumber: string;
  ticketPrice: number;
  tickets: number[];
  transactionDate: string;
}) {
  const {
    fullName,
    quantity,
    totalAmount,
    bank,
    referenceNumber,
    ticketPrice,
    tickets,
    transactionDate,
  } = params;

  const ticketsHtml = (tickets || [])
    .map(
      (t) => `
      <span style="
        display:inline-block;
        padding:10px 14px;
        margin:6px 6px 0 0;
        background:#0f172a;
        color:#34d399;
        border:2px solid #22c55e;
        border-radius:12px;
        font-weight:800;
        font-size:18px;
        letter-spacing:0.5px;
      ">${t}</span>
    `
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#0b1220;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
      <div style="padding:18px 20px;border-bottom:1px solid #1f2937;display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:10px;background:#22c55e;"></div>
        <div>
          <div style="color:#fff;font-size:18px;font-weight:800;">Confirmación de compra</div>
          <div style="color:#9ca3af;font-size:12px;">Tus boletos ya están registrados</div>
        </div>
      </div>

      <div style="padding:20px;color:#e5e7eb;">
        <p style="margin:0 0 12px 0;">Hola <b>${escapeHtml(fullName)}</b>,</p>
        <p style="margin:0 0 18px 0;color:#cbd5e1;">
          Aquí tienes tus números asignados. Guárdalos para futuras verificaciones.
        </p>

        <div style="background:#0f172a;border:1px solid #1f2937;border-radius:14px;padding:14px 16px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Banco</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(bank)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Referencia</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(
              referenceNumber
            )}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Cantidad</span>
            <span style="color:#fff;font-weight:700;">${quantity}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Precio ticket</span>
            <span style="color:#fff;font-weight:700;">Bs. ${ticketPrice}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;">
            <span>Total</span>
            <span style="color:#34d399;font-weight:900;font-size:16px;">Bs. ${totalAmount}</span>
          </div>
          <div style="margin-top:10px;color:#64748b;font-size:12px;">
            Fecha: ${escapeHtml(transactionDate)}
          </div>
        </div>

        <div style="margin-bottom:10px;color:#9ca3af;font-size:13px;">Tus tickets:</div>
        <div style="margin-bottom:18px;">${ticketsHtml}</div>

        <div style="color:#94a3b8;font-size:12px;line-height:1.5;border-top:1px solid #1f2937;padding-top:14px;">
          Si no reconoces esta compra o hay un error en tus datos, responde a este correo.
        </div>
      </div>
    </div>
  </div>
  `;
}

function buildTicketsEmailText(params: {
  fullName: string;
  quantity: number;
  totalAmount: number;
  bank: string;
  referenceNumber: string;
  ticketPrice: number;
  tickets: number[];
  transactionDate: string;
}) {
  const {
    fullName,
    quantity,
    totalAmount,
    bank,
    referenceNumber,
    ticketPrice,
    tickets,
    transactionDate,
  } = params;

  return [
    "Confirmación de compra",
    `Hola ${fullName}`,
    "",
    `Banco: ${bank}`,
    `Referencia: ${referenceNumber}`,
    `Cantidad: ${quantity}`,
    `Precio ticket: Bs. ${ticketPrice}`,
    `Total: Bs. ${totalAmount}`,
    `Fecha: ${transactionDate}`,
    "",
    `Tickets: ${(tickets || []).join(", ")}`,
  ].join("\n");
}

async function sendTicketsEmail(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // ayuda en algunos entornos locales
    tls: { rejectUnauthorized: false },
  });

  // ✅ si esto falla, tu SMTP no está autenticando / conectando
  await transporter.verify();

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo: SMTP_USER,
  });

  console.log("📧 Email enviado:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return info;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const data = {
      fullName: formData.get("fullName") as string,
      userCountryCode: formData.get("userCountryCode") as string,
      userIdNumber: formData.get("userIdNumber") as string,
      userPhone: formData.get("userPhone") as string,
      email: formData.get("email") as string,
      paymentMethod: formData.get("paymentMethod") as string,

      quantity: parseInt(formData.get("quantity") as string),
      totalAmount: parseFloat(formData.get("totalAmount") as string),
      ticketPrice: parseFloat(formData.get("ticketPrice") as string),

      bank: formData.get("bank") as string,
      referenceNumber: formData.get("referenceNumber") as string,

      assignedTickets: JSON.parse(
        formData.get("assignedTickets") as string
      ) as number[],
      transactionDate: formData.get("transactionDate") as string,
    };

    // Validaciones mínimas
    if (!data.bank || !data.referenceNumber) {
      return NextResponse.json(
        {
          error: "Faltan datos del reporte de pago",
          required: ["bank", "referenceNumber"],
        },
        { status: 400 }
      );
    }
    if (!data.email) {
      return NextResponse.json({ error: "Falta email" }, { status: 400 });
    }
    if (
      !Array.isArray(data.assignedTickets) ||
      data.assignedTickets.length === 0
    ) {
      return NextResponse.json(
        { error: "No hay tickets asignados" },
        { status: 400 }
      );
    }

    // 1) TELEGRAM
    const caption =
      `🧾 <b>Nuevo reporte de pago</b>\n\n` +
      `👤 <b>Nombre:</b> ${escapeHtml(data.fullName)}\n` +
      `📧 <b>Email:</b> ${escapeHtml(data.email)}\n` +
      `🏦 <b>Banco:</b> ${escapeHtml(data.bank)}\n` +
      `🔢 <b>Referencia:</b> ${escapeHtml(data.referenceNumber)}\n` +
      `🎟️ <b>Tickets:</b> ${escapeHtml(data.assignedTickets.join(", "))}`;

    const tgResp = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: caption,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const tgJson = await tgResp.json();
    if (!tgResp.ok || !tgJson?.ok) {
      console.error("❌ Telegram error:", tgJson);
      return NextResponse.json(
        { error: "No se pudo enviar a Telegram", telegram: tgJson },
        { status: 502 }
      );
    }

    // 2) EMAIL (HTML + TEXT)
    const html = buildTicketsEmailHTML({
      fullName: data.fullName,
      quantity: data.quantity,
      totalAmount: data.totalAmount,
      bank: data.bank,
      referenceNumber: data.referenceNumber,
      ticketPrice: data.ticketPrice,
      tickets: data.assignedTickets,
      transactionDate: data.transactionDate,
    });

    const text = buildTicketsEmailText({
      fullName: data.fullName,
      quantity: data.quantity,
      totalAmount: data.totalAmount,
      bank: data.bank,
      referenceNumber: data.referenceNumber,
      ticketPrice: data.ticketPrice,
      tickets: data.assignedTickets,
      transactionDate: data.transactionDate,
    });

    try {
      await sendTicketsEmail(
        data.email,
        "✅ Confirmación - Tus números de la suerte",
        html,
        text
      );
    } catch (e: any) {
      console.error("❌ FALLÓ EMAIL:", e?.message, e);
      return NextResponse.json(
        { error: "Falló el envío de email", details: e?.message || String(e) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado, Telegram OK, Email OK",
      data: {
        fullName: data.fullName,
        email: data.email,
        bank: data.bank,
        referenceNumber: data.referenceNumber,
        ticketNumbers: data.assignedTickets,
        ticketCount: data.assignedTickets.length,
        confirmationId: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error crítico:", error);
    return NextResponse.json(
      {
        error: "Error al procesar el reporte de pago",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
