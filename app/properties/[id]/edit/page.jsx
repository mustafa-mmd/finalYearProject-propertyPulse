import PropertyEditForm from "@/components/PropertyEditForm"
import PropertyMediaManager from "@/components/PropertyMediaManager";

const EditPage = async ({ params }) => {
  const { id } = await params;
  return (
      <section className="bg-blue-50">
      <div className="container m-auto max-w-4xl py-16">
        <div
          className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
        >
          <PropertyEditForm/>
          <PropertyMediaManager propertyId={id} />

        </div>
      </div>
    </section>
  )
}

export default EditPage
