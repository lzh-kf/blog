import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
