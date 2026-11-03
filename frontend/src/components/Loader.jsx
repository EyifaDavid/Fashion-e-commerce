// [NORTH] Shared loading indicator: full-page brand treatment or compact form feedback.
const Loading = ({ page = false, label = "Loading…" }) => {
  return (
    <div className={page ? "north-page-loader" : "flex items-center justify-center"}
      role="status" aria-live="polite" aria-atomic="true">
      {page && <span className="brand-wordmark text-2xl font-bold tracking-tight">UBIQUITOUS</span>}
      <span aria-hidden="true"
        className="block h-8 w-8 rounded-full border-2 border-current border-t-transparent animate-spin motion-reduce:animate-none" />
      <span className={page ? "text-sm text-neutral-600" : "sr-only"}>{label}</span>
    </div>
  );
};

export default Loading;
