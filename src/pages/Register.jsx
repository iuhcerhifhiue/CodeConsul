import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  if (showOtp) {
    return (
      <div className="min-h-screen bg-[#080B0F] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="block text-center mb-10">
            <h1 className="font-display text-4xl font-black tracking-tighter text-white">CONSUL</h1>
          </Link>

          <div className="mb-8">
            <h2 className="font-display text-xl font-bold text-white">Verify your email</h2>
            <p className="font-mono text-xs text-white/30 mt-1">We sent a code to {email}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              autoFocus
              autoComplete="one-time-code"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otpCode.length < 6}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg font-mono text-sm text-cyan-400 hover:bg-cyan-400/20 transition-colors disabled:opacity-30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center font-mono text-xs text-white/30 mt-4">
            Didn't receive the code?{" "}
            <button onClick={handleResend} className="text-cyan-400/60 hover:text-cyan-400">Resend</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B0F] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-10">
          <h1 className="font-display text-4xl font-black tracking-tighter text-white">CONSUL</h1>
          <p className="font-mono text-[10px] text-cyan-400/40 uppercase tracking-[0.3em] mt-1">Autonomous Coding</p>
        </Link>

        <div className="mb-8">
          <h2 className="font-display text-xl font-bold text-white">Create your account</h2>
          <p className="font-mono text-xs text-white/30 mt-1">Sign up to get started</p>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-mono text-sm text-white">Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono text-[10px] text-white/20">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition-colors"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition-colors"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-white/40 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition-colors"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg font-mono text-sm text-cyan-400 hover:bg-cyan-400/20 transition-colors disabled:opacity-30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center font-mono text-xs text-white/30 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400/60 hover:text-cyan-400">Log in</Link>
        </p>
      </div>
    </div>
  );
}