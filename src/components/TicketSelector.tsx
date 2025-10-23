import { useState } from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaymentMethod from "./PaymentMethod";
import TicketQRCode from "./TicketQRCode";

type TicketType = {
  id: string;
  name: string;
  price: number;
};

const ticketTypes: TicketType[] = [
  { id: "simple", name: "Bilet simplu", price: 4 },
  { id: "day", name: "Abonament 1 zi", price: 15 },
  { id: "month", name: "Abonament 1 lună", price: 120 },
];

type Step = "select" | "payment" | "qr";

const TicketSelector = () => {
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [ticketId, setTicketId] = useState<string>("");

  const selectedTicketData = ticketTypes.find((t) => t.id === selectedTicket);

  const handleContinueToPayment = () => {
    if (selectedTicket) {
      setCurrentStep("payment");
    }
  };

  const handlePaymentSuccess = (newTicketId: string) => {
    setTicketId(newTicketId);
    setCurrentStep("qr");
  };

  const handleBackToSelect = () => {
    setCurrentStep("select");
  };

  const handleCloseQR = () => {
    setSelectedTicket("");
    setTicketId("");
    setCurrentStep("select");
  };

  if (currentStep === "payment" && selectedTicketData) {
    return (
      <PaymentMethod
        ticketPrice={selectedTicketData.price}
        onPaymentSuccess={handlePaymentSuccess}
        onBack={handleBackToSelect}
      />
    );
  }

  if (currentStep === "qr" && selectedTicketData) {
    return (
      <TicketQRCode
        ticketId={ticketId}
        ticketType={selectedTicketData.name}
        price={selectedTicketData.price}
        onClose={handleCloseQR}
      />
    );
  }

  return (
    <div className="glass p-5 rounded-[2rem] border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Achiziționează bilet</h3>
      </div>

      <Select value={selectedTicket} onValueChange={setSelectedTicket}>
        <SelectTrigger className="w-full h-14 rounded-2xl glass-card border-white/20 text-base">
          <SelectValue placeholder="Selectează tipul de bilet" />
        </SelectTrigger>
        <SelectContent>
          {ticketTypes.map((ticket) => (
            <SelectItem key={ticket.id} value={ticket.id}>
              <div className="flex items-center justify-between w-full gap-8">
                <span>{ticket.name}</span>
                <span className="font-semibold text-primary">{ticket.price} lei</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTicketData && (
        <div className="mt-4 flex items-center justify-between p-4 glass-card rounded-2xl animate-fade-in">
          <span className="text-sm text-muted-foreground">Preț total:</span>
          <span className="text-2xl font-bold text-foreground">
            {selectedTicketData.price} lei
          </span>
        </div>
      )}

      <Button
        onClick={handleContinueToPayment}
        disabled={!selectedTicket}
        className="w-full h-14 mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl transition-all disabled:opacity-50"
      >
        Continuă la plată
      </Button>
    </div>
  );
};

export default TicketSelector;
