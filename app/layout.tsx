import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Ugbekun - School Management System',
  description: 'Modern school management platform with QR attendance, online classes, fees management, exams, and parent/student portals',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var testKey = '__storage_test__';
                  window.localStorage.setItem(testKey, testKey);
                  window.localStorage.removeItem(testKey);
                } catch (e) {
                  console.warn('localStorage is restricted (e.g. private browsing). Applying memory/cookie fallback.');
                  var memoryStore = {};
                  try {
                    var originalSet = Storage.prototype.setItem;
                    Storage.prototype.setItem = function(key, value) {
                      try {
                        originalSet.call(this, key, value);
                      } catch (err) {
                        memoryStore[key] = String(value);
                        try {
                          document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; path=/; max-age=31536000; SameSite=Lax";
                        } catch (ce) {}
                      }
                    };

                    var originalGet = Storage.prototype.getItem;
                    Storage.prototype.getItem = function(key) {
                      try {
                        var val = originalGet.call(this, key);
                        if (val !== null) return val;
                      } catch (err) {}
                      if (key in memoryStore) return memoryStore[key];
                      try {
                        var prefix = encodeURIComponent(key) + "=";
                        var cookies = document.cookie.split('; ');
                        for (var i = 0; i < cookies.length; i++) {
                          if (cookies[i].indexOf(prefix) === 0) {
                            return decodeURIComponent(cookies[i].substring(prefix.length));
                          }
                        }
                      } catch (ce) {}
                      return null;
                    };

                    var originalRemove = Storage.prototype.removeItem;
                    Storage.prototype.removeItem = function(key) {
                      try {
                        originalRemove.call(this, key);
                      } catch (err) {}
                      delete memoryStore[key];
                      try {
                        document.cookie = encodeURIComponent(key) + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                      } catch (ce) {}
                    };
                  } catch (patchError) {
                    console.error('Failed to patch Storage.prototype:', patchError);
                  }
                }
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
