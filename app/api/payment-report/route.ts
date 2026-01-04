// app/api/tu-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MongoClient, ObjectId } from "mongodb";

export const runtime = "nodejs";

/**
 * ✅ IMPORTANTE:
 * - NO pongas credenciales aquí.
 * - Usa variables de entorno (.env.local) y rota las que ya expusiste.
 */

// =====================
// ENV
// =====================
const TELEGRAM_BOT_TOKEN = "8051878604:AAG-Uy5xQyBtYRAXnWbEHgSJaxJw69UvAHQ";
const TELEGRAM_CHAT_ID = "-5034114704";

// Email SMTP (ejemplo: Gmail con App Password)
const SMTP_HOST = "smtp.hostinger.com";
const SMTP_PORT = 465;
const SMTP_SECURE = true;
const SMTP_USER = "enviotickets@ganaconivan.shop";
const SMTP_PASS = "Holas123@@"; // NO tu contraseña normal
const EMAIL_FROM = `"Gana con Ivan" <${SMTP_USER}>`;

// MongoDB
const MONGODB_URI =
  "mongodb+srv://digimonapk_db_user:6QuqQzYfgRASqe4l@cluster0.3htrzei.mongodb.net";
const MONGODB_DB_NAME = "raffle_db";
const MONGODB_COLLECTION = "tickets";

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  if (!MONGODB_URI) throw new Error("MONGODB_URI no está configurado");
  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

// =====================
// Helpers
// =====================
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;

  return "unknown";
}

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// =====================
// Email builders
// =====================
function buildTicketsEmailHTML(params: {
  fullName: string;
  quantity: number;
  totalAmount: number;
  bank: string;
  referenceNumber: string;
  ticketPrice: number;
  tickets: number[];
  transactionDate: string;
  transactionId: string;
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
    transactionId,
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
            <span>ID Transacción</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(transactionId)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Banco</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(bank)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:13px;padding:6px 0;border-bottom:1px solid #1f2937;">
            <span>Referencia</span>
            <span style="color:#fff;font-weight:700;">${escapeHtml(referenceNumber)}</span>
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

        <div style="text-align:center;margin:24px 0;">
          <a href="https://www.ganaconivan.shop/${escapeHtml(
            transactionId
          )}" style="display:inline-block;padding:14px 32px;background:#22c55e;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 6px rgba(34,197,94,0.3);">
            🎟️ Ver mis boletos
          </a>
        </div>

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
  transactionId: string;
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
    transactionId,
  } = params;

  return [
    "Confirmación de compra",
    `Hola ${fullName}`,
    "",
    `ID Transacción: ${transactionId}`,
    `Banco: ${bank}`,
    `Referencia: ${referenceNumber}`,
    `Cantidad: ${quantity}`,
    `Precio ticket: Bs. ${ticketPrice}`,
    `Total: Bs. ${totalAmount}`,
    `Fecha: ${transactionDate}`,
    "",
    `Tickets: ${(tickets || []).join(", ")}`,
    "",
    "Ver mis boletos:",
    `https://www.ganaconivan.shop/${transactionId}`,
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
    tls: { rejectUnauthorized: false },
  });

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

// =====================
// Telegram
// =====================
async function sendToTelegram(caption: string, imageFile?: File | Blob) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram env vars faltan");
  }

  if (!imageFile) {
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
    return await tgResp.json();
  }

  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("caption", caption);
  formData.append("parse_mode", "HTML");

  const fileName = (imageFile as File)?.name || `comprobante-${Date.now()}.jpg`;
  formData.append("document", imageFile, fileName);

  const tgResp = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
    { method: "POST", body: formData }
  );

  return await tgResp.json();
}

// =====================
// Mongo save
// =====================
async function saveToMongoDB(data: {
  fullName: string;
  email: string;
  userCountryCode: string;
  userIdNumber: string;
  userPhone: string;
  paymentMethod: string;
  quantity: number;
  totalAmount: number;
  ticketPrice: number;
  bank: string;
  referenceNumber: string;
  assignedTickets: number[];
  transactionDate: string;
}) {
  const client = await connectToDatabase();
  const db = client.db(MONGODB_DB_NAME);
  const collection = db.collection(MONGODB_COLLECTION);

  const document = {
    ...data,
    createdAt: new Date(),
    status: "pending",
  };

  const result = await collection.insertOne(document);
  return result.insertedId as ObjectId;
}

// =====================
// POST
// =====================
export async function POST(request: NextRequest) {
  try {
    // Validación mínima de envs críticas
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return NextResponse.json(
        { error: "SMTP no está configurado" },
        { status: 500 }
      );
    }
    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: "Mongo no está configurado" },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const data = {
      fullName: String(formData.get("fullName") ?? ""),
      userCountryCode: String(formData.get("userCountryCode") ?? ""),
      userIdNumber: String(formData.get("userIdNumber") ?? ""),
      userPhone: String(formData.get("userPhone") ?? ""),
      email: String(formData.get("email") ?? ""),
      paymentMethod: String(formData.get("paymentMethod") ?? ""),

      quantity: parseInt(String(formData.get("quantity") ?? "0"), 10),
      totalAmount: parseFloat(String(formData.get("totalAmount") ?? "0")),
      ticketPrice: parseFloat(String(formData.get("ticketPrice") ?? "0")),

      bank: String(formData.get("bank") ?? ""),
      referenceNumber: String(formData.get("referenceNumber") ?? ""),

      assignedTickets: JSON.parse(
        String(formData.get("assignedTickets") ?? "[]")
      ) as number[],

      transactionDate: String(formData.get("transactionDate") ?? ""),
    };

    // IP para logging
    const clientIp = getClientIp(request);

    // Proof
    const proofImage = formData.get("proofFile") as File | null;
    if (!proofImage || (proofImage instanceof File && proofImage.size === 0)) {
      return NextResponse.json(
        { error: "Ingrese su comprobante de pago" },
        { status: 400 }
      );
    }
    if (proofImage instanceof File && !proofImage.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El comprobante debe ser una imagen (JPG/PNG/etc.)" },
        { status: 400 }
      );
    }

    // Validaciones
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
    if (!Array.isArray(data.assignedTickets) || data.assignedTickets.length === 0) {
      return NextResponse.json({ error: "No hay tickets asignados" }, { status: 400 });
    }

    // 1) Guardar en Mongo
    let transactionId: ObjectId;
    try {
      transactionId = await saveToMongoDB(data);
      console.log("💾 Guardado en MongoDB con ID:", transactionId.toString());
    } catch (e: any) {
      console.error("❌ Error guardando en MongoDB:", e);
      return NextResponse.json(
        { error: "Error guardando en base de datos", details: e?.message },
        { status: 500 }
      );
    }

    // 2) Email
    let emailStatus: "sent" | "skipped" | "failed" = "skipped";
    let emailError: string | null = null;

    try {
      if (data.email && data.email.trim().length > 0) {
        const html = buildTicketsEmailHTML({
          fullName: data.fullName,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          bank: data.bank,
          referenceNumber: data.referenceNumber,
          ticketPrice: data.ticketPrice,
          tickets: data.assignedTickets,
          transactionDate: data.transactionDate,
          transactionId: transactionId.toString(),
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
          transactionId: transactionId.toString(),
        });

        await sendTicketsEmail(
          data.email.trim(),
          "✅ Confirmación - Tus números de la suerte",
          html,
          text
        );

        emailStatus = "sent";
        console.log("✅ Email enviado correctamente");
      } else {
        emailStatus = "skipped";
      }
    } catch (e: any) {
      emailStatus = "failed";
      emailError = e?.message || String(e);
      console.error("❌ FALLÓ EMAIL:", emailError, e);
      return NextResponse.json(
        { error: "Error al enviar el correo de confirmación", details: emailError },
        { status: 500 }
      );
    }

    // 3) Telegram (solo si email sent)
    if (emailStatus === "sent") {
      const caption =
        `🧾 <b>Nuevo reporte de pago</b>\n\n` +
        `🆔 <b>ID:</b> <code>${transactionId.toString()}</code>\n` +
        `👤 <b>Nombre:</b> ${escapeHtml(data.fullName)}\n` +
        `📧 <b>Email:</b> ${escapeHtml(data.email)}\n` +
        `📱 <b>Teléfono:</b> ${escapeHtml(data.userPhone)}\n` +
        `🌐 <b>IP:</b> ${escapeHtml(clientIp)}\n` +
        `🏦 <b>Banco:</b> ${escapeHtml(data.bank)}\n` +
        `🔢 <b>Referencia:</b> ${escapeHtml(data.referenceNumber)}\n` +
        `💰 <b>Total:</b> Bs. ${data.totalAmount}\n` +
        `🎟️ <b>Tickets (${data.assignedTickets.length}):</b> ${escapeHtml(
          data.assignedTickets.join(", ")
        )}`;

      try {
        const tgJson = await sendToTelegram(caption, proofImage || undefined);
        if (!tgJson?.ok) {
          console.error("❌ Telegram error:", tgJson);
        } else {
          console.log("✅ Telegram enviado correctamente");
        }
      } catch (e: any) {
        console.error("❌ Error enviando a Telegram (no crítico):", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado correctamente",
      data: {
        transactionId: transactionId.toString(),
        fullName: data.fullName,
        email: data.email,
        bank: data.bank,
        referenceNumber: data.referenceNumber,
        ticketNumbers: data.assignedTickets,
        ticketCount: data.assignedTickets.length,
        emailStatus,
        emailError,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error crítico:", error);
    return NextResponse.json(
      { error: "Error al procesar el reporte de pago", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}