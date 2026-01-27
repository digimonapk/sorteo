import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MongoClient, ObjectId } from "mongodb";

export const runtime = "nodejs";

/**
 * ⚠️ NO SUBAS ESTO A GITHUB con credenciales reales.
 * Cambia estos valores en tu PC y no los compartas.
 */

// Telegram
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

// Meta Pixel Configuration
const META_PIXEL_ID = "926409043392429";
const META_TEST_EVENT_CODE = "TEST34436"; // Tu código de prueba

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Función para enviar evento de Meta Pixel desde el servidor
async function sendMetaPixelEvent(eventData: {
  eventName: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value: number;
  currency: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  customParameters?: Record<string, any>;
}) {
  try {
    // Solo si tienes un access token de Meta (opcional para server-side)
    const META_ACCESS_TOKEN = process.env.META_PIXEL_ACCESS_TOKEN;
    
    if (!META_ACCESS_TOKEN) {
      console.log('⚠️ Meta Pixel: No access token configurado para server-side');
      return null;
    }

    const url = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;
    
    // Preparar datos del usuario (con hash para privacidad)
    const userData: any = {};
    
    if (eventData.email) {
      // En producción, deberías hashear el email con SHA256
      userData.em = [hashString(eventData.email.toLowerCase())];
    }
    
    if (eventData.phone) {
      userData.ph = [hashString(eventData.phone.replace(/\D/g, ''))];
    }
    
    if (eventData.firstName) {
      userData.fn = [hashString(eventData.firstName.toLowerCase())];
    }
    
    if (eventData.lastName) {
      userData.ln = [hashString(eventData.lastName.toLowerCase())];
    }

    const requestData = {
      data: [{
        event_name: eventData.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: "https://www.ganaconivan.shop",
        user_data: userData,
        custom_data: {
          value: eventData.value,
          currency: eventData.currency,
          contents: eventData.contents || [{
            id: "ticket",
            quantity: 1,
            item_price: eventData.value
          }],
          ...eventData.customParameters
        },
        event_id: `server_${eventData.eventName.toLowerCase()}_${Date.now()}`,
        // Solo en desarrollo/testing
        ...(process.env.NODE_ENV === 'development' && {
          test_event_code: META_TEST_EVENT_CODE
        })
      }],
      access_token: META_ACCESS_TOKEN,
      // Solo en desarrollo/testing
      ...(process.env.NODE_ENV === 'development' && {
        test_event_code: META_TEST_EVENT_CODE
      })
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ Meta Pixel: Error en respuesta:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return null;
    }

    const result = await response.json();
    console.log('✅ Meta Pixel: Evento enviado desde servidor:', {
      eventName: eventData.eventName,
      eventId: result.events_received?.[0]?.event_id,
      value: eventData.value
    });
    
    return result;
  } catch (error) {
    console.error('❌ Meta Pixel: Error enviando evento:', error);
    return null;
  }
}

// Función simple de hash (en producción usaría crypto)
function hashString(input: string): string {
  // NOTA: En producción real, deberías usar SHA256
  // Esta es solo una simulación básica
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
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
            <span style="color:#fff;font-weight:700;">${escapeHtml(
              transactionId
            )}</span>
          </div>
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

async function sendToTelegram(caption: string, imageFile?: File | Blob) {
  // Si no hay archivo: texto normal
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

  // Si hay archivo: manda como DOCUMENTO (acepta cualquier dimensión)
  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("caption", caption);
  formData.append("parse_mode", "HTML");

  // Mantener nombre si viene como File
  const fileName = (imageFile as File)?.name || `comprobante-${Date.now()}.jpg`;

  // En Node runtime, el File/Blob funciona con FormData
  formData.append("document", imageFile, fileName);

  const tgResp = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
    { method: "POST", body: formData }
  );

  return await tgResp.json();
}

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
    status: "pending", // pending, confirmed, rejected
    metaPixelTriggered: false, // Para marcar si se disparó el evento
  };

  const result = await collection.insertOne(document);
  return result.insertedId;
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

    // Obtener la imagen si existe (el frontend lo envía como "proofFile")
    const proofImage = formData.get("proofFile") as File | null;
    if (!proofImage || (proofImage instanceof File && proofImage.size === 0)) {
      return NextResponse.json(
        { error: "Ingrese su comprobante de pago" },
        { status: 400 }
      );
    }

    // (Opcional) validar que sea imagen
    if (proofImage instanceof File && !proofImage.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El comprobante debe ser una imagen (JPG/PNG/etc.)" },
        { status: 400 }
      );
    }
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

    // 1) GUARDAR EN MONGODB
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

    // 2) ENVIAR EVENTO DE META PIXEL (Async - no bloquea)
    let metaPixelResult = null;
    try {
      // Extraer nombre y apellido del fullName
      const nameParts = data.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const pixelEvent = {
        eventName: "Purchase", // o "Lead" si quieres también
        email: data.email,
        phone: data.userPhone,
        firstName,
        lastName,
        value: data.totalAmount,
        currency: "USD",
        contents: [{
          id: "raffle_ticket",
          quantity: data.quantity,
          item_price: data.ticketPrice
        }],
        customParameters: {
          transaction_id: transactionId.toString(),
          bank: data.bank,
          reference_number: data.referenceNumber,
          ticket_numbers: data.assignedTickets.join(','),
          payment_method: data.paymentMethod,
          ticket_count: data.assignedTickets.length,
          source: "purchase_form"
        }
      };

      // Enviar de forma asíncrona (no esperar)
      sendMetaPixelEvent(pixelEvent).then(result => {
        metaPixelResult = result;
        console.log('✅ Meta Pixel: Evento de compra enviado');
      }).catch(error => {
        console.error('⚠️ Meta Pixel: Error enviando evento asíncrono:', error);
      });

      // También enviar evento Lead (para seguimiento de leads)
      const leadEvent = {
        eventName: "Lead",
        email: data.email,
        phone: data.userPhone,
        firstName,
        lastName,
        value: data.totalAmount,
        currency: "USD",
        customParameters: {
          transaction_id: transactionId.toString(),
          source: "ticket_purchase",
          ticket_count: data.quantity
        }
      };

      sendMetaPixelEvent(leadEvent).then(() => {
        console.log('✅ Meta Pixel: Evento de lead enviado');
      }).catch(() => {
        // Ignorar errores en segundo evento
      });

    } catch (error) {
      console.error('⚠️ Meta Pixel: Error configurando eventos:', error);
      // No fallar la operación principal por esto
    }

    // 3) TELEGRAM (con imagen si existe)
    const caption =
      `🧾 <b>Nuevo reporte de pago</b>\n\n` +
      `🆔 <b>ID:</b> <code>${transactionId.toString()}</code>\n` +
      `👤 <b>Nombre:</b> ${escapeHtml(data.fullName)}\n` +
      `📧 <b>Email:</b> ${escapeHtml(data.email)}\n` +
      `📱 <b>Teléfono:</b> ${escapeHtml(data.userPhone)}\n` +
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
        return NextResponse.json(
          { error: "No se pudo enviar a Telegram", telegram: tgJson },
          { status: 502 }
        );
      }
      console.log("✅ Telegram enviado correctamente");
    } catch (e: any) {
      console.error("❌ Error enviando a Telegram:", e);
      return NextResponse.json(
        { error: "Error enviando a Telegram", details: e?.message },
        { status: 502 }
      );
    }

    let emailStatus: "sent" | "skipped" | "failed" = "skipped";
    let emailError: string | null = null;

    try {
      // Si no hay email o está vacío, lo saltas
      if (data.email && String(data.email).trim().length > 0) {
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
          String(data.email).trim(),
          "✅ Confirmación - Tus números de la suerte",
          html,
          text
        );

        emailStatus = "sent";
        console.log("✅ Email enviado correctamente");
      } else {
        emailStatus = "skipped";
        console.log("⚠️ Email omitido: no hay destinatario");
      }
    } catch (e: any) {
      emailStatus = "failed";
      emailError = e?.message || String(e);
      console.error("❌ FALLÓ EMAIL (pero continúo):", emailError, e);
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado en DB, Telegram OK, Email opcional",
      data: {
        transactionId: transactionId.toString(),
        fullName: data.fullName,
        email: data.email,
        bank: data.bank,
        referenceNumber: data.referenceNumber,
        ticketNumbers: data.assignedTickets,
        ticketCount: data.assignedTickets.length,
        emailStatus, // "sent" | "skipped" | "failed"
        emailError, // string | null
        timestamp: new Date().toISOString(),
        // Información para que el frontend dispare el pixel
        metaPixelTrigger: {
          shouldTrigger: true,
          eventType: "Purchase",
          amount: data.totalAmount,
          currency: "USD",
          transactionId: transactionId.toString()
        }
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