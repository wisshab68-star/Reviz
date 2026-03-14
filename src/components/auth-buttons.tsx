import Link from "next/link";

import { auth, signOut } from "@/auth";

export async function AuthButtons() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link href="/sign-in" className="btn btn-primary">
        Connexion
      </Link>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className="btn btn-soft">
        {session.user.name ?? session.user.email ?? "Mon compte"}
      </button>
    </form>
  );
}
