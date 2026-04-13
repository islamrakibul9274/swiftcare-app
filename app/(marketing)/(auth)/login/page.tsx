import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-brand-indigo/5 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Logo className="w-14 h-14" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-black text-brand-dark tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Enter your credentials to access the clinic portal.
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/60">
          <LoginForm />
        </div>
        
        {/* Help Link Footer */}
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Need access?{" "}
          <a href="#" className="text-swift-blue hover:text-blue-700 font-bold transition-colors">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  );
}