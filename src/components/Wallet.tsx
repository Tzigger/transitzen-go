import { useEffect, useMemo, useState } from "react";
import { Ticket, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TicketData = {
  id: string;
  ticket_id: string;
  ticket_type: string;
  price: number;
  payment_status: string;
  issued_at: string;
  expires_at: string;
  qr_data: any;
};

const Wallet = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [qrKey, setQrKey] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    setQrKey(0);
    setTimeRemaining(30);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTicket]);

  useEffect(() => {
    if (!selectedTicket || timeRemaining > 0) return;

    setQrKey((prev) => prev + 1);
    setTimeRemaining(30);
  }, [selectedTicket, timeRemaining]);

  const formatTime = (seconds: number) => `${seconds}s`;

  const currentQrValue = useMemo(() => {
    if (!selectedTicket) return "";

    return JSON.stringify({
      ...selectedTicket.qr_data,
      refreshedAt: Date.now(),
      qrVersion: qrKey,
    });
  }, [selectedTicket, qrKey]);

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Eroare",
          description: "Nu ești autentificat",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast({
          title: "Eroare",
          description: "Nu s-au putut încărca biletele",
          variant: "destructive",
        });
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isTicketExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTicketTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      simple: "Bilet simplu",
      day: "Abonament 1 zi",
      month: "Abonament 1 lună",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Ticket className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Biletele mele</h2>
      </div>

      {tickets.length === 0 ? (
        <div className="glass p-8 rounded-[2rem] text-center">
          <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nu ai niciun bilet încă</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const expired = isTicketExpired(ticket.expires_at);
            
            return (
              <div
                key={ticket.id}
                onClick={() => !expired && setSelectedTicket(ticket)}
                className={`glass p-5 rounded-[2rem] border-white/10 transition-all ${
                  expired ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {expired ? (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      <span className="font-semibold text-foreground">
                        {getTicketTypeName(ticket.ticket_type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {ticket.ticket_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{ticket.price} lei</p>
                    {expired ? (
                      <span className="text-xs text-muted-foreground">Expirat</span>
                    ) : (
                      <span className="text-xs text-green-500">Activ</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
                  <div>
                    <p className="text-muted-foreground">Emis:</p>
                    <p className="text-foreground">{formatDate(ticket.issued_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Expiră:</p>
                    <p className="text-foreground">{formatDate(ticket.expires_at)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Codul QR al biletului</DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-2xl">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip bilet:</span>
                    <span className="font-semibold">{getTicketTypeName(selectedTicket.ticket_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{selectedTicket.ticket_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preț:</span>
                    <span className="font-semibold text-primary">{selectedTicket.price} lei</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl flex items-center justify-center gap-4">
                <Clock className="w-8 h-8 text-primary shrink-0" />
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-foreground tabular-nums">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-muted-foreground">secunde până la reîmprospătare</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl flex items-center justify-center">
                <QRCodeSVG
                  key={qrKey}
                  value={currentQrValue}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Prezintă acest cod QR controlului pentru validare
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
