import { ScreenerService } from "@/core/screener-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = ScreenerService.getInstance();

  // Lazy startup — starts only once; subsequent calls return immediately.
  await service.start();

  const snapshot = service.getSnapshot();

  return Response.json(snapshot);
}
