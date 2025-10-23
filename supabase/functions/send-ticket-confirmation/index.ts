import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    console.log("Email confirmation requested for:", email);

    // For now, just log the email details
    // In production, integrate with Resend when needed
    const expiryDate = new Date(expiresAt);
    const formattedExpiry = expiryDate.toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log("Ticket details:", {
      email,
      firstName,
      ticketId,
      ticketType,
      price,
      formattedExpiry,
    });

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email notification logged. Configure RESEND_API_KEY for actual email delivery."
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
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
