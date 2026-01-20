// lib/booth-logger.ts
// Logging utility for meme booth events

type PurchaseLogData = {
  userId: string;
  amount: number;
  credits: number;
  packId: string;
  sessionId: string;
  status: "initiated" | "completed" | "failed";
  newCredits?: number;
};

type GenerationLogData = {
  userId: string;
  creditsBefore: number;
  creditsAfter: number;
  styleMode: string;
};

type RefundLogData = {
  userId: string;
  reason: string;
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

export const boothLogger = {
  purchase(data: PurchaseLogData) {
    console.log(
      JSON.stringify({
        type: "booth_purchase",
        timestamp: formatTimestamp(),
        ...data,
      })
    );
  },

  generation(data: GenerationLogData) {
    console.log(
      JSON.stringify({
        type: "booth_generation",
        timestamp: formatTimestamp(),
        ...data,
      })
    );
  },

  refund(data: RefundLogData) {
    console.log(
      JSON.stringify({
        type: "booth_refund",
        timestamp: formatTimestamp(),
        ...data,
      })
    );
  },
};
