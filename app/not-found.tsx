import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="text-center w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          We could not find the resource you are looking for. It might have been removed or you might have used an incorrect link.
        </p>
        <Link
          href="/app"
          className="inline-flex justify-center bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
