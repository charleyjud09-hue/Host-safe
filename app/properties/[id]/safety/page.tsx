import { redirect } from "next/navigation";

/**
 * "Safety & checks" held only the retired property check. Old links go to
 * the property overview.
 */
export default async function SafetyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/properties/${id}`);
}
