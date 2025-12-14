import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const data = {
      fullName: formData.get('fullName') as string,
      countryCode: formData.get('countryCode') as string,
      idNumber: formData.get('idNumber') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      quantity: parseInt(formData.get('quantity') as string),
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      ticketPrice: parseFloat(formData.get('ticketPrice') as string),
    };

    console.log('📝 Datos del formulario recibidos:', data);

    // TODO: Guardar en base de datos
    // await db.paymentForms.create({ data });

    return NextResponse.json({
      success: true,
      message: 'Formulario recibido correctamente',
      data: data,
    });

  } catch (error) {
    console.error('❌ Error procesando formulario:', error);
    return NextResponse.json(
      { error: 'Error al procesar el formulario' },
      { status: 500 }
    );
  }
}