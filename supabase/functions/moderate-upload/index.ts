import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const SIGHTENGINE_API_USER = Deno.env.get("SIGHTENGINE_API_USER");
const SIGHTENGINE_API_SECRET = Deno.env.get("SIGHTENGINE_API_SECRET");
const PROVIDER = Deno.env.get("IMAGE_MODERATION_PROVIDER") || "SightEngine";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

serve(async (req: Request) => {
  // CORS configuration
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const defaultHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // 1. JWT Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: defaultHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // We need service role to bypass RLS for uploads
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: defaultHeaders });
    }

    // Read the multipart form data
    const formData = await req.formData();
    const file = formData.get("file");
    
    // Determine target bucket from formData
    const targetBucket = formData.get("bucket")?.toString() || "item-images";
    if (targetBucket !== "item-images" && targetBucket !== "avatars") {
      return new Response(JSON.stringify({ error: "Invalid bucket" }), { status: 400, headers: defaultHeaders });
    }

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: defaultHeaders });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "File too large" }), { status: 400, headers: defaultHeaders });
    }

    const fileBuffer = await file.arrayBuffer();
    const mimeType = file.type;

    if (!mimeType.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Invalid file type" }), { status: 400, headers: defaultHeaders });
    }

    // In a full production scenario, you would implement Hash generation and Memory Rate Limiting here.
    
    // 2. Upload to Quarantine Bucket (temp-moderation)
    const tempFileName = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("temp-moderation")
      .upload(tempFileName, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Quarantine upload failed:", uploadError);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: defaultHeaders });
    }

    // 3. Moderation Provider (SightEngine)
    let isApproved = false;
    let rejectionReason = "";
    let providerScore = {};

    if (PROVIDER === "Disabled") {
       isApproved = true;
    } else if (PROVIDER === "SightEngine") {
      // Create FormData to send to Sightengine
      const sightEngineForm = new FormData();
      sightEngineForm.append("media", new Blob([fileBuffer], { type: mimeType }));
      sightEngineForm.append("models", "nudity-2.0,wad,offensive,gore");
      sightEngineForm.append("api_user", SIGHTENGINE_API_USER || "");
      sightEngineForm.append("api_secret", SIGHTENGINE_API_SECRET || "");

      const seResponse = await fetch("https://api.sightengine.com/1.0/check.json", {
        method: "POST",
        body: sightEngineForm,
      });

      const seData = await seResponse.json();
      providerScore = seData;

      if (seData.status === "success") {
        // Evaluate the criteria
        const isNudity = seData.nudity && (seData.nudity.sexual_activity > 0.5 || seData.nudity.sexual_display > 0.5 || seData.nudity.erotica > 0.5);
        const isGore = seData.gore && seData.gore.prob > 0.5;
        const isWeapon = seData.weapon && seData.weapon > 0.5;
        const isDrugs = seData.drugs && seData.drugs > 0.5;
        const isOffensive = seData.offensive && seData.offensive.prob > 0.5;

        if (isNudity || isGore || isWeapon || isDrugs || isOffensive) {
          isApproved = false;
          rejectionReason = "Conteúdo inapropriado detectado pelas políticas da comunidade.";
        } else {
          isApproved = true;
        }
      } else {
        // Sightengine failed (timeout, bad keys, etc)
        // By design (fail-closed), we reject or we could fail-open.
        // Usually we reject to prevent bypass.
        isApproved = false;
        rejectionReason = "Falha temporária no sistema de moderação. Tente novamente mais tarde.";
        console.error("Sightengine Error:", seData);
      }
    }

    // 4. Record Audit Log
    await supabase.from("image_moderation_logs").insert({
      user_id: user.id,
      provider: PROVIDER,
      score: providerScore,
      approved: isApproved,
      reason: rejectionReason
    });

    if (!isApproved) {
      // Discard from quarantine
      await supabase.storage.from("temp-moderation").remove([tempFileName]);
      return new Response(JSON.stringify({ error: rejectionReason }), { status: 406, headers: defaultHeaders });
    }

    // 5. Move to definitive bucket
    // Create a safe unique path (User ID / UUID)
    const finalPath = `${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    
    // Upload directly to final bucket (instead of moving, we already have buffer in memory)
    const { data: finalData, error: finalError } = await supabase.storage
      .from(targetBucket)
      .upload(finalPath, fileBuffer, {
        contentType: mimeType,
      });

    // Clean up quarantine
    await supabase.storage.from("temp-moderation").remove([tempFileName]);

    if (finalError) {
      console.error("Definitive upload failed:", finalError);
      return new Response(JSON.stringify({ error: "Failed to finalize upload" }), { status: 500, headers: defaultHeaders });
    }

    const publicUrlData = supabase.storage.from(targetBucket).getPublicUrl(finalPath);

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrlData.data.publicUrl,
      path: finalPath
    }), { status: 200, headers: defaultHeaders });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: "Ocorreu um erro interno inesperado." }), { status: 500, headers: defaultHeaders });
  }
});
