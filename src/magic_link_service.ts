import { randomBytes } from "node:crypto";
import { z } from "zod";
import { InfraiClient, infrai } from "./infrai_client.ts";

const requestSchema = z.object({ email: z.string().email(), appointmentId: z.string().min(1) });
const confirmSchema = z.object({ token: z.string().length(48) });
type Pending = { email: string; appointmentId: string; expiresAt: number };

export class MagicLinkService {
  private pending = new Map<string, Pending>();
  private confirmed = new Set<string>();
  private client: InfraiClient;
  constructor(client: InfraiClient) { this.client = client; }

  async requestLink(input: unknown): Promise<{ appointmentId: string; messageId: string }> {
    const request = requestSchema.parse(input) as { email: string; appointmentId: string };
    const token = randomBytes(24).toString("hex");
    this.pending.set(token, { ...request, expiresAt: Date.now() + 10 * 60 * 1000 });
    const link = `http://localhost:3000/appointments/${request.appointmentId}/magic-link?token=${token}`;
    const result = await this.client.request<{ message_id: string }>("POST", "/v1/email/send", {
      to: request.email,
      subject: "Confirm your appointment sign-in",
      html: `<p>Use this link to continue your appointment: <a href="${link}">${link}</a></p>`
    });
    return { appointmentId: request.appointmentId, messageId: result.message_id };
  }

  async confirmLink(input: unknown): Promise<{ appointmentId: string; userId: string }> {
    const { token } = confirmSchema.parse(input);
    const pending = this.pending.get(token);
    if (!pending || pending.expiresAt < Date.now()) throw new Error("Magic link is expired");
    const userId = pending.email.toLowerCase();
    await this.client.request("POST", "/v1/auth/session/create", {
      user_id: userId,
      method: "magic_link",
      require_mfa: false
    });
    this.pending.delete(token);
    this.confirmed.add(pending.appointmentId);
    return { appointmentId: pending.appointmentId, userId };
  }

  canContinueAppointment(appointmentId: string): boolean { return this.confirmed.has(appointmentId); }
}

export { infrai };
