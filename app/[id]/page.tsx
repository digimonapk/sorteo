"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
} from "lucide-react";

interface TicketData {
  transactionId: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  idNumber: string;
  bank: string;
  referenceNumber: string;
  paymentMethod: string;
  ticketNumbers: number[];
  quantity: number;
  ticketPrice: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "rejected";
  transactionDate: string;
  createdAt: string;
}

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params?.id as string;

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticketId) {
      fetchTicketData(ticketId);
    }
  }, [ticketId]);

  const fetchTicketData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tickets/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al cargar los datos");
      }

      setTicketData(result.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          text: "Confirmado",
          bgColor: "bg-green-500",
          textColor: "text-green-400",
          borderColor: "border-green-500",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-6 h-6" />,
          text: "Rechazado",
          bgColor: "bg-red-500",
          textColor: "text-red-400",
          borderColor: "border-red-500",
        };
      default:
        return {
          icon: <Clock className="w-6 h-6" />,
          text: "Pendiente",
          bgColor: "bg-yellow-500",
          textColor: "text-yellow-400",
          borderColor: "border-yellow-500",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-solid mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return null;
  }

  const statusConfig = getStatusConfig(ticketData.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12 rounded-lg" />
            <h1 className="text-2xl font-bold text-white">Detalle de Compra</h1>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 ${statusConfig.bgColor} rounded-full`}
          >
            {statusConfig.icon}
            <span className="text-white font-bold text-lg">
              Estado: {statusConfig.text}
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden mb-6">
          {/* Transaction ID */}
          <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
            <p className="text-gray-400 text-sm mb-1">ID de Transacción</p>
            <p className="text-white font-mono text-lg break-all">
              {ticketData.transactionId}
            </p>
          </div>

          {/* Ticket Numbers */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">
                Tus Números de la Suerte
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {ticketData.ticketNumbers.map((number, index) => (
                <div
                  key={index}
                  className={`px-6 py-4 bg-slate-700 border-2 ${statusConfig.borderColor} rounded-xl`}
                >
                  <span
                    className={`text-2xl font-bold ${statusConfig.textColor}`}
                  >
                    {number}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Total: {ticketData.quantity}{" "}
              {ticketData.quantity === 1 ? "boleto" : "boletos"}
            </p>
          </div>

          {/* Personal Information */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">
              Información Personal
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Nombre Completo</p>
                  <p className="text-white font-medium">
                    {ticketData.fullName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">{ticketData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Teléfono</p>
                  <p className="text-white font-medium">{ticketData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Cédula</p>
                  <p className="text-white font-medium">
                    {ticketData.countryCode}-{ticketData.idNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">
              Información de Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Banco</p>
                <p className="text-white font-medium">{ticketData.bank}</p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Referencia</p>
                <p className="text-white font-medium">
                  {ticketData.referenceNumber}
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Método de Pago</p>
                <p className="text-white font-medium capitalize">
                  {ticketData.paymentMethod.replace("_", " ")}
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Precio por Boleto</p>
                <p className="text-white font-medium">
                  Bs. {ticketData.ticketPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-6 bg-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xl font-medium">
                Total Pagado
              </span>
              <span className="text-green-400 text-3xl font-bold">
                Bs. {ticketData.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Date Information */}
          <div className="p-6">
            <div className="flex items-center gap-3 text-gray-400">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-sm">Fecha de compra</p>
                <p className="text-white font-medium">
                  {formatDate(ticketData.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          {ticketData.status === "pending" && (
            <>
              <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Pago en Verificación
              </h3>
              <p className="text-gray-300">
                Tu pago está siendo verificado. Recibirás una confirmación por
                email cuando sea aprobado.
              </p>
            </>
          )}
          {ticketData.status === "confirmed" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                ¡Pago Confirmado!
              </h3>
              <p className="text-gray-300">
                Tu compra ha sido confirmada. ¡Mucha suerte en el sorteo!
              </p>
            </>
          )}
          {ticketData.status === "rejected" && (
            <>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                Pago Rechazado
              </h3>
              <p className="text-gray-300 mb-4">
                Tu pago no pudo ser verificado. Por favor contacta con soporte.
              </p>
              <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                Contactar Soporte
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
