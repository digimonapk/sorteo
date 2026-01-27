'use client';

import { useEffect, useState } from 'react';

// Declarar tipos para TypeScript
declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string): void;
      (command: 'track', event: string, params?: any, options?: any): void;
      (command: 'set', property: string, value: any): void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
    };
    fbqInitialized?: boolean;
    debugFacebookPixel?: () => void;
    testMetaPixelEvent?: (eventName: string, params?: any) => string | false;
  }
}

const PixelDebug = () => {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    console.log('🎯 PixelDebug component mounted');
    
    const checkPixel = () => {
      console.log('🔍 Checking Facebook Pixel status...');
      
      const pixelReady = 
        typeof window.fbq !== 'undefined' && 
        window.fbqInitialized === true;
      
      console.log('📊 Status:', {
        fbqExists: typeof window.fbq !== 'undefined',
        fbqInitialized: window.fbqInitialized,
        fbqLoaded: window.fbq?.loaded,
        queueLength: window.fbq?.queue?.length || 0
      });
      
      if (pixelReady) {
        setStatus('ready');
        sendInitialTestEvents();
      } else {
        setStatus('checking');
        // Reintentar en 2 segundos
        setTimeout(checkPixel, 2000);
      }
    };
    
    const sendInitialTestEvents = () => {
      if (typeof window.fbq === 'undefined') return;
      
      try {
        // Activar modo debug
        window.fbq('set', 'debug', 'on');
        
        // Evento 1: PageView de debug
        const pageViewId = 'debug_init_' + Date.now();
        window.fbq('track', 'PageView', {
          debug_component: 'PixelDebug',
          debug_time: new Date().toISOString()
        }, {
          eventID: pageViewId
        });
        
        // Evento 2: Custom debug event
        const customId = 'debug_component_' + Date.now();
        window.fbq('track', 'Custom', {
          debug_action: 'component_mount',
          test_code: 'TEST34436',
          environment: process.env.NODE_ENV
        }, {
          eventID: customId
        });
        
        setEvents([pageViewId, customId]);
        console.log('✅ Eventos iniciales enviados:', [pageViewId, customId]);
        
      } catch (error) {
        console.error('❌ Error enviando eventos:', error);
        setStatus('error');
      }
    };
    
    // Escuchar evento de pixel listo
    const handlePixelReady = () => {
      console.log('🎉 Received fbq:ready event');
      checkPixel();
    };
    
    window.addEventListener('fbq:ready', handlePixelReady);
    
    // Iniciar chequeo después de montar
    const initialDelay = setTimeout(checkPixel, 1000);
    
    // Crear interfaz de debug
    const createDebugInterface = () => {
      // Remover interfaz existente
      const existingUI = document.getElementById('pixel-debug-ui');
      if (existingUI) existingUI.remove();
      
      // Crear contenedor
      const debugUI = document.createElement('div');
      debugUI.id = 'pixel-debug-ui';
      debugUI.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 99999;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border: 2px solid #1877F2;
      `;
      
      // Status indicator
      const statusColor = status === 'ready' ? '#4CAF50' : 
                         status === 'error' ? '#F44336' : '#FF9800';
      
      debugUI.innerHTML = `
        <div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 10px;">
          <strong style="color: #1877F2;">🎯 Facebook Pixel Debug</strong>
          <div style="display: flex; align-items: center; margin-top: 5px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${statusColor}; margin-right: 8px;"></div>
            <span>Status: ${status.toUpperCase()}</span>
          </div>
          <div style="font-size: 10px; color: #aaa; margin-top: 5px;">
            ID: 926409043392429
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <div style="font-size: 11px; color: #ccc; margin-bottom: 5px;">Events Sent (${events.length}):</div>
          <div style="max-height: 100px; overflow-y: auto; background: #111; padding: 5px; border-radius: 3px; font-size: 10px;">
            ${events.map(event => `<div style="color: #4CAF50; margin-bottom: 2px;">✓ ${event}</div>`).join('')}
            ${events.length === 0 ? '<div style="color: #FF9800;">No events sent yet</div>' : ''}
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="test-pageview" style="
            background: #1877F2;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            flex: 1;
          ">Test PageView</button>
          
          <button id="test-lead" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            flex: 1;
          ">Test Lead</button>
        </div>
        
        <div style="margin-top: 10px; font-size: 10px; color: #888;">
          ${process.env.NODE_ENV === 'development' ? '🛠 Development Mode' : '🚀 Production Mode'}
        </div>
      `;
      
      document.body.appendChild(debugUI);
      
      // Event handlers para botones
      document.getElementById('test-pageview')?.addEventListener('click', () => {
        if (window.testMetaPixelEvent) {
          const eventId = window.testMetaPixelEvent('PageView', {
            test_mode: true,
            source: 'debug_ui'
          });
          if (eventId) {
            setEvents(prev => [...prev, eventId]);
          }
        }
      });
      
      document.getElementById('test-lead')?.addEventListener('click', () => {
        if (window.testMetaPixelEvent) {
          const eventId = window.testMetaPixelEvent('Lead', {
            value: 99.99,
            currency: 'USD',
            test_mode: true,
            test_event_code: 'TEST34436'
          });
          if (eventId) {
            setEvents(prev => [...prev, eventId]);
          }
        }
      });
      
      return debugUI;
    };
    
    const debugUI = createDebugInterface();
    
    // Actualizar interfaz cuando cambie el estado
    const updateInterval = setInterval(() => {
      debugUI.querySelector('strong')!.innerHTML = `🎯 Facebook Pixel Debug (${new Date().toLocaleTimeString()})`;
    }, 1000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(updateInterval);
      window.removeEventListener('fbq:ready', handlePixelReady);
      debugUI.remove();
    };
  }, [status, events]);
  
  return null; // Este componente no renderiza nada en el DOM de React
};

export default PixelDebug;