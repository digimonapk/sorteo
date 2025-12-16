// app/api/tickets/[id]/route.ts
// API para obtener información de un ticket por su ID de transacción

import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

export const runtime = "nodejs";

const MONGODB_URI =
  "mongodb+srv://digimonapk_db_user:6QuqQzYfgRASqe4l@cluster0.3htrzei.mongodb.net/";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;

    // Validar que el ID sea un ObjectId válido de MongoDB
    if (!ObjectId.isValid(transactionId)) {
      return NextResponse.json(
        { error: "ID de transacción inválido" },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection(MONGODB_COLLECTION);

    // Buscar el ticket por ID
    const ticket = await collection.findOne({
      _id: new ObjectId(transactionId),
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    // Formatear la respuesta
    const response = {
      success: true,
      data: {
        transactionId: ticket._id.toString(),
        fullName: ticket.fullName,
        email: ticket.email,
        phone: ticket.userPhone || ticket.phone,
        countryCode: ticket.userCountryCode || ticket.countryCode,
        idNumber: ticket.userIdNumber || ticket.idNumber,

        // Información del pago
        bank: ticket.bank,
        referenceNumber: ticket.referenceNumber,
        paymentMethod: ticket.paymentMethod,

        // Información de los tickets
        ticketNumbers: ticket.assignedTickets || [],
        quantity: ticket.quantity,
        ticketPrice: ticket.ticketPrice,
        totalAmount: ticket.totalAmount,

        // Fechas y estado
        status: ticket.status || "pending",
        transactionDate: ticket.transactionDate,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt || null,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ Error al buscar ticket:", error);
    return NextResponse.json(
      {
        error: "Error al buscar el ticket",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
