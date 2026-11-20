import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Content</p>
      <h1 className="display-title mt-3 text-4xl">Add a category.</h1>
      <div className="surface-card mt-8 p-6"><CategoryForm /></div>
    </div>
  );
}
