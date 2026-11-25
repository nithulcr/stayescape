import { manualWhatsappUrl } from "./config.ts";

export type ManualWhatsAppMessage = {
  ownerName: string;
  ownerId: string;
  planName: string;
  amount: string;
  durationLabel: string;
};

export function buildManualWhatsAppUrl(input: ManualWhatsAppMessage): string {
  const message = [
    "Stay Escape Premium subscription request",
    `Owner: ${input.ownerName.trim() || "Stay Escape owner"}`,
    `Owner account ID: ${input.ownerId}`,
    `Plan: ${input.planName.trim() || "Premium"}`,
    `Amount: ${input.amount}`,
    `Duration: ${input.durationLabel}`,
  ].join("\n");

  return `${manualWhatsappUrl}?text=${encodeURIComponent(message)}`;
}
