import Link from "next/link";

import { auth, signOut } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";

export async function AuthButtons() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed in AuthButtons, continuing as guest.", error);
  }

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
