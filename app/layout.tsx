import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gana con Ivan",
  description: "Cambia tu vida con Ivan",
};

export const runtime = "nodejs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <html lang="en">
      <head>
        {/* Google Ads */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17833556210"
          strategy="afterInteractive"
        />
        <Script id="gtag-aw-17833556210" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17833556210');
          `}
        </Script>
        
        {/* Meta Pixel - Script principal */}
        <Script
          id="fb-pixel-script"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="afterInteractive"
        />
        
        {/* Meta Pixel - Inicialización (versión mejorada) */}
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            // Inicializar queue antes de que cargue el script
            window.fbq = window.fbq || function() {
              (window.fbq.queue = window.fbq.queue || []).push(arguments);
            };
            
            if (!window._fbq) window._fbq = window.fbq;
            window.fbq.push = window.fbq;
            window.fbq.loaded = false;
            window.fbq.version = '2.0';
            window.fbq.queue = [];
            
            // Función de inicialización robusta
            function initFacebookPixel() {
              console.log('🔄 Intentando inicializar Facebook Pixel...');
              
              // Verificar si el script ya cargó
              var fbScript = document.querySelector('script[src*="fbevents.js"]');
              if (!fbScript) {
                console.warn('⚠️ Script de Facebook no encontrado en DOM');
                return false;
              }
              
              // Verificar si fbq está disponible
              if (typeof fbq === 'undefined') {
                console.warn('⚠️ fbq no definido aún');
                return false;
              }
              
              try {
                // Inicializar el pixel
                fbq('init', '926409043392429');
                console.log('✅ Pixel inicializado: 926409043392429');
                
                // Enviar PageView
                fbq('track', 'PageView', {}, {
                  eventID: 'pv_' + Date.now(),
                  debug: true
                });
                console.log('✅ PageView enviado');
                
                // Marcar como inicializado
                window.fbqInitialized = true;
                window.fbq.loaded = true;
                
                // Notificar a otros componentes
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('fbq:ready'));
                }
                
                return true;
              } catch (error) {
                console.error('❌ Error inicializando pixel:', error);
                return false;
              }
            }
            
            // Estrategia de inicialización múltiple
            function startPixelInitialization() {
              console.log('🚀 Iniciando proceso de pixel...');
              
              // Intentar inmediatamente
              var initialized = initFacebookPixel();
              
              // Si no funcionó, reintentar
              if (!initialized) {
                var attempts = 0;
                var maxAttempts = 5;
                
                var retryInterval = setInterval(function() {
                  attempts++;
                  console.log('🔄 Reintento #' + attempts + '...');
                  
                  if (initFacebookPixel()) {
                    clearInterval(retryInterval);
                    console.log('🎉 Pixel inicializado exitosamente en intento #' + attempts);
                  } else if (attempts >= maxAttempts) {
                    clearInterval(retryInterval);
                    console.error('❌ Máximo de reintentos alcanzado');
                    
                    // Fallback: cargar script manualmente
                    var script = document.createElement('script');
                    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
                    script.async = true;
                    script.onload = function() {
                      setTimeout(initFacebookPixel, 1000);
                    };
                    document.head.appendChild(script);
                  }
                }, 1000);
              }
            }
            
            // Iniciar cuando el documento esté listo
            if (document.readyState === 'complete') {
              console.log('📄 Documento ya está completo');
              startPixelInitialization();
            } else {
              console.log('📄 Esperando carga del documento...');
              window.addEventListener('load', startPixelInitialization);
              document.addEventListener('DOMContentLoaded', startPixelInitialization);
            }
            
            // Fallback absoluto
            setTimeout(startPixelInitialization, 3000);
            
            // Debug helper para consola
            if (typeof window !== 'undefined') {
              window.debugFacebookPixel = function() {
                console.log('=== 🎯 DEBUG FACEBOOK PIXEL ===');
                console.log('Pixel ID: 926409043392429');
                console.log('fbq definido:', typeof fbq !== 'undefined');
                console.log('fbq.queue:', fbq ? (fbq.queue || []) : 'No fbq');
                console.log('fbq.loaded:', fbq ? fbq.loaded : 'No fbq');
                console.log('Para testear manualmente:');
                console.log('fbq("track", "PageView", {}, {eventID: "test_" + Date.now()})');
              };
            }
          `}
        </Script>
        
        {/* Noscript fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=926409043392429&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        
        {/* Script de debug condicional */}
        {isDevelopment && (
          <Script id="development-debug" strategy="afterInteractive">
            {`
              // Solo en desarrollo
              console.log('%c🔧 MODO DESARROLLO: Meta Pixel Debug', 
                'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px;');
              
              // Exponer funciones de test
              window.testMetaPixelEvent = function(eventName, params) {
                if (typeof fbq !== 'undefined') {
                  var eventId = 'dev_' + eventName + '_' + Date.now();
                  fbq('track', eventName, params || {}, {eventID: eventId});
                  console.log('✅ Evento de desarrollo enviado:', eventName, eventId);
                  return eventId;
                } else {
                  console.error('❌ fbq no disponible para test');
                  return false;
                }
              };
              
              // Auto-test después de 3 segundos
              setTimeout(function() {
                if (typeof fbq !== 'undefined' && window.fbqInitialized) {
                  window.testMetaPixelEvent('ViewContent', {
                    content_name: 'Development Test',
                    content_category: 'debug'
                  });
                }
              }, 3000);
            `}
          </Script>
        )}
      </body>
    </html>
  );
}