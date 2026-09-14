import { getDonor } from "../../actions"
import EditDonorForm from "@/components/admin/EditDonorForm"
import { notFound } from "next/navigation"

export default async function EditarDonantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const donor = await getDonor(id)

  if (!donor) {
    notFound()
  }

  return <EditDonorForm donor={donor} />
}
