import Link from "next/link";
import { deleteCategoryAction } from "@/app/admin/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminCategories } from "@/lib/data/admin";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="display-title mt-3 text-4xl">Categories.</h1>
        </div>
        <Link href="/admin/categories/new" className="btn-primary">Add category</Link>
      </div>

      {categories.length ? (
        <div className="surface-card mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/8">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-4 font-medium text-forest-deep">{category.name}</td>
                  <td className="px-5 py-4 text-xs text-muted">/{category.slug}</td>
                  <td className="px-5 py-4">{category.sort_order}</td>
                  <td className="px-5 py-4"><StatusPill status={category.is_active ? "active" : "expired"}>{category.is_active ? "Active" : "Hidden"}</StatusPill></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <Link href={`/admin/categories/${category.id}`} className="text-xs font-semibold text-forest">Edit</Link>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <button type="submit" className="text-xs text-rose-600">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8"><EmptyState title="No categories yet" description="Seed the database or add a category." /></div>
      )}
    </>
  );
}
