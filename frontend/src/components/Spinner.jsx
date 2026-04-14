export default function Spinner({ size = 'md' }) {
  const s = size === 'sm'
    ? 'w-5 h-5 border-2'
    : size === 'lg'
    ? 'w-12 h-12 border-4'
    : 'w-8 h-8 border-[3px]';
  return (
    <div className="flex justify-center items-center py-10">
      <div className={`${s} rounded-full
        border-slate-200 dark:border-slate-700
        border-t-blue-500
        animate-spin`}
      />
    </div>
  );
}
