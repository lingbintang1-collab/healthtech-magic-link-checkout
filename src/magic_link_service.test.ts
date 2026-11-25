import assert from "node:assert/strict";
import { MagicLinkService } from "./magic_link_service.ts";
import { InfraiClient } from "./infrai_client.ts";

const calls: unknown[] = [];
const client = new InfraiClient("test-key");
client.request = async <T>(_method: "GET" | "POST", path: string, body?: unknown): Promise<T> => {
  calls.push({ path, body });
  if (path === "/v1/email/send") return { message_id: "msg-1" } as T;
  return { session_id: "session-1" } as T;
};
const service = new MagicLinkService(client);
assert.equal(service.canContinueAppointment("appt-1"), false);
const sent = await service.requestLink({ email: "patient@example.com", appointmentId: "appt-1" });
assert.equal(sent.messageId, "msg-1");
assert.equal(service.canContinueAppointment("appt-1"), false);
console.log("PASS: an appointment remains locked until its magic link is confirmed");
