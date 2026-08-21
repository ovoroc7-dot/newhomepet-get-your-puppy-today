import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { fetchPuppy, fetchPaymentSettings, reservationAmount, type Puppy } from "@/lib/puppies";
import { ReviewsSection, Stars } from "@/components/Reviews";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/puppy/$id")({
  component: PuppyPage,
});

const schema = z.object({
  buyer_name: z.string().trim().min(2).max(100),
  buyer_email: z.string().trim().email().max(255),
  buyer_phone: z.string().trim().min(5).max(30),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postal_code: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100),
  delivery_notes: z.string().trim().max(500).optional().or(z.literal("")),
  payment_method: z.enum(["paypal", "bitcoin"]),
});

function PuppyPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: puppy, isLoading } = useQuery({ queryKey: ["puppy", id], queryFn: () => fetchPuppy(id) });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchPaymentSettings });
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<"paypal" | "bitcoin">("paypal");
  const noPaymentConfigured = !settings?.paypal_email && !settings?.paypal_me_link && !settings?.bitcoin_address;

  useEffect(() => {
    if (!puppy) return;
    supabase.from("puppies").update({ view_count: (puppy.view_count ?? 0) + 1 }).eq("id", puppy.id).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puppy?.id]);

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading…</div>;
  if (!puppy) return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p>Puppy not found.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">Back to puppies</Link>
    </div>
  );

  const reserve = reservationAmount(puppy.price);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!puppy) return;
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse({ ...raw, payment_method: payment });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("orders").insert({
      puppy_id: puppy.id,
      puppy_name: puppy.name,
      puppy_breed: puppy.breed,
      price: puppy.price,
      reservation_amount: reserve,
      ...parsed.data,
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/order/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">← Back to puppies</Link>
      <div className="mt-4 grid gap-8 md:mt-6 md:grid-cols-2 md:gap-10">
        <div>
          <PuppyGallery puppy={puppy} />
          <div className="mt-5 md:mt-6">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{puppy.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={5} />
              <span className="text-sm text-muted-foreground">5.0 rating</span>
              <span className="text-sm text-muted-foreground">· Viewed {puppy.view_count.toLocaleString()} times</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">{puppy.breed} · {puppy.gender} · {puppy.age_weeks} weeks {puppy.color ? `· ${puppy.color}` : ""}</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <div className="text-2xl font-semibold text-primary sm:text-3xl">${puppy.price.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Reserve today for <span className="font-semibold text-foreground">${reserve.toLocaleString()}</span> (25%)</div>
            </div>

            <PuppyFacts puppy={puppy} />

            {puppy.description && <p className="mt-4 leading-relaxed text-foreground/80">{puppy.description}</p>}
            {(puppy.seller_name || puppy.seller_phone || puppy.seller_email) && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4">
                <div className="text-sm font-semibold">Seller contact</div>
                {puppy.seller_name && <div className="mt-1 text-sm">{puppy.seller_name}</div>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {puppy.seller_phone && (
                    <>
                      <a href={`tel:${puppy.seller_phone}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">📞 {puppy.seller_phone}</a>
                      <a href={`sms:${puppy.seller_phone}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">💬 Text</a>
                      <a href={`https://wa.me/${puppy.seller_phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">WhatsApp</a>
                    </>
                  )}
                  {puppy.seller_email && (
                    <a href={`mailto:${puppy.seller_email}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">✉️ {puppy.seller_email}</a>
                  )}
                </div>
                {puppy.seller_notes && <p className="mt-3 text-xs text-muted-foreground">{puppy.seller_notes}</p>}
              </div>
            )}
          </div>
        </div>


        <form onSubmit={onSubmit} aria-label="Reservation checkout" className="rounded-2xl border border-border bg-card p-4 shadow-card sm:rounded-3xl sm:p-6">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Checkout</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter delivery details to reserve {puppy.name}.</p>

          <div className="mt-5 grid gap-4 sm:mt-6">
            <Field label="Full name" name="buyer_name" required autoComplete="name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" name="buyer_email" type="email" required autoComplete="email" inputMode="email" />
              <Field label="Phone" name="buyer_phone" type="tel" required autoComplete="tel" inputMode="tel" />
            </div>
            <Field label="Address line 1" name="address_line1" required autoComplete="address-line1" />
            <Field label="Address line 2 (optional)" name="address_line2" autoComplete="address-line2" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" name="city" required autoComplete="address-level2" />
              <Field label="State / Region" name="state" required autoComplete="address-level1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Postal code" name="postal_code" required autoComplete="postal-code" inputMode="numeric" />
              <Field label="Country" name="country" required autoComplete="country-name" defaultValue="United States" />
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Delivery notes (optional)</span>
              <textarea name="delivery_notes" rows={3} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:ring-2 focus:ring-ring focus:outline-none sm:text-sm" />
            </label>

            <div>
              <div className="mb-2 text-sm font-medium">Payment method</div>
              <div className="grid grid-cols-2 gap-3">
                {(["paypal", "bitcoin"] as const).map((m) => (
                  <button type="button" key={m} onClick={() => setPayment(m)}
                    className={`rounded-xl border-2 p-3 text-left text-sm transition ${payment === m ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}>
                    <div className="font-medium">{m === "paypal" ? "PayPal" : "Bitcoin"}</div>
                    <div className="text-xs text-muted-foreground">{m === "paypal" ? "Pay with PayPal account" : "Send BTC to our wallet"}</div>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border-2 border-primary/40 bg-primary/5 p-4 text-sm">
                <div className="font-medium">{noPaymentConfigured ? "Online payment not set up yet" : "Prefer to message the seller?"}</div>
                <p className="mt-1 text-muted-foreground">
                  {noPaymentConfigured
                    ? <>Message the seller directly at <span className="font-medium text-foreground">+1 (281) 628-3530</span> to arrange payment for {puppy.name}.</>
                    : <>You can also complete this checkout by messaging the seller at <span className="font-medium text-foreground">+1 (281) 628-3530</span>.</>}
                </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <a href={`https://wa.me/12816283530?text=${encodeURIComponent(`Hi! I'd like to reserve ${puppy.name} (${puppy.breed}) for $${puppy.price}.`)}`} target="_blank" rel="noreferrer"
                    className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground">WhatsApp</a>
                  <a href={`sms:+12816283530?body=${encodeURIComponent(`Hi! I'd like to reserve ${puppy.name} (${puppy.breed}) for $${puppy.price}.`)}`}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-medium">Text</a>
                  <a href="tel:+12816283530"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-medium">Call</a>
                  <a href={`mailto:vernasewak5805@hotmail.com?subject=${encodeURIComponent(`Reservation for ${puppy.name} (${puppy.breed})`)}&body=${encodeURIComponent(`Hi! I'd like to reserve ${puppy.name} (${puppy.breed}) for $${puppy.price}.`)}`}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-medium">Email</a>
                </div>
              </div>
            </div>


            <div className="mt-2 rounded-xl bg-secondary/60 p-3 text-sm">
              <div className="flex justify-between"><span>Puppy price</span><span className="font-medium">${puppy.price.toLocaleString()}</span></div>
              <div className="mt-1 flex justify-between text-primary"><span className="font-medium">Reservation fee (25%)</span><span className="font-semibold">${reserve.toLocaleString()}</span></div>
              <div className="mt-1 text-xs text-muted-foreground">Balance of ${(puppy.price - reserve).toLocaleString()} due at delivery.</div>
            </div>

            <button disabled={submitting} className="mt-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-50">
              {submitting ? "Placing order…" : `Pay reservation fee of $${reserve.toLocaleString()}`}
            </button>
            <p className="text-center text-xs text-muted-foreground">You'll get payment instructions on the next step.</p>
          </div>
        </form>
      </div>

      <ReviewsSection puppyId={puppy.id} />
    </div>
  );
}

function PuppyFacts({ puppy }: { puppy: Puppy }) {
  const chips: string[] = [puppy.gender, `${puppy.age_weeks} weeks old`];
  if (puppy.size) chips.push(puppy.size);
  if (puppy.generation) chips.push(puppy.generation);
  chips.push(puppy.breed);

  const facts: { label: string; value: string }[] = [];
  facts.push({ label: "Breed", value: puppy.breed });
  if (puppy.color) facts.push({ label: "Color", value: puppy.color });
  if (puppy.weight_min_lbs && puppy.weight_max_lbs) {
    facts.push({ label: "Weight (est.)", value: `${puppy.weight_min_lbs}-${puppy.weight_max_lbs} lbs` });
  }
  if (puppy.date_of_birth) {
    facts.push({ label: "Date of birth", value: new Date(puppy.date_of_birth).toLocaleDateString() });
  }
  facts.push({ label: "Vet", value: puppy.vet_checked ? "Checked" : "Not checked" });
  if (puppy.vaccines_status) facts.push({ label: "Vaccines", value: puppy.vaccines_status });

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {puppy.free_delivery && (
          <span className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Free delivery to your state
          </span>
        )}
        {chips.map((c) => (
          <span key={c} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold">{c}</span>
        ))}
      </div>
      {facts.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</div>
              <div className="mt-0.5 text-sm font-medium">{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function Field({ label, name, type = "text", required, defaultValue, autoComplete, inputMode }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string; autoComplete?: string; inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "search" | "url" | "none" }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:ring-2 focus:ring-ring focus:outline-none sm:text-sm"
      />
    </label>
  );
}

function PuppyGallery({ puppy }: { puppy: Puppy }) {
  const items = puppy.media.length
    ? puppy.media
    : puppy.image_url
      ? [{ type: "image" as const, url: puppy.image_url }]
      : [];
  const [active, setActive] = useState(0);
  const current = items[active];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-muted text-8xl shadow-card">🐶</div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-3xl bg-muted shadow-card">
        {current.type === "image" ? (
          <img src={current.url} alt={puppy.name} className="h-full w-full object-cover" />
        ) : (
          <video src={current.url} controls playsInline className="h-full w-full bg-black object-contain" />
        )}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {items.map((m, i) => (
            <button
              type="button"
              key={m.url}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-lg border-2 transition ${i === active ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"}`}
              aria-label={`View ${m.type} ${i + 1}`}
            >
              {m.type === "image" ? (
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <video src={m.url} muted className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-lg">▶</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
