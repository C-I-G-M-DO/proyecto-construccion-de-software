import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Static HTML can show the supplied image before the application JavaScript starts.
export default function Root({ children }: PropsWithChildren) {
  return <html lang="es">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#C00000" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/surtio-icon.png" />
      <link rel="preload" as="image" href="/surtio-splash.png" />
      <ScrollViewStyleReset />
      <style dangerouslySetInnerHTML={{ __html: `
        #surtio-boot{position:fixed;inset:0;z-index:99999;overflow:hidden;background:#30251D;color:white}
        #surtio-boot .backdrop{position:absolute;inset:0;background:url('/surtio-splash.png') center/cover;filter:blur(16px) brightness(.45);transform:scale(1.06)}
        #surtio-boot img{position:absolute;width:100%;height:100%;object-fit:contain;object-position:center}
        #surtio-boot .progress{position:absolute;bottom:max(28px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:rgba(30,20,14,.82);border-radius:24px;padding:12px 18px;font:500 14px system-ui,sans-serif;white-space:nowrap}
        #surtio-boot .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:surtio-spin .9s linear infinite}
        @keyframes surtio-spin{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){#surtio-boot .spinner{animation:none}}
      ` }} />
    </head>
    <body>
      {children}
      <div id="surtio-boot" role="status" aria-live="polite">
        <div className="backdrop" />
        <img src="/surtio-splash.png" alt="Surtío, tu negocio en buenas manos" />
        <div className="progress"><span className="spinner" aria-hidden="true" /><span>Preparando tu negocio…<noscript> Activa JavaScript para continuar.</noscript></span></div>
      </div>
    </body>
  </html>;
}
