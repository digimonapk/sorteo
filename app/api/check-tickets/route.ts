import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const runtime = "nodejs";

// MongoDB - Usar las mismas credenciales que en payment-report
const MONGODB_URI =
  "mongodb+srv://digimonapk_db_user:6QuqQzYfgRASqe4l@cluster0.3htrzei.mongodb.net";
const MONGODB_DB_NAME = "raffle_db";
const MONGODB_COLLECTION = "tickets";

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("countryCode");
    const idNumber = searchParams.get("idNumber");

    // Validar que vengan los parámetros
    if (!countryCode || !idNumber) {
      return NextResponse.json(
        {
          error: "Faltan parámetros requeridos",
          required: ["countryCode", "idNumber"],
        },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection(MONGODB_COLLECTION);

    // Buscar todos los tickets asociados a esta cédula
    const tickets = await collection
      .find({
        userCountryCode: countryCode,
        userIdNumber: idNumber,
      })
      .sort({ createdAt: -1 }) // Más recientes primero
      .toArray();

    // Si no hay tickets, devolver array vacío
    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        success: true,
        tickets: [],
        message: "No se encontraron tickets para esta cédula",
      });
    }

    // Formatear los tickets para la respuesta
    const formattedTickets = tickets.flatMap((purchase) => {
      // Cada compra puede tener múltiples tickets en assignedTickets
      const assignedTickets = purchase.assignedTickets || [];

      return assignedTickets.map((ticketNumber: number) => ({
        ticketNumber,
        purchaseDate: new Date(purchase.createdAt).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Confirmado",
        transactionId: purchase._id.toString(),
        bank: purchase.bank,
        referenceNumber: purchase.referenceNumber,
        totalAmount: purchase.totalAmount,
      }));
    });

    // Devolver los tickets encontrados
    return NextResponse.json({
      success: true,
      tickets: formattedTickets,
      totalTickets: formattedTickets.length,
      totalPurchases: tickets.length,
      userData: {
        countryCode: tickets[0]?.userCountryCode,
        idNumber: tickets[0]?.userIdNumber,
        fullName: tickets[0]?.fullName,
        email: tickets[0]?.email,
      },
    });
  } catch (error: any) {
    console.error("❌ Error buscando tickets:", error);
    return NextResponse.json(
      {
        error: "Error al buscar los tickets",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
