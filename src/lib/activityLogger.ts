import { supabase } from "@shared/lib/supabase";

interface LogActivityParams {
  userId?: string;
  roleName?: string;
  action: string;
  module: string;
  details?: Record<string, any>;
  status?: "Success" | "Failed";
}

export async function logActivity({
  userId,
  roleName,
  action,
  module,
  details,
  status = "Success",
}: LogActivityParams) {
  try {
    // Attempt to get browser/IP info (client-side only)
    let browser = "Unknown";
    let ipAddress = "Unknown";

    if (typeof window !== "undefined") {
      browser = navigator.userAgent;
    }

    await supabase.from("activity_logs").insert({
      user_id: userId || null,
      role_name: roleName || null,
      action,
      module,
      details: details || {},
      ip_address: ipAddress,
      browser,
      status,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function logLoginHistory({
  userId,
  success,
  failureReason,
}: {
  userId?: string;
  success: boolean;
  failureReason?: string;
}) {
  try {
    let browser = "Unknown";
    let os = "Unknown";
    let device = "Unknown";

    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      browser = ua;

      // Basic OS detection
      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Mac")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

      // Basic device detection
      if (ua.includes("Mobile")) device = "Mobile";
      else if (ua.includes("Tablet")) device = "Tablet";
      else device = "Desktop";
    }

    await supabase.from("login_history").insert({
      user_id: userId || null,
      success,
      failure_reason: failureReason || null,
      browser,
      operating_system: os,
      device,
      ip_address: "Unknown",
    });
  } catch (err) {
    console.error("Failed to log login history:", err);
  }
}
