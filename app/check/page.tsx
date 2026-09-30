import { redirect } from "next/navigation";

/**
 * The public property check has been retired: HostSafe no longer judges
 * whether a property fits. Kept so old links land on the homepage.
 */
export default function CheckPage() {
  redirect("/");
}
