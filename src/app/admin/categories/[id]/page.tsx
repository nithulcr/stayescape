import { notFound } from "next/navigation";
import { getAdminCategories } from "@/lib/data/admin";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categories = await getAdminCategories();
  const category = categories.find((item) => item.id === id);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Content</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Edit {category.name}.</h1>
      <div className="surface-card mt-8 p-6"><CategoryForm category={category} /></div>
    </div>
  );
}
