import { supabase } from "@/integrations/supabase/client";

// Session is generated per client load
const SESSION_ID = crypto.randomUUID();
// Deduping impressions by source + itemId
const impressedItems = new Set<string>();

export type EventType = 
  | 'item_impression' 
  | 'item_open' 
  | 'item_favorite' 
  | 'item_share' 
  | 'seller_contact' 
  | 'search';

export async function trackEvent(
  eventType: EventType,
  params?: { itemId?: string | null; metadata?: Record<string, any> }
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // As per policy, user_id must match auth.uid(), so we need to be authenticated
    if (!session?.user?.id) return;

    const payload = {
      user_id: session.user.id,
      event_type: eventType,
      session_id: SESSION_ID,
      item_id: params?.itemId || null,
      metadata: params?.metadata || null
    };

    // Fire and forget. We absorb errors to never interrupt the user flow.
    supabase.from('user_events').insert(payload).then(({ error }) => {
      if (error) {
        console.warn('[Telemetry] Error tracking event:', error.message);
      } else {
        // Observability for development
        if (import.meta.env.DEV) {
          console.debug(`[Telemetry] ${eventType} tracked`, payload);
        }
      }
    }).catch((err) => {
      // Absorb any unexpected network failures from the SDK
      if (import.meta.env.DEV) console.warn('[Telemetry] Unhandled SDK error:', err);
    });

  } catch (error) {
    // Completely isolate telemetry from breaking main thread
    if (import.meta.env.DEV) console.warn('[Telemetry] Failed to prepare event:', error);
  }
}

export function trackImpression(itemId: string, source: string, category?: string) {
  // Deduplicate by source + item_id
  const key = `${source}_${itemId}`;
  
  if (impressedItems.has(key)) return;
  impressedItems.add(key);

  const metadata: Record<string, any> = { source };
  if (category) metadata.category = category;

  trackEvent('item_impression', { itemId, metadata });
}
