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
        
        {/* Meta Pixel - Implementación simplificada */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            fbq('init', '1407896300775294');
            fbq('track', 'PageView');
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
          <Script id="development-debug" strategy="lazyOnload">
            {`
              console.log('%c🔧 Meta Pixel Debug Mode', 
                'background: #1877F2; color: white; padding: 5px 10px; border-radius: 3px;');
              
              // Función de test
              window.testMetaPixel = function(eventName, params) {
                if (typeof fbq !== 'undefined') {
                  fbq('track', eventName, params || {});
                  console.log('✅ Test event sent:', eventName, params);
                } else {
                  console.error('❌ fbq not available');
                }
              };
              
              // Verificar que el pixel está cargado
              setTimeout(function() {
                if (typeof fbq !== 'undefined') {
                  console.log('✅ Meta Pixel loaded successfully');
                  console.log('Test command: testMetaPixel("ViewContent", {content_name: "test"})');
                } else {
                  console.error('❌ Meta Pixel failed to load');
                }
              }, 2000);
            `}
          </Script>
        )}
      </body>
    </html>
  );
}