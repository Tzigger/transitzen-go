import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Journey {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  arrival_date: string;
  arrival_time: string;
  departure_time: string;
  estimated_duration: number;
  notify_departure: boolean;
  notify_delays: boolean;
  notify_crowding: boolean;
  notify_route_changes: boolean;
  route_details: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    console.log(`Checking for journeys on ${currentDate} around ${currentTime}`);

    // Get all active journeys for today
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('*, profiles!inner(email, first_name)')
      .eq('is_active', true)
      .eq('arrival_date', currentDate);

    if (journeysError) {
      console.error('Error fetching journeys:', journeysError);
      throw journeysError;
    }

    console.log(`Found ${journeys?.length || 0} active journeys for today`);

    if (!journeys || journeys.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active journeys found for today', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];

    for (const journey of journeys) {
      const departureTime = journey.departure_time;
      if (!departureTime) continue;

      // Calculate time until departure (in minutes)
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      const [currHours, currMinutes] = currentTime.split(':').map(Number);
      
      const departureInMinutes = depHours * 60 + depMinutes;
      const currentInMinutes = currHours * 60 + currMinutes;
      const minutesUntilDeparture = departureInMinutes - currentInMinutes;

      console.log(`Journey ${journey.id}: ${minutesUntilDeparture} minutes until departure`);

      // Send notification 15 minutes before departure
      if (journey.notify_departure && minutesUntilDeparture > 0 && minutesUntilDeparture <= 15) {
        const userEmail = journey.profiles?.email;
        const userName = journey.profiles?.first_name || 'User';

        if (userEmail && resendApiKey) {
          try {
            // Send email notification
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'GoIasi <notifications@goisasi.com>',
                to: [userEmail],
                subject: `🚌 Timpul să pleci către ${journey.destination}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Salut ${userName}! 👋</h2>
                    <p style="font-size: 16px; line-height: 1.6;">
                      Este timpul să pleci pentru călătoria ta planificată!
                    </p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>De la:</strong> ${journey.origin}</p>
                      <p style="margin: 5px 0;"><strong>Către:</strong> ${journey.destination}</p>
                      <p style="margin: 5px 0;"><strong>Plecare:</strong> ${departureTime}</p>
                      <p style="margin: 5px 0;"><strong>Durată estimată:</strong> ${journey.estimated_duration} minute</p>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">
                      Pleacă în ${minutesUntilDeparture} minute pentru a ajunge la timp! 🚀
                    </p>
                  </div>
                `,
              }),
            });

            if (emailResponse.ok) {
              console.log(`Notification sent to ${userEmail} for journey ${journey.id}`);
              notifications.push({
                journeyId: journey.id,
                email: userEmail,
                type: 'departure',
                status: 'sent',
              });
            } else {
              const errorData = await emailResponse.text();
              console.error(`Failed to send email to ${userEmail}:`, errorData);
              notifications.push({
                journeyId: journey.id,
                email: userEmail,
                type: 'departure',
                status: 'failed',
                error: errorData,
              });
            }
          } catch (emailError) {
            console.error(`Error sending email for journey ${journey.id}:`, emailError);
            const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
            notifications.push({
              journeyId: journey.id,
              email: userEmail,
              type: 'departure',
              status: 'error',
              error: errorMsg,
            });
          }
        }
      }

      // Check for high crowding and send notification
      if (journey.notify_crowding && journey.route_details?.segments) {
        const highCrowdingSegments = journey.route_details.segments.filter(
          (seg: any) => seg.crowdingLevel === 'high' && seg.mode === 'TRANSIT'
        );

        if (highCrowdingSegments.length > 0 && minutesUntilDeparture > 0 && minutesUntilDeparture <= 30) {
          const userEmail = journey.profiles?.email;
          const userName = journey.profiles?.first_name || 'User';

          if (userEmail && resendApiKey) {
            try {
              const crowdedLines = highCrowdingSegments
                .map((seg: any) => `${seg.vehicle?.line} (${seg.from} → ${seg.to})`)
                .join(', ');

              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'GoIasi <notifications@goisasi.com>',
                  to: [userEmail],
                  subject: `⚠️ Aglomerație ridicată pe ruta ta`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #dc2626;">Atenție, ${userName}! ⚠️</h2>
                      <p style="font-size: 16px; line-height: 1.6;">
                        Traseele următoare pe ruta ta sunt aglomerate:
                      </p>
                      <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc2626;">
                        <p style="margin: 5px 0;"><strong>Linii aglomerate:</strong></p>
                        <p style="margin: 10px 0; color: #991b1b;">${crowdedLines}</p>
                      </div>
                      <p style="font-size: 14px; color: #6b7280;">
                        Ia în considerare să pleci mai devreme sau să alegi o rută alternativă.
                      </p>
                    </div>
                  `,
                }),
              });

              if (emailResponse.ok) {
                console.log(`Crowding notification sent to ${userEmail} for journey ${journey.id}`);
                notifications.push({
                  journeyId: journey.id,
                  email: userEmail,
                  type: 'crowding',
                  status: 'sent',
                });
              }
            } catch (emailError) {
              console.error(`Error sending crowding notification for journey ${journey.id}:`, emailError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        count: notifications.length,
        notifications 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-journey-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
