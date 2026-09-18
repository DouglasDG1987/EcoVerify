import { LogoMark } from "@/components/logo";

export default function GlobalLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="animate-scale-in">
          <LogoMark size={88} rounded="rounded-3xl" />
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full w-1/2 animate-[shimmer_1s_infinite_linear] rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
        </div>
      </div>
    </div>
  );
}
