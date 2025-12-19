"use client";

import React, { useState } from "react";
import { Minus, Plus, X, Gift, ArrowLeft, Upload, Search } from "lucide-react";

type PaymentReportData = {
  bank: string;
  referenceNumber: string;
  idNumber: string;
  idCountryCode: string;
  phone: string;
  phoneCode: string;
  proofFile: File | null;
};

type PurchasedTicket = {
  ticketNumber: number;
  purchaseDate: string;
  status: string;
};

function OverlayShell({
  title,
  onClose,
  maxWidth = "max-w-lg",
  children,
}: {
  title?: string;
  onClose?: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div
        className={`w-full ${maxWidth} bg-slate-800 rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* HEADER CON LOGO */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 rounded-lg" />
            {title ? (
              <h2 className="text-lg font-bold text-white">{title}</h2>
            ) : null}
          </div>

          {onClose ? (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>
          ) : null}
        </div>

        {/* CONTENIDO */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function RaffleTickets() {
  const [selectedQuantity, setSelectedQuantity] = useState(7);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [showPaymentReport, setShowPaymentReport] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCheckTickets, setShowCheckTickets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignedNumbers, setAssignedNumbers] = useState<number[]>([]);
  const [checkTicketsData, setCheckTicketsData] = useState({
    countryCode: "V",
    idNumber: "",
  });
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>(
    []
  );
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsSearched, setTicketsSearched] = useState(false);

  const ticketPrice = 219.0;
  const quickOptions = [7, 10, 25, 50, 100, 250];

  const [formData, setFormData] = useState({
    fullName: "",
    countryCode: "V",
    idNumber: "",
    phone: "",
    email: "",
    paymentMethod: "",
  });

  const [paymentReportData, setPaymentReportData] = useState<PaymentReportData>(
    {
      bank: "",
      referenceNumber: "",
      idNumber: "",
      idCountryCode: "V",
      phone: "",
      phoneCode: "0412",
      proofFile: null,
    }
  );
  const MIN_TICKETS = 7;

  const handleQuantityChange = (value: number) => {
    setSelectedQuantity(Math.max(MIN_TICKETS, value));
  };

  const handleQuickSelect = (quantity: number) => {
    setSelectedQuantity(quantity);
  };

  const handleParticipate = () => setShowConfirmation(true);

  const handleContinue = () => {
    setShowConfirmation(false);
    setShowPaymentForm(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePayment = async () => {
    if (!formData.paymentMethod) {
      alert("Por favor selecciona un método de pago");
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear FormData con los datos del formulario
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("countryCode", formData.countryCode);
      formDataToSend.append("idNumber", formData.idNumber);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("paymentMethod", formData.paymentMethod);
      formDataToSend.append("quantity", selectedQuantity.toString());
      formDataToSend.append("totalAmount", totalAmount);
      formDataToSend.append("ticketPrice", ticketPrice.toString());

      // Enviar al servidor
      const response = await fetch("/api/payment-form", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Error al enviar el formulario");
      }

      const result = await response.json();
      console.log("Respuesta del servidor:", result);

      setShowPaymentForm(false);
      setShowPaymentInstructions(true);
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Hubo un error al procesar tu solicitud. Por favor intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportPayment = () => {
    setShowPaymentInstructions(false);
    setShowPaymentReport(true);
  };

  const handlePaymentReportChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setPaymentReportData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPaymentReportData((prev) => ({ ...prev, proofFile: file }));
  };

  const generateTicketNumbers = (quantity: number): number[] => {
    const numbers: number[] = [];
    for (let i = 0; i < quantity; i++) {
      // Generar números únicos de 4 dígitos (1000-9999)
      let newNumber;
      do {
        newNumber = Math.floor(1000 + Math.random() * 9000);
      } while (numbers.includes(newNumber));
      numbers.push(newNumber);
    }
    return numbers.sort((a, b) => a - b);
  };

  const handleConfirmPayment = async () => {
    if (!paymentReportData.bank || !paymentReportData.referenceNumber) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }
    if (!paymentReportData.proofFile) {
      alert("Suba su comprobante de pago");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generar números de tickets proporcionales a la cantidad comprada
      const generatedNumbers = generateTicketNumbers(selectedQuantity);
      setAssignedNumbers(generatedNumbers);

      // Crear FormData con los datos del reporte de pago
      const formDataToSend = new FormData();

      // Datos del usuario
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("userCountryCode", formData.countryCode);
      formDataToSend.append("userIdNumber", formData.idNumber);
      formDataToSend.append("userPhone", formData.phone);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("paymentMethod", formData.paymentMethod);

      // Datos de la compra
      formDataToSend.append("quantity", selectedQuantity.toString());
      formDataToSend.append("totalAmount", totalAmount);
      formDataToSend.append("ticketPrice", ticketPrice.toString());

      // Datos del reporte de pago
      formDataToSend.append("bank", paymentReportData.bank);
      formDataToSend.append(
        "referenceNumber",
        paymentReportData.referenceNumber
      );
      formDataToSend.append("idNumber", paymentReportData.idNumber);
      formDataToSend.append("idCountryCode", paymentReportData.idCountryCode);
      formDataToSend.append("phone", paymentReportData.phone);
      formDataToSend.append("phoneCode", paymentReportData.phoneCode);

      // Números de tickets asignados
      formDataToSend.append(
        "assignedTickets",
        JSON.stringify(generatedNumbers)
      );

      // Archivo de comprobante
      if (paymentReportData.proofFile) {
        formDataToSend.append("proofFile", paymentReportData.proofFile);
      }

      // Fecha y hora de la transacción
      formDataToSend.append("transactionDate", new Date().toISOString());

      // Enviar al servidor
      const response = await fetch("/api/payment-report", {
        method: "POST",
        body: formDataToSend,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Hubo un error al procesar tu pago. Por favor intenta de nuevo."
        );
      }

      const result = payload;
      console.log("Respuesta del servidor:", result);

      setShowPaymentReport(false);
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Error:", error);
      alert(
        error?.message ||
          "Hubo un error al procesar tu pago. Por favor intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setShowSuccess(false);
    setSelectedQuantity(2);
    setAssignedNumbers([]);

    setFormData({
      fullName: "",
      countryCode: "V",
      idNumber: "",
      phone: "",
      email: "",
      paymentMethod: "",
    });

    setPaymentReportData({
      bank: "",
      referenceNumber: "",
      idNumber: "",
      idCountryCode: "V",
      phone: "",
      phoneCode: "0412",
      proofFile: null,
    });
  };

  const handleCheckTicketsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setCheckTicketsData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearchTickets = async () => {
    if (!checkTicketsData.idNumber) {
      alert("Por favor ingresa tu número de cédula");
      return;
    }

    setIsLoadingTickets(true);
    setTicketsSearched(false);

    try {
      // Llamar a la API para obtener los tickets
      const response = await fetch(
        `/api/check-tickets?countryCode=${checkTicketsData.countryCode}&idNumber=${checkTicketsData.idNumber}`
      );

      if (!response.ok) {
        throw new Error("Error al buscar los tickets");
      }

      const result = await response.json();
      setPurchasedTickets(result.tickets || []);
      setTicketsSearched(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al buscar tus tickets. Por favor intenta de nuevo.");
      setPurchasedTickets([]);
      setTicketsSearched(true);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const totalAmount = (ticketPrice * selectedQuantity).toFixed(2);

  // ✅ CHECK TICKETS OVERLAY
  if (showCheckTickets) {
    return (
      <OverlayShell
        title="Comprobar mis tickets"
        onClose={() => {
          setShowCheckTickets(false);
          setTicketsSearched(false);
          setPurchasedTickets([]);
          setCheckTicketsData({ countryCode: "V", idNumber: "" });
        }}
        maxWidth="max-w-lg"
      >
        <div className="space-y-6">
          <p className="text-gray-300">
            Ingresa tu cédula para ver todos tus tickets comprados
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Número de cédula
            </label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={checkTicketsData.countryCode}
                onChange={handleCheckTicketsChange}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="V">V</option>
                <option value="E">E</option>
                <option value="J">J</option>
                <option value="P">P</option>
              </select>
              <input
                type="text"
                name="idNumber"
                value={checkTicketsData.idNumber}
                onChange={handleCheckTicketsChange}
                placeholder="Escribe tu cédula"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleSearchTickets}
            disabled={isLoadingTickets}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search size={20} />
            {isLoadingTickets ? "Buscando..." : "Buscar mis tickets"}
          </button>

          {ticketsSearched && (
            <div className="mt-6">
              {purchasedTickets.length > 0 ? (
                <>
                  <h3 className="text-white text-lg font-semibold mb-4">
                    Tus tickets ({purchasedTickets.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {purchasedTickets.map((ticket, index) => (
                      <div
                        key={index}
                        className="bg-slate-700 border border-slate-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-green-400">
                            {ticket.ticketNumber}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              ticket.status === "Activo"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Comprado: {ticket.purchaseDate}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-2">
                    No se encontraron tickets
                  </div>
                  <p className="text-gray-500 text-sm">
                    No hay tickets asociados a esta cédula
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </OverlayShell>
    );
  }

  // ✅ SUCCESS OVERLAY
  if (showSuccess) {
    return (
      <OverlayShell title="Compra exitosa" maxWidth="max-w-md">
        <div className="text-center">
          {/* ✅ Aviso Spam */}
          <div className="mb-5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-left">
            <p className="text-yellow-300 font-semibold">
              📩 Revisa tu carpeta de Spam / No deseado
            </p>
            <p className="text-yellow-200/80 text-sm mt-1">
              A veces el correo de confirmación puede llegar ahí. Si lo
              encuentras, márcalo como "No es spam".
            </p>
          </div>

          <div className="mb-6 flex justify-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Check-green.svg/2048px-Check-green.svg.png"
              alt="Success"
              className="w-32 h-32 rounded-full"
            />
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            ¡Compra exitosa! 🎉
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Tu pago ha sido procesado correctamente
          </p>

          <div className="mb-8">
            <p className="text-gray-400 mb-3">
              {assignedNumbers.length === 1
                ? "Número asignado"
                : "Números asignados"}
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 px-2">
              {assignedNumbers.map((number, index) => (
                <div
                  key={index}
                  className="inline-block px-6 py-3 bg-slate-700 border-2 border-green-500 rounded-xl mx-1 mb-2"
                >
                  <span className="text-2xl font-bold text-green-400">
                    {number}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Total: {assignedNumbers.length}{" "}
              {assignedNumbers.length === 1 ? "boleto" : "boletos"}
            </p>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-lg transition-colors shadow-lg"
          >
            Finalizar
          </button>
        </div>
      </OverlayShell>
    );
  }

  // ✅ PAYMENT REPORT OVERLAY
  if (showPaymentReport) {
    return (
      <OverlayShell
        title="Reportar pago"
        onClose={() => setShowPaymentReport(false)}
        maxWidth="max-w-lg"
      >
        <div className="mb-6">
          <p className="text-gray-300 mb-1">
            Completa los datos de tu transacción
          </p>
          <p className="text-green-400 text-sm font-medium">Banco emisor</p>
        </div>

        <div className="space-y-4">
          <div>
            <select
              name="bank"
              value={paymentReportData.bank}
              onChange={handlePaymentReportChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecciona tu banco</option>

              {/* Banca pública */}
              <option value="Banco de Venezuela">Banco de Venezuela</option>
              <option value="Banco del Tesoro">Banco del Tesoro</option>
              <option value="Banco Bicentenario">Banco Bicentenario</option>
              <option value="Banco de Desarrollo Económico y Social de Venezuela (BANDES)">
                BANDES
              </option>
              <option value="Banco Agrícola de Venezuela">
                Banco Agrícola de Venezuela
              </option>
              <option value="Banco Nacional de Crédito (BNC)">
                Banco Nacional de Crédito (BNC)
              </option>

              {/* Banca privada */}
              <option value="Banesco">Banesco</option>
              <option value="Banco Mercantil">Banco Mercantil</option>
              <option value="BBVA Provincial">BBVA Provincial</option>
              <option value="Banco Venezolano de Crédito">
                Banco Venezolano de Crédito
              </option>
              <option value="Bancaribe">Bancaribe</option>
              <option value="Banco Exterior">Banco Exterior</option>
              <option value="Banco Plaza">Banco Plaza</option>
              <option value="Banco Caroní">Banco Caroní</option>
              <option value="Banco Sofitasa">Banco Sofitasa</option>
              <option value="Banco Fondo Común (BFC)">
                Banco Fondo Común (BFC)
              </option>
              <option value="Banco Activo">Banco Activo</option>
              <option value="Banco Nacional de Fomento (no usar si no aplica)">
                Banco Nacional de Fomento (si aplica)
              </option>

              {/* Microfinancieras / regionales */}
              <option value="Banco del Sur">Banco del Sur</option>
              <option value="Bancrecer">Bancrecer</option>
              <option value="Bangente">Bangente</option>
              <option value="Mi Banco">Mi Banco</option>

              {/* Digitales / pagos */}
              <option value="100% Banco">100% Banco</option>
              <option value="Bancamiga">Bancamiga</option>

              {/* Otros conocidos */}
              <option value="Banco Occidental de Descuento (BOD)">
                Banco Occidental de Descuento (BOD)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Número de referencia
            </label>
            <input
              type="text"
              name="referenceNumber"
              value={paymentReportData.referenceNumber}
              onChange={handlePaymentReportChange}
              placeholder="Número de referencia"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cédula asociada al banco
            </label>
            <div className="flex gap-2">
              <select
                name="idCountryCode"
                value={paymentReportData.idCountryCode}
                onChange={handlePaymentReportChange}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="V">V</option>
                <option value="E">E</option>
                <option value="J">J</option>
                <option value="P">P</option>
              </select>
              <input
                type="text"
                name="idNumber"
                value={paymentReportData.idNumber}
                onChange={handlePaymentReportChange}
                placeholder="Escribe tu cédula"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono asociado
            </label>
            <div className="flex gap-2">
              <select
                name="phoneCode"
                value={paymentReportData.phoneCode}
                onChange={handlePaymentReportChange}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="0412">0412</option>
                <option value="0414">0414</option>
                <option value="0424">0424</option>
                <option value="0416">0416</option>
                <option value="0426">0426</option>
              </select>
              <input
                type="tel"
                name="phone"
                value={paymentReportData.phone}
                onChange={handlePaymentReportChange}
                placeholder="Escribe tu teléfono"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subir comprobante
            </label>
            <label className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-gray-400 cursor-pointer hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
              <Upload size={20} />
              <span>
                {paymentReportData.proofFile?.name ?? "No file chosen"}
              </span>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowPaymentReport(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              <ArrowLeft size={20} />
              Volver
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Procesando..." : "Confirmar pago"}
            </button>
          </div>
        </div>
      </OverlayShell>
    );
  }

  // ✅ PAYMENT INSTRUCTIONS OVERLAY
  if (showPaymentInstructions) {
    return (
      <OverlayShell
        title="Realiza el pago"
        onClose={() => setShowPaymentInstructions(false)}
        maxWidth="max-w-md"
      >
        <p className="text-gray-300 mb-6">
          Sigue las instrucciones para completar tu pago
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-3 border-b border-slate-700">
            <span className="text-gray-400">Banco</span>
            <span className="text-white font-medium text-right max-w-xs">
              Banco de Venezuela
            </span>
          </div>

          <div className="flex justify-between py-3 border-b border-slate-700">
            <span className="text-gray-400">Teléfono</span>
            <span className="text-white font-medium">04161080839</span>
          </div>

          <div className="flex justify-between py-3 border-b border-slate-700">
            <span className="text-gray-400">Cédula</span>
            <span className="text-white font-medium">32488321</span>
          </div>

          <div className="flex justify-between py-3">
            <span className="text-gray-400">Monto</span>
            <span className="text-white font-bold text-xl">
              Bs. {totalAmount}
            </span>
          </div>
        </div>

        <button
          onClick={handleReportPayment}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-lg transition-colors shadow-lg"
        >
          Reportar pago
        </button>
      </OverlayShell>
    );
  }

  // ✅ PAYMENT FORM OVERLAY
  if (showPaymentForm) {
    return (
      <OverlayShell
        title="Indica tus datos"
        onClose={() => setShowPaymentForm(false)}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              placeholder="Escribe tu nombre completo"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cédula
            </label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleFormChange}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="V">V</option>
                <option value="E">E</option>
                <option value="J">J</option>
                <option value="P">P</option>
              </select>

              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleFormChange}
                placeholder="Escribe tu cédula"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="Escribe tu teléfono"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="Escribe tu correo electrónico"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Método de pago
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleFormChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecciona un método de pago</option>
              <option value="pago_movil">Pago Móvil</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowPaymentForm(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              disabled={isSubmitting}
            >
              <ArrowLeft size={20} />
              Volver
            </button>
            <button
              onClick={handlePayment}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Procesando..." : "Pagar"}
            </button>
          </div>
        </div>
      </OverlayShell>
    );
  }

  // ✅ CONFIRMATION OVERLAY
  if (showConfirmation) {
    return (
      <OverlayShell
        title="Verifica el monto"
        onClose={() => setShowConfirmation(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-slate-700">
            <span className="text-gray-300 text-lg">Precio por boleto</span>
            <span className="text-white text-xl font-semibold">
              Bs. {ticketPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-slate-700">
            <span className="text-gray-300 text-lg">Cantidad de boletos</span>
            <span className="text-white text-xl font-semibold">
              {selectedQuantity}
            </span>
          </div>

          <div className="flex justify-between items-center py-6 bg-slate-700/50 rounded-lg px-4">
            <span className="text-gray-200 text-xl font-medium">
              Total a pagar
            </span>
            <span className="text-green-400 text-2xl font-bold">
              Bs. {totalAmount}
            </span>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-lg transition-colors shadow-lg"
          >
            Continuar
          </button>
        </div>
      </OverlayShell>
    );
  }

  // ✅ MAIN PAGE (SIN OVERLAY)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCheckTickets(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Search size={18} />
              Comprobar tickets
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              Telegram
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl mb-8">
          <div className="relative">
            <img
              src="1.jpeg"
              alt="Raffle Prize"
              className="w-full h-80 object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-green-500 px-4 py-2 rounded-lg">
              <span className="text-white font-semibold">Participa ahora</span>
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center gap-2">
              🤑 COMBO MILLONARIO SUPER RECARGADO 🤑 🚗 🚙 🏠 🏠
            </h1>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2 text-green-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">21 Diciembre 2025</span>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">Boleto</div>
                <div className="text-white text-xl font-bold">
                  Bs. {ticketPrice.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {quickOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleQuickSelect(option)}
                  className={`relative py-4 rounded-lg font-bold text-2xl transition-all ${
                    selectedQuantity === option
                      ? "bg-green-500 text-white shadow-lg scale-105"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  {option}

                  {/* Cambia 10 por el número que quieras marcar como "Más popular" */}
                  {option === 10 && (
                    <span className="pointer-events-none absolute -top-2 -right-2 bg-yellow-500 text-xs px-2 py-1 rounded-full">
                      Más popular
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => handleQuantityChange(selectedQuantity - 1)}
                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus size={20} />
              </button>

              <input
                type="number"
                min={7}
                value={selectedQuantity}
                onChange={(e) =>
                  handleQuantityChange(parseInt(e.target.value || "1", 10) || 1)
                }
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 text-white text-center text-xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                onClick={() => handleQuantityChange(selectedQuantity + 1)}
                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <button
              onClick={handleParticipate}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg transition-colors shadow-lg mb-4"
            >
              Participar → Bs. {totalAmount}
            </button>

            <div className="space-y-3">
              <button className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Gift size={20} />
                Premios
              </button>

              <button
                onClick={() => setShowCheckTickets(true)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-green-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Ver boletos comprados
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl text-gray-300 mb-6">
            Echa un vistazo a nuestros últimos sorteos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "COMBO MILLONARIO RECARGADO",
                date: "21 Deciembre 025",
                img: "2.jpeg",
              },
              {
                title: "TOYOTA YARIS 2026 0KM + IPHONE",
                date: "06 December 2025",
                img: "3.jpeg",
              },
              {
                title: "COMBO SOLUCIÓN RECARGADO",
                date: "10 December 2025",
                img: "4.jpeg",
              },
            ].map((raffle, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={raffle.img}
                  alt={raffle.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-3">
                    {raffle.title}
                  </h3>
                  <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {raffle.date}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
                      Verificar boletos
                    </button>
                    <button className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Comunidad</h2>
          <div className="flex items-center justify-center gap-6">
            <a
              href="#"
              className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-white font-bold">f</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-white font-bold">in</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
