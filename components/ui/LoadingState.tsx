export default function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex items-center justify-center w-14 h-14 mb-4">
        <div
          role="img"
          aria-label="Loading"
          className="h-5 w-5 border-t-2 border-b-2 border-l-2 border-indigo-600 rounded-full animate-spin"
        />
      </div>
      <p className="text-gray-600">Reading your story and looking for films that feel close to it…</p>
    </div>
  );
}
