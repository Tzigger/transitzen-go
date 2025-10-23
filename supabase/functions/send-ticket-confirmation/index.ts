import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketEmailRequest {
  email: string;
  firstName: string;
  ticketId: string;
  ticketType: string;
  price: number;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, ticketId, ticketType, price, expiresAt }: TicketEmailRequest = await req.json();

    console.log("Sending ticket confirmation to:", email);

    const expiryDate = new Date(expiresAt);
    const formattedExpiry = expiryDate.toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailResponse = await resend.emails.send({
      from: "Transport București <onboarding@resend.dev>",
      to: [email],
      subject: "Confirmare achiziție bilet - Transport București",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .ticket-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .ticket-row:last-child { border-bottom: none; }
              .label { color: #666; }
              .value { font-weight: bold; color: #333; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
              .important { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎫 Bilet achiziționat cu succes!</h1>
              </div>
              
              <div class="content">
                <p>Bună ${firstName}!</p>
                <p>Îți mulțumim pentru achiziția biletului. Mai jos găsești detaliile comenzii tale:</p>
                
                <div class="ticket-info">
                  <div class="ticket-row">
                    <span class="label">ID bilet:</span>
                    <span class="value">${ticketId}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">Tip bilet:</span>
                    <span class="value">${ticketType}</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">Preț:</span>
                    <span class="value">${price} lei</span>
                  </div>
                  <div class="ticket-row">
                    <span class="label">Data expirării:</span>
                    <span class="value">${formattedExpiry}</span>
                  </div>
                </div>

                <div class="important">
                  <strong>⚠️ Important:</strong> 
                  <p>Accesează aplicația pentru a vizualiza codul QR al biletului. Prezintă codul QR controlului pentru validare.</p>
                </div>

                <p>Poți găsi toate biletele tale în secțiunea <strong>Wallet</strong> din aplicație.</p>
                
                <p>Călătorie plăcută! 🚌</p>
              </div>
              
              <div class="footer">
                <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
                <p>&copy; 2025 Transport București. Toate drepturile rezervate.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ticket-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
