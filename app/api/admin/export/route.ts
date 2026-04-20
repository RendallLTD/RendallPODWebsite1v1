import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { buildFactoryXlsx } from "@/lib/xlsx/factory-export";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const orderIds = Array.isArray(body?.order_ids) ? body.order_ids : null;
  if (!orderIds || orderIds.length === 0) {
    return Response.json({ error: "order_ids required" }, { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await buildFactoryXlsx(orderIds);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }

  // Best-effort email to the factory. Never blocks the download.
  const factoryEmail = process.env.FACTORY_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  if (factoryEmail && resendKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `rendall-factory-export-${date}.xlsx`;
      await resend.emails.send({
        from: "Rendall <orders@rendallpod.com>",
        to: factoryEmail,
        subject: `Rendall orders — ${date}`,
        text: `Attached: ${orderIds.length} orders for production.`,
        attachments: [{ filename, content: buf }],
      });
    } catch (err) {
      console.error("[admin/export] email delivery failed", err);
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  // Cast Buffer to Uint8Array so fetch/Response accepts it as BodyInit in edge builds.
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="rendall-factory-export-${date}.xlsx"`,
    },
  });
}
