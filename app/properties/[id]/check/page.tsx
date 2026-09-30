import { redirect } from "next/navigation";

/** The property check has been retired; old links go to the property overview. */
export default async function PropertyCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/properties/${id}`);
}
