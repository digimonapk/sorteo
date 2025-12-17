import { NextRequest, NextResponse } from "next/server";

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
      fullName: (formData.get("fullName") as string) || "",
      countryCode: (formData.get("countryCode") as string) || "",
      idNumber: (formData.get("idNumber") as string) || "",
      phone: (formData.get("phone") as string) || "",
      email: (formData.get("email") as string) || "",
      paymentMethod: (formData.get("paymentMethod") as string) || "",
      quantity: parseInt((formData.get("quantity") as string) || "0", 10),
      totalAmount: parseFloat((formData.get("totalAmount") as string) || "0"),
      ticketPrice: parseFloat((formData.get("ticketPrice") as string) || "0"),
    };

    console.log("📝 Datos del formulario recibidos:", data);

    // Si quieres mantener la validación mínima, déjala:
    if (!data.fullName || !data.paymentMethod || !data.email) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos",
          required: ["fullName", "email", "paymentMethod"],
        },
        { status: 400 }
      );
    }

    // Ya no se envía a Telegram. Solo responde OK.
    return NextResponse.json({
      success: true,
      message: "Formulario recibido (sin Telegram)",
      data: {
        ...data,
        // opcional: sanitizar por si lo reflejas en UI/logs
        fullName: escapeHtml(data.fullName),
      },
    });
  } catch (error) {
    console.error("❌ Error procesando formulario:", error);
    return NextResponse.json(
      { error: "Error al procesar el formulario" },
      { status: 500 }
    );
  }
}
