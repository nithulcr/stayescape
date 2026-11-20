import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display-title mt-4 text-5xl">This page got away.</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The page you are looking for may have moved or is no longer published.
      </p>
      <Link href="/" className="btn-primary mt-7">Back to home</Link>
    </div>
  );
}
