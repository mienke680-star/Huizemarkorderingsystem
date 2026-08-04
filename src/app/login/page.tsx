"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, ShieldCheck, ClipboardCheck, Truck, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "sonner";
import { IntroExperience } from "@/components/intro/intro-experience";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: "Agent — Sarah van der Merwe", email: "sarah.merwe@huizemark.co.za" },
  { label: "Mienke", email: "mienke@huizemark.co.za" },
  { label: "MJ", email: "mj@huizemark.co.za" },
  { label: "Nadia", email: "nadia@huizemark.co.za" },
  { label: "Chantal", email: "chantal@huizemark.co.za" },
  { label: "Administrator", email: "admin@huizemark.co.za" },
];
const DEMO_PASSWORD = "Huizemark2026!";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Login failed", { description: "Check your email and password and try again." });
      return;
    }
    toast.success("Welcome back");
    router.push(callbackUrl);
    router.refresh();
  }

  function fillDemo(email: string) {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <IntroExperience />
      {/* Floating background details */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 size-96 rounded-full bg-orange-50"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-24 size-80 rounded-full bg-navy-50"
          animate={{ y: [0, -24, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-grey-100 bg-white shadow-soft-lg md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-navy-800 p-10 text-white md:flex">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500 font-display text-lg font-bold">H</div>
              <span className="font-display text-xl font-semibold tracking-tight">Huizemark</span>
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
              className="mt-6 h-[2px] w-24 origin-left bg-orange-500"
            />
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 font-display text-3xl leading-tight font-semibold"
            >
              Agent Ordering Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-3 max-w-xs text-sm text-navy-200"
            >
              Order. Approve. Track. Deliver. — the internal ordering platform for Huizemark North Coast.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="space-y-4"
          >
            {[
              { icon: ClipboardCheck, text: "Submit and track orders end to end" },
              { icon: ShieldCheck, text: "Structured multi-manager approvals" },
              { icon: PackageCheck, text: "Live manufacturing & courier status" },
              { icon: Truck, text: "Delivered with full visibility" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-navy-100"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="size-4 text-orange-400" />
                </span>
                {item.text}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500 font-display text-base font-bold text-white">H</div>
              <span className="font-display text-lg font-semibold text-navy-800">Huizemark</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-navy-800">Sign in</h2>
          <p className="mt-1 text-sm text-grey-500">Use your Huizemark ordering hub account.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-grey-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@huizemark.co.za"
                  className="pl-10"
                  invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-grey-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  invalid={!!errors.password}
                  {...register("password")}
                />
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign in <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              {showDemo ? "Hide demo accounts" : "Use a demo account →"}
            </button>
            <AnimatePresence>
              {showDemo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        type="button"
                        key={acc.email}
                        onClick={() => fillDemo(acc.email)}
                        className="rounded-lg border border-grey-200 px-3 py-2 text-left text-xs text-navy-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-grey-400">
                    Password for every demo account: <code className="rounded bg-grey-100 px-1 py-0.5">{DEMO_PASSWORD}</code>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
