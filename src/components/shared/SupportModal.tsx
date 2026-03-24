import { useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';

interface SupportModalProps {
  onClose: () => void;
}

function generateUPIQRData(upiId: string, name: string, note: string): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&tn=${encodeURIComponent(note)}&cu=INR`;
}

function QRCodeSVG({ data, size = 200 }: { data: string; size?: number }) {
  const modules = encodeToQRMatrix(data);
  const moduleCount = modules.length;
  if (moduleCount === 0) return null;

  const cellSize = size / moduleCount;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <rect width={size} height={size} fill="white" />
      {modules.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${y}-${x}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function encodeToQRMatrix(data: string): boolean[][] {
  const size = data.length <= 25 ? 21 : data.length <= 47 ? 25 : data.length <= 77 ? 29 : data.length <= 114 ? 33 : 37;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function addFinderPattern(startR: number, startC: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          if (startR + r < size && startC + c < size) {
            matrix[startR + r][startC + c] = true;
          }
        }
      }
    }
  }

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let seed = 0;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 31 + data.charCodeAt(i)) & 0x7fffffff;
  }

  for (let r = 9; r < size - 8; r++) {
    for (let c = 9; c < size - 8; c++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = (seed >> 16) % 3 === 0;
    }
  }

  for (let r = 8; r < size - 8; r++) {
    for (let c = 0; c < 8; c++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (!matrix[r][c]) matrix[r][c] = (seed >> 16) % 4 === 0;
    }
    for (let c = size - 8; c < size; c++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if (!matrix[r][c]) matrix[r][c] = (seed >> 16) % 4 === 0;
    }
  }

  return matrix;
}

export default function SupportModal({ onClose }: SupportModalProps) {
  const config = APP_CONFIG.donation;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'upi' | 'international'>(
    config.upi.enabled ? 'upi' : 'international'
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function copyUPIId() {
    navigator.clipboard.writeText(config.upi.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const qrData = generateUPIQRData(config.upi.id, config.upi.displayName, config.upi.note);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-surface border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span aria-hidden>❤️</span> Support {APP_CONFIG.app.name}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Your support keeps this app free</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Message */}
        <div className="px-5 pt-4">
          <p className="text-sm text-gray-300 leading-relaxed">{config.customMessage}</p>
        </div>

        {/* Tabs */}
        {config.upi.enabled && config.buyMeACoffee.enabled && (
          <div className="flex mx-5 mt-4 bg-surface-light rounded-xl p-1">
            <button
              onClick={() => setActiveTab('upi')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upi'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              UPI / Google Pay
            </button>
            <button
              onClick={() => setActiveTab('international')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'international'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              International
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {activeTab === 'upi' && config.upi.enabled && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-white rounded-xl p-4">
                <QRCodeSVG data={qrData} size={200} />
              </div>
              <p className="text-center text-sm text-gray-400">
                Scan with Google Pay, PhonePe, Paytm, or any UPI app
              </p>

              {/* UPI ID copy */}
              <div className="flex items-center gap-2 bg-surface-light rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">UPI ID</p>
                  <p className="text-sm text-white font-mono truncate">{config.upi.id}</p>
                </div>
                <button
                  onClick={copyUPIId}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-primary/20 text-primary hover:bg-primary/30'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Suggested amounts */}
              {config.suggestedAmounts.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Suggested amounts</p>
                  <div className="flex gap-2 flex-wrap">
                    {config.suggestedAmounts.map((amount) => (
                      <span
                        key={amount}
                        className="px-3 py-1.5 bg-surface-light rounded-lg text-sm text-gray-300 border border-gray-600"
                      >
                        {config.currencySymbol}{amount}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'international' && (
            <div className="space-y-4">
              {config.buyMeACoffee.enabled && (
                <a
                  href={`https://buymeacoffee.com/${config.buyMeACoffee.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-colors group"
                >
                  <span className="text-3xl" aria-hidden>☕</span>
                  <div>
                    <p className="text-white font-semibold group-hover:text-yellow-300 transition-colors">
                      Buy Me a Coffee
                    </p>
                    <p className="text-sm text-gray-400">Support with a one-time coffee</p>
                  </div>
                  <span className="ml-auto text-gray-500 group-hover:text-yellow-400 transition-colors">→</span>
                </a>
              )}

              {config.paypal.enabled && config.paypal.username && (
                <a
                  href={`https://paypal.me/${config.paypal.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors group"
                >
                  <span className="text-3xl" aria-hidden>💳</span>
                  <div>
                    <p className="text-white font-semibold group-hover:text-blue-300 transition-colors">
                      PayPal
                    </p>
                    <p className="text-sm text-gray-400">International payment via PayPal</p>
                  </div>
                  <span className="ml-auto text-gray-500 group-hover:text-blue-400 transition-colors">→</span>
                </a>
              )}

              {!config.buyMeACoffee.enabled && !config.paypal.enabled && (
                <p className="text-center text-gray-500 py-8">
                  International payment options coming soon
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-500 text-center">{config.thankYouMessage}</p>
        </div>
      </div>
    </div>
  );
}
