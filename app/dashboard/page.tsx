import { redirect } from "next/navigation";

/**
 * The old dashboard has been retired: everything it showed now lives on the
 * property selector ("/") and each property's own pages. Kept only so old
 * links and bookmarks still land somewhere useful.
 */
export default function DashboardPage() {
  redirect("/");
}
