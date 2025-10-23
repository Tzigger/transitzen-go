import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  email: string;
  first_name: string | null;
}

type JourneyStatus = "scheduled" | "active" | "completed" | "cancelled";
type NotificationType = "pre_departure" | "departure";

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
  status: JourneyStatus;
  started_at: string | null;
  is_active: boolean;
  pre_departure_notified_at: string | null;
  departure_notified_at: string | null;
  profiles?: UserProfile;
}

const PRE_DEPARTURE_MINUTES = 5;

const buildNotificationCopy = (type: NotificationType, journey: Journey, departureTime: string) => {
  if (type === "pre_departure") {
    return {
      title: "Pregătește-te de plecare",
      body: `Pregătește-te să pleci la ${departureTime} către ${journey.destination}.`,
    };
  }

  return {
    title: "Este timpul să pleci",
    body: `Trebuie să pleci acum spre ${journey.destination}.`,
  };
};

const enqueueNotification = async (
  supabase: any,
  journey: Journey,
  type: NotificationType,
  title: string,
  body: string,
  timestamp: string,
) => {
  const { error } = await supabase.from('journey_notifications').insert({
    user_id: journey.user_id,
    journey_id: journey.id,
    type,
    title,
    body,
    scheduled_at: timestamp,
    sent_at: timestamp,
  });

  if (error) {
    console.error(`Error recording ${type} notification for journey ${journey.id}:`, error);
  }
};

serve(async (req: Request) => {
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
      .eq('status', 'scheduled')
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

    const notifications: Array<{
      journeyId: string;
      type: NotificationType | 'crowding';
      channel: 'push' | 'email';
      status: 'recorded' | 'sent' | 'failed' | 'error';
      error?: string;
    }> = [];

    const journeyList = journeys as Journey[];

    const userIds = [...new Set(journeyList.map((journey: Journey) => journey.user_id))];
    const preferencesMap = new Map<string, { notifications_enabled: boolean }>();

    if (userIds.length > 0) {
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('user_id, notifications_enabled')
        .in('user_id', userIds);

      if (preferencesError) {
        console.error('Error fetching user preferences:', preferencesError);
      } else if (preferences) {
        for (const preference of preferences) {
          preferencesMap.set(preference.user_id, { notifications_enabled: preference.notifications_enabled });
        }
      }
    }

    for (const journey of journeyList) {
      const departureTime = journey.departure_time;
      if (!departureTime) continue;

      const preferences = preferencesMap.get(journey.user_id);
      const notificationsEnabled = preferences?.notifications_enabled ?? true;

      // Calculate time until departure (in minutes)
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      const [currHours, currMinutes] = currentTime.split(':').map(Number);
      
      const departureInMinutes = depHours * 60 + depMinutes;
      const currentInMinutes = currHours * 60 + currMinutes;
      const minutesUntilDeparture = departureInMinutes - currentInMinutes;

      console.log(`Journey ${journey.id}: ${minutesUntilDeparture} minutes until departure`);
      const nowIso = now.toISOString();
      const updates: Record<string, unknown> = {};

      if (
        journey.notify_departure &&
        notificationsEnabled &&
        minutesUntilDeparture === PRE_DEPARTURE_MINUTES &&
        !journey.pre_departure_notified_at
      ) {
        const { title, body } = buildNotificationCopy('pre_departure', journey, departureTime);
        await enqueueNotification(supabase, journey, 'pre_departure', title, body, nowIso);
        journey.pre_departure_notified_at = nowIso;
        updates.pre_departure_notified_at = nowIso;

        notifications.push({
          journeyId: journey.id,
          type: 'pre_departure',
          channel: 'push',
          status: 'recorded',
        });

        const userEmail = journey.profiles?.email;
        const userName = journey.profiles?.first_name || 'utilizator';

        if (userEmail && resendApiKey) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'GoIasi <notifications@goisasi.com>',
                to: [userEmail],
                subject: `⏰ Pregătește-te de plecare către ${journey.destination}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Salut ${userName}! 👋</h2>
                    <p style="font-size: 16px; line-height: 1.6;">
                      Plecarea ta este la ora <strong>${departureTime}</strong>. Ai ${PRE_DEPARTURE_MINUTES} minute să te pregătești.
                    </p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>De la:</strong> ${journey.origin}</p>
                      <p style="margin: 5px 0;"><strong>Către:</strong> ${journey.destination}</p>
                      <p style="margin: 5px 0;"><strong>Durată estimată:</strong> ${journey.estimated_duration} minute</p>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">
                      Pregătește-te să pleci! 🚀
                    </p>
                  </div>
                `,
              }),
            });

            if (emailResponse.ok) {
              notifications.push({
                journeyId: journey.id,
                type: 'pre_departure',
                channel: 'email',
                status: 'sent',
              });
            } else {
              const errorData = await emailResponse.text();
              notifications.push({
                journeyId: journey.id,
                type: 'pre_departure',
                channel: 'email',
                status: 'failed',
                error: errorData,
              });
            }
          } catch (emailError) {
            const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
            notifications.push({
              journeyId: journey.id,
              type: 'pre_departure',
              channel: 'email',
              status: 'error',
              error: errorMsg,
            });
          }
        }
      }

      if (
        journey.notify_departure &&
        notificationsEnabled &&
        minutesUntilDeparture <= 0 &&
        minutesUntilDeparture >= -1 &&
        !journey.departure_notified_at
      ) {
        const { title, body } = buildNotificationCopy('departure', journey, departureTime);
        await enqueueNotification(supabase, journey, 'departure', title, body, nowIso);
        journey.departure_notified_at = nowIso;
        journey.status = 'active';
  journey.started_at = nowIso;
  journey.is_active = false;
        updates.departure_notified_at = nowIso;
        updates.status = 'active';
        updates.started_at = nowIso;
        updates.is_active = false;

        notifications.push({
          journeyId: journey.id,
          type: 'departure',
          channel: 'push',
          status: 'recorded',
        });

        const userEmail = journey.profiles?.email;
        const userName = journey.profiles?.first_name || 'utilizator';

        if (userEmail && resendApiKey) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'GoIasi <notifications@goisasi.com>',
                to: [userEmail],
                subject: `🚶 Trebuie să pleci acum spre ${journey.destination}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Este timpul, ${userName}! 🚶‍♂️</h2>
                    <p style="font-size: 16px; line-height: 1.6;">
                      Pleacă acum pentru a ajunge la timp la ${journey.destination}. Plecarea programată este la <strong>${departureTime}</strong>.
                    </p>
                  </div>
                `,
              }),
            });

            if (emailResponse.ok) {
              notifications.push({
                journeyId: journey.id,
                type: 'departure',
                channel: 'email',
                status: 'sent',
              });
            } else {
              const errorData = await emailResponse.text();
              notifications.push({
                journeyId: journey.id,
                type: 'departure',
                channel: 'email',
                status: 'failed',
                error: errorData,
              });
            }
          } catch (emailError) {
            const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
            notifications.push({
              journeyId: journey.id,
              type: 'departure',
              channel: 'email',
              status: 'error',
              error: errorMsg,
            });
          }
        }
      }

      // Check for high crowding and send notification
      if (journey.notify_crowding && notificationsEnabled && journey.route_details?.segments) {
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
                notifications.push({
                  journeyId: journey.id,
                  type: 'crowding',
                  channel: 'email',
                  status: 'sent',
                });
              } else {
                const errorData = await emailResponse.text();
                notifications.push({
                  journeyId: journey.id,
                  type: 'crowding',
                  channel: 'email',
                  status: 'failed',
                  error: errorData,
                });
              }
            } catch (emailError) {
              console.error(`Error sending crowding notification for journey ${journey.id}:`, emailError);
              const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
              notifications.push({
                journeyId: journey.id,
                type: 'crowding',
                channel: 'email',
                status: 'error',
                error: errorMsg,
              });
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = nowIso;
        const { error: updateError } = await supabase
          .from('journeys')
          .update(updates)
          .eq('id', journey.id);

        if (updateError) {
          console.error(`Error updating journey ${journey.id}:`, updateError);
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
