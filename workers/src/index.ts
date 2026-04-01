import { createServiceClient } from "./lib/supabase";
import { collectInsights } from "./cron/collect-insights";
import { collectAccountMetrics } from "./cron/collect-account-metrics";
import { refreshTokens } from "./cron/refresh-tokens";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ) {
    const supabase = createServiceClient(env);

    switch (controller.cron) {
      // Every hour: collect post-level insights
      case "0 * * * *":
        console.log("Running: collect-insights");
        await collectInsights(supabase);
        break;

      // Daily at 03:00: collect account-level metrics
      case "0 3 * * *":
        console.log("Running: collect-account-metrics");
        await collectAccountMetrics(supabase);
        break;

      // Weekly Monday 06:00: refresh expiring tokens
      case "0 6 * * 1":
        console.log("Running: refresh-tokens");
        await refreshTokens(supabase, env);
        break;

      default:
        console.log(`Unknown cron: ${controller.cron}`);
    }
  },

  async fetch(
    _request: Request,
    _env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    return new Response(
      JSON.stringify({
        name: "social-harness-workers",
        status: "ok",
        crons: [
          "0 * * * * — collect post insights",
          "0 3 * * * — collect account metrics",
          "0 6 * * 1 — refresh tokens",
        ],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
