import Link from "next/link";

import { ReviewInvitationForm } from "@/components/store/review-invitation-form";
import { getReviewInvitation } from "@/lib/reviews-api";

type InvitationPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ReviewInvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const invitationResult = await getReviewInvitation(token);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
      {invitationResult.ok ? (
        <ReviewInvitationForm invitation={invitationResult.data} />
      ) : (
        <section className="soft-panel rounded-[2rem] px-6 py-12 text-center sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Invitacion no disponible</p>
          <h1 className="mt-3 font-serif text-4xl text-stone-950">No pudimos abrir este enlace de resena</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            {invitationResult.message ?? "El enlace ya no esta disponible o necesita generarse nuevamente desde el panel admin."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link className="btn-primary" href="/reviews">
              Ver resenas publicadas
            </Link>
            <Link className="btn-secondary" href="/productos">
              Volver a productos
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
