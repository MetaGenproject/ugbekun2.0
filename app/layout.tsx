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
                function checkStorageSupport() {
                  try {
                    var testKey = '__storage_test__';
                    window.localStorage.setItem(testKey, testKey);
                    var val = window.localStorage.getItem(testKey);
                    window.localStorage.removeItem(testKey);
                    return val === testKey;
                  } catch (e) {
                    return false;
                  }
                }

                if (!checkStorageSupport()) {
                  console.warn('localStorage is restricted or not supported. Overwriting window.localStorage with a robust cookie/memory fallback.');
                  
                  var makeMockStorage = function() {
                    var memoryStore = {};
                    
                    try {
                      var cookies = document.cookie.split('; ');
                      for (var i = 0; i < cookies.length; i++) {
                        var parts = cookies[i].split('=');
                        if (parts.length >= 2) {
                          var key = decodeURIComponent(parts[0]);
                          var value = decodeURIComponent(parts.slice(1).join('='));
                          memoryStore[key] = value;
                        }
                      }
                    } catch (ce) {}

                    return {
                      getItem: function(key) {
                        var k = String(key);
                        return k in memoryStore ? memoryStore[k] : null;
                      },
                      setItem: function(key, value) {
                        var k = String(key);
                        var v = String(value);
                        memoryStore[k] = v;
                        try {
                          document.cookie = encodeURIComponent(k) + "=" + encodeURIComponent(v) + "; path=/; max-age=31536000; SameSite=Lax";
                        } catch (ce) {}
                      },
                      removeItem: function(key) {
                        var k = String(key);
                        delete memoryStore[k];
                        try {
                          document.cookie = encodeURIComponent(k) + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
                        } catch (ce) {}
                      },
                      clear: function() {
                        for (var key in memoryStore) {
                          if (memoryStore.hasOwnProperty(key)) {
                            this.removeItem(key);
                          }
                        }
                        memoryStore = {};
                      },
                      key: function(index) {
                        var keys = Object.keys(memoryStore);
                        return keys[index] || null;
                      },
                      get length() {
                        return Object.keys(memoryStore).length;
                      }
                    };
                  };

                  try {
                    Object.defineProperty(window, 'localStorage', {
                      value: makeMockStorage(),
                      writable: true,
                      configurable: true
                    });
                    Object.defineProperty(window, 'sessionStorage', {
                      value: makeMockStorage(),
                      writable: true,
                      configurable: true
                    });
                  } catch (definePropertyError) {
                    window.localStorage = makeMockStorage();
                    window.sessionStorage = makeMockStorage();
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
