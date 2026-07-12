import { SignJWT, importPKCS8 } from "npm:jose";

export interface PushNotificationRequest {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushSendResult {
  success: boolean;
  error?: any;
  providerId?: string;
}

export interface PushProvider {
  send(notification: PushNotificationRequest): Promise<PushSendResult>;
}

export class ApnsPushProvider implements PushProvider {
  private keyId = Deno.env.get("APNS_KEY_ID") || "";
  private teamId = Deno.env.get("APNS_TEAM_ID") || "";
  private privateKey = Deno.env.get("APNS_PRIVATE_KEY") || "";
  private bundleId = Deno.env.get("APNS_BUNDLE_ID") || "";
  private env = Deno.env.get("APNS_ENVIRONMENT") || "development";
  private jwtToken: string | null = null;
  private jwtExpiresAt: number = 0;

  private async getJwt(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    // APNs tokens can be valid for up to 60 minutes
    if (this.jwtToken && this.jwtExpiresAt > now + 60) {
      return this.jwtToken;
    }

    if (!this.privateKey) throw new Error("Missing APNS_PRIVATE_KEY");

    // Bulletproof PEM parsing
    let formattedKey = this.privateKey;
    const match = formattedKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
    if (match) {
      const b64 = match[1].replace(/\s+/g, '');
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
    } else {
      // Fallback
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }

    try {
      const key = await importPKCS8(formattedKey, "ES256");
      this.jwtToken = await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: this.keyId })
        .setIssuer(this.teamId)
        .setIssuedAt(now)
        .sign(key);
      this.jwtExpiresAt = now + 50 * 60; // Refresh after 50 min
      return this.jwtToken;
    } catch (err: any) {
      throw new Error(`Failed to import APNS key. Key length: ${this.privateKey.length}. Error: ${err.message}`);
    }
  }

  async send(notification: PushNotificationRequest): Promise<PushSendResult> {
    try {
      const jwt = await this.getJwt();
      const host = this.env === "production" ? "api.push.apple.com" : "api.sandbox.push.apple.com";
      const url = `https://${host}/3/device/${notification.token}`;

      const payload = {
        aps: {
          alert: {
            title: notification.title,
            body: notification.body,
          },
          sound: "default",
          badge: 1,
        },
        ...notification.data,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `bearer ${jwt}`,
          "apns-topic": this.bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, providerId: response.headers.get("apns-id") || undefined };
      } else {
        const errorText = await response.text();
        return { success: false, error: `APNs API Error: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export class FcmPushProvider implements PushProvider {
  private projectId = Deno.env.get("FIREBASE_PROJECT_ID") || "";
  private clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL") || "";
  private privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY") || "";
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    // Refresh 5 minutes before expiry
    if (this.accessToken && this.tokenExpiresAt > now + 300) {
      return this.accessToken;
    }

    if (!this.privateKey) throw new Error("Missing FIREBASE_PRIVATE_KEY");

    // Bulletproof PEM parsing
    let formattedKey = this.privateKey;
    const match = formattedKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
    if (match) {
      const b64 = match[1].replace(/\s+/g, '');
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
    } else {
      // Fallback
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }

    try {
      const key = await importPKCS8(formattedKey, "RS256");
      const jwt = await new SignJWT({
        iss: this.clientEmail,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .sign(key);

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google Auth error: ${res.status} - ${err}`);
      }

      const data = await res.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = now + data.expires_in;
      return this.accessToken;
    } catch (err: any) {
      throw new Error(`Failed to import FCM key. Key length: ${this.privateKey.length}. Error: ${err.message}`);
    }
  }

  async send(notification: PushNotificationRequest): Promise<PushSendResult> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

      const payload = {
        message: {
          token: notification.token,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
          android: {
            notification: {
              sound: "default"
            }
          }
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, providerId: data.name };
      } else {
        const errorText = await response.text();
        return { success: false, error: `FCM API Error: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
