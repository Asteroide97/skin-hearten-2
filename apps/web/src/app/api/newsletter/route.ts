import { NextResponse } from "next/server";

type NewsletterPayload = {
  acceptedMarketing: boolean;
  email: string;
  firstName: string;
};

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Configura NEXT_PUBLIC_API_URL para conectar la suscripcion con el CRM real.",
      },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as NewsletterPayload;

  try {
    const response = await fetch(`${apiBaseUrl}/newsletter/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acceptedMarketing: payload.acceptedMarketing,
        email: payload.email,
        firstName: payload.firstName,
        source: "home",
      }),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            typeof result?.detail === "string"
              ? result.detail
              : "No pudimos guardar la suscripcion en este momento.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "No pudimos conectar con el CRM para guardar la suscripcion.",
      },
      { status: 503 },
    );
  }
}
