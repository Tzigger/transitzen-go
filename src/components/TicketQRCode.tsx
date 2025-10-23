import { useEffect, useState, useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Clock, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TicketQRCodeProps {
  ticketId: string;
  ticketType: string;
  price: number;
  onClose: () => void;
}

const QR_REFRESH_INTERVAL = 30; // seconds until QR regenerates

const TicketQRCode = ({ ticketId, ticketType, price, onClose }: TicketQRCodeProps) => {
  const [timeRemaining, setTimeRemaining] = useState(QR_REFRESH_INTERVAL);
  const [qrKey, setQrKey] = useState(0); // Key to force QR code re-render
  const expiryTime = useRef(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const expiryIso = useMemo(() => expiryTime.current.toISOString(), []);

  useEffect(() => {
    // Countdown until QR refresh
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (timeRemaining === 0) {
      setQrKey((prevKey) => prevKey + 1);
      setTimeRemaining(QR_REFRESH_INTERVAL);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => `${seconds}s`;

  const qrValue = useMemo(
    () =>
      JSON.stringify({
        ticketId,
        ticketType,
        price,
        expiryTime: expiryIso,
        refreshedAt: Date.now(),
        qrVersion: qrKey,
      }),
    [ticketId, ticketType, price, expiryIso, qrKey],
  );

  const downloadQRCode = () => {
    const svg = document.getElementById("ticket-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `bilet-${ticketId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="glass p-6 rounded-[2rem] border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-semibold text-foreground">Bilet activ</h3>
        </div>
      </div>

      {/* Ticket Info */}
      <div className="glass-card p-4 rounded-2xl mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tip bilet:</span>
            <span className="font-semibold text-foreground">{ticketType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Preț:</span>
            <span className="font-semibold text-primary">{price} lei</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID:</span>
            <span className="font-mono text-sm text-foreground">{ticketId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expiră la:</span>
            <span className="text-foreground">
              {expiryTime.current.toLocaleTimeString("ro-RO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="glass-card p-4 rounded-2xl mb-6 flex items-center justify-center gap-4">
        <Clock className="w-8 h-8 text-primary shrink-0" />
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold text-foreground tabular-nums">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-muted-foreground">secunde până la reîmprospătare</div>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white p-6 rounded-2xl mb-6 flex items-center justify-center">
        <QRCodeSVG
          id="ticket-qr-code"
          key={qrKey}
          value={qrValue}
          size={220}
          level="H"
          includeMargin
        />
      </div>

      <p className="text-sm text-muted-foreground text-center mb-6">
        Prezintă acest cod QR controlului pentru validare
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={downloadQRCode}
          variant="outline"
          className="w-full h-12 rounded-2xl"
        >
          <Download className="w-4 h-4 mr-2" />
          Descarcă bilet
        </Button>

        <Button
          onClick={onClose}
          className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl"
        >
          Închide
        </Button>
      </div>
    </div>
  );
};

export default TicketQRCode;
