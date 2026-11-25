import { InfraiClient } from "./infrai_client.ts";
import { MagicLinkService } from "./magic_link_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the demo");
const recipient = process.env.DEMO_RECIPIENT;
if (!recipient) throw new Error("Set DEMO_RECIPIENT before running the demo");
const service = new MagicLinkService(new InfraiClient(key));
const appointment = { email: recipient, appointmentId: "appt-1042" };
console.log("Request body accepted:", appointment);
console.log("Send the returned link, then confirm it to unlock appointment checkout.");
const result = await service.requestLink(appointment);
console.log("Expected response:", result);
