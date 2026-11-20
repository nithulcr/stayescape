import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { getAuthContext } from "@/lib/auth/guards";
import { StatusPill } from "@/components/ui/status-pill";

export default async function ProfilePage() {
  const context = await getAuthContext();
  if (!context) return null;
  const profile = context.profile;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Account</p>
      <h1 className="display-title mt-3 text-4xl">Your profile.</h1>

      <section className="surface-card mt-8 p-7">
        <div className="flex items-center gap-5">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={72} height={72} className="h-18 w-18 rounded-full object-cover" />
          ) : (
            <span className="flex h-18 w-18 items-center justify-center rounded-full bg-forest text-2xl text-white">
              {(profile?.full_name ?? context.user.email ?? "S").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h2 className="font-serif text-2xl text-forest-deep">{profile?.full_name ?? "Your account"}</h2>
            <p className="mt-1 text-sm capitalize text-muted">{profile?.role?.replace("_", " ") ?? "member"}</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 border-t border-forest/10 pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-charcoal/75">
            <Mail size={15} className="text-gold" /> {profile?.email ?? context.user.email}
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 text-sm text-charcoal/75">
              <Phone size={15} className="text-gold" /> {profile.phone}
            </div>
          )}
          <div>
            <p className="text-xs text-muted">Account status</p>
            <div className="mt-1"><StatusPill status={profile?.account_status ?? "active"} /></div>
          </div>
          <div>
            <p className="text-xs text-muted">Member since</p>
            <p className="mt-1 text-sm text-charcoal/75">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN") : "—"}
            </p>
          </div>
        </div>
        <Link href="/properties" className="btn-secondary mt-7">
          Explore stays <ArrowUpRight size={14} />
        </Link>
      </section>
    </div>
  );
}
