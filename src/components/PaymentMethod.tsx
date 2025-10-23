import { useState } from "react";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/convex";

type PaymentMethodType = "card" | "apple-pay" | "google-pay" | "paypal" | "klarna";

interface PaymentMethodProps {
  ticketPrice: number;
  ticketType: "simple" | "day" | "month";
  ticketTypeName: string;
  onPaymentSuccess: (ticketId: string) => void;
  onBack: () => void;
}

const PaymentMethod = ({ ticketPrice, ticketType, ticketTypeName, onPaymentSuccess, onBack }: PaymentMethodProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { userId } = useAuth();
  const createTicketMutation = useMutation(api.tickets.createTicket);

  const validateCard = (number: string): boolean => {
    // Luhn algorithm for card validation
    const digits = number.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(digits)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\s/g, "");
    const formatted = digits.match(/.{1,4}/g)?.join(" ") || digits;
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const handlePayment = async () => {
    if (paymentMethod === "card") {
      // Validate card details
      if (!cardName.trim()) {
        toast({
          title: "Eroare",
          description: "Te rugăm să introduci numele de pe card",
          variant: "destructive",
        });
        return;
      }

      const cleanCardNumber = cardNumber.replace(/\s/g, "");
      if (!validateCard(cleanCardNumber)) {
        toast({
          title: "Card invalid",
          description: "Numărul cardului introdus nu este valid",
          variant: "destructive",
        });
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        toast({
          title: "Eroare",
          description: "Data de expirare trebuie să fie în formatul LL/AA",
          variant: "destructive",
        });
        return;
      }

      if (!/^\d{3,4}$/.test(cvv)) {
        toast({
          title: "Eroare",
          description: "CVV-ul trebuie să aibă 3 sau 4 cifre",
          variant: "destructive",
        });
        return;
      }
    }

    if (!userId) {
      toast({
        title: "Eroare",
        description: "Nu ești autentificat",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Generate ticket ID
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Calculate expiry time based on ticket type
      let expiryMilliseconds: number;
      switch (ticketType) {
        case "simple":
          expiryMilliseconds = 2 * 60 * 60 * 1000; // 2 hours
          break;
        case "day":
          expiryMilliseconds = 24 * 60 * 60 * 1000; // 24 hours
          break;
        case "month":
          expiryMilliseconds = 30 * 24 * 60 * 60 * 1000; // 30 days
          break;
        default:
          expiryMilliseconds = 2 * 60 * 60 * 1000; // Default to 2 hours
      }
      
      const expiresAt = new Date(Date.now() + expiryMilliseconds);

      // Save ticket to database using Convex
      await createTicketMutation({
        userId,
        ticketId,
        ticketType,
        price: ticketPrice,
        paymentMethod,
        expiresAt: expiresAt.toISOString(),
        qrData: {
          ticketId,
          price: ticketPrice,
          expiryTime: expiresAt.toISOString(),
        },
      });

      // Note: Email sending would require a Convex action
      // For now, we'll skip the email confirmation

      toast({
        title: "Plată reușită! 🎉",
        description: "Biletul tău a fost generat cu succes.",
      });

      onPaymentSuccess(ticketId);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la procesarea plății",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass p-5 rounded-[2rem] border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-auto"
        >
          ← Înapoi
        </Button>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">
        Alege metoda de plată
      </h3>

      <div className="mb-6 p-4 glass-card rounded-2xl">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total de plată:</span>
          <span className="text-2xl font-bold text-primary">{ticketPrice} lei</span>
        </div>
      </div>

      <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}>
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-4 glass-card rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>Card bancar</span>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 glass-card rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
            <RadioGroupItem value="apple-pay" id="apple-pay" />
            <Label htmlFor="apple-pay" className="flex items-center gap-2 cursor-pointer flex-1">
              <Smartphone className="w-5 h-5 text-primary" />
              <span>Apple Pay</span>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 glass-card rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
            <RadioGroupItem value="google-pay" id="google-pay" />
            <Label htmlFor="google-pay" className="flex items-center gap-2 cursor-pointer flex-1">
              <Smartphone className="w-5 h-5 text-primary" />
              <span>Google Pay</span>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 glass-card rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
              <Wallet className="w-5 h-5 text-primary" />
              <span>PayPal</span>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-4 glass-card rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
            <RadioGroupItem value="klarna" id="klarna" />
            <Label htmlFor="klarna" className="flex items-center gap-2 cursor-pointer flex-1">
              <Wallet className="w-5 h-5 text-primary" />
              <span>Klarna</span>
            </Label>
          </div>
        </div>
      </RadioGroup>

      {paymentMethod === "card" && (
        <div className="space-y-4 mb-6 animate-fade-in">
          <div>
            <Label htmlFor="cardName" className="text-sm text-muted-foreground mb-2 block">
              Nume pe card
            </Label>
            <Input
              id="cardName"
              placeholder="ION POPESCU"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              className="h-12 rounded-2xl glass-card border-white/20"
            />
          </div>

          <div>
            <Label htmlFor="cardNumber" className="text-sm text-muted-foreground mb-2 block">
              Număr card
            </Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              className="h-12 rounded-2xl glass-card border-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate" className="text-sm text-muted-foreground mb-2 block">
                Data expirării
              </Label>
              <Input
                id="expiryDate"
                placeholder="MM/AA"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                maxLength={5}
                className="h-12 rounded-2xl glass-card border-white/20"
              />
            </div>

            <div>
              <Label htmlFor="cvv" className="text-sm text-muted-foreground mb-2 block">
                CVV
              </Label>
              <Input
                id="cvv"
                type="password"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="h-12 rounded-2xl glass-card border-white/20"
              />
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl transition-all"
      >
        {isProcessing ? "Se procesează..." : `Plătește ${ticketPrice} lei`}
      </Button>
    </div>
  );
};

export default PaymentMethod;
