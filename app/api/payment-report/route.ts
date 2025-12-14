import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Obtener el FormData
    const formData = await request.formData();

    // Extraer y validar los datos
    const data = {
      // Datos del usuario
      fullName: formData.get('fullName') as string,
      userCountryCode: formData.get('userCountryCode') as string,
      userIdNumber: formData.get('userIdNumber') as string,
      userPhone: formData.get('userPhone') as string,
      email: formData.get('email') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      
      // Datos de la compra
      quantity: parseInt(formData.get('quantity') as string),
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      ticketPrice: parseFloat(formData.get('ticketPrice') as string),
      
      // Datos del reporte de pago
      bank: formData.get('bank') as string,
      referenceNumber: formData.get('referenceNumber') as string,
      idNumber: formData.get('idNumber') as string,
      idCountryCode: formData.get('idCountryCode') as string,
      phone: formData.get('phone') as string,
      phoneCode: formData.get('phoneCode') as string,
      
      // Números de tickets asignados
      assignedTickets: JSON.parse(formData.get('assignedTickets') as string),
      
      // Fecha de transacción
      transactionDate: formData.get('transactionDate') as string,
    };

    console.log('📥 Datos recibidos:', {
      fullName: data.fullName,
      email: data.email,
      bank: data.bank,
      quantity: data.quantity,
      ticketsCount: data.assignedTickets?.length
    });

    // Validar campos requeridos
    if (!data.bank || !data.referenceNumber) {
      console.error('❌ Validación fallida: faltan datos del banco');
      return NextResponse.json(
        { 
          error: 'Faltan datos del reporte de pago',
          required: ['bank', 'referenceNumber']
        },
        { status: 400 }
      );
    }

    // Procesar archivo
    let proofFilePath = null;
    const proofFile = formData.get('proofFile') as File | null;

    if (proofFile && proofFile.size > 0) {
      try {
        console.log('📎 Procesando archivo:', {
          name: proofFile.name,
          size: proofFile.size,
          type: proofFile.type
        });

        // Crear carpeta uploads si no existe
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        
        if (!existsSync(uploadsDir)) {
          console.log('📁 Creando carpeta uploads...');
          await mkdir(uploadsDir, { recursive: true });
        }

        // Convertir archivo a buffer
        const bytes = await proofFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileExtension = path.extname(proofFile.name) || '.jpg';
        const fileName = `${timestamp}-${randomString}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Guardar el archivo
        await writeFile(filePath, buffer);
        proofFilePath = `/uploads/${fileName}`;

        console.log('✅ Archivo guardado exitosamente:', proofFilePath);
      } catch (fileError) {
        console.error('❌ Error al guardar archivo:', fileError);
        // No fallar la request si el archivo falla, solo loguear
        proofFilePath = null;
      }
    } else {
      console.log('ℹ️ No se recibió archivo o el archivo está vacío');
    }

    // Log del reporte completo
    console.log('💰 Reporte de pago procesado:', {
      fullName: data.fullName,
      email: data.email,
      bank: data.bank,
      referenceNumber: data.referenceNumber,
      quantity: data.quantity,
      totalAmount: data.totalAmount,
      ticketsCount: data.assignedTickets.length,
      tickets: data.assignedTickets,
      proofFilePath: proofFilePath || 'Sin comprobante',
      timestamp: new Date().toISOString()
    });

    // TODO: Guardar en base de datos
    // Ejemplo con Prisma:
    // const purchase = await prisma.purchase.create({
    //   data: {
    //     fullName: data.fullName,
    //     email: data.email,
    //     bank: data.bank,
    //     referenceNumber: data.referenceNumber,
    //     quantity: data.quantity,
    //     totalAmount: data.totalAmount,
    //     proofFilePath: proofFilePath,
    //     transactionDate: new Date(data.transactionDate),
    //     tickets: {
    //       create: data.assignedTickets.map((num: number) => ({
    //         ticketNumber: num
    //       }))
    //     }
    //   }
    // });

    // TODO: Enviar email de confirmación
    // await sendEmail({
    //   to: data.email,
    //   subject: '¡Compra exitosa! - Tus números de la suerte',
    //   html: generateTicketEmailHTML(data)
    // });

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Pago registrado correctamente',
      data: {
        fullName: data.fullName,
        email: data.email,
        bank: data.bank,
        referenceNumber: data.referenceNumber,
        ticketNumbers: data.assignedTickets,
        ticketCount: data.assignedTickets.length,
        confirmationId: `TXN-${Date.now()}`,
        proofFilePath: proofFilePath,
        timestamp: new Date().toISOString()
      },
    });

  } catch (error: any) {
    console.error('❌ Error crítico procesando reporte de pago:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Error al procesar el reporte de pago',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}