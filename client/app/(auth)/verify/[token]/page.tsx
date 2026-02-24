"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVerifyEmailMutation } from "@/store/api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyPage() {
  const { token } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [verifyEmail, { isLoading, isSuccess, isError, error }] =
    useVerifyEmailMutation();
  const hasCalled = useRef(false);

  useEffect(() => {
    if (token && !hasCalled.current) {
      hasCalled.current = true;
      handleVerify();
    }
  }, [token]);

  const handleVerify = async () => {
    try {
      const res = await verifyEmail(token).unwrap();
      dispatch(
        setCredentials({ user: res.data, accessToken: res.accessToken }),
      );
      toast.success("Email verified successfully!");

      // Short delay before redirecting to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      toast.error(err?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md text-center">
        {isLoading && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verifying your email...
            </h1>
            <p className="text-text-secondary">Please hold on for a moment.</p>
          </div>
        )}

        {isSuccess && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Email Verified!
            </h1>
            <p className="text-text-secondary">
              Redirecting you to your dashboard...
            </p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verification Failed
            </h1>
            <p className="text-text-secondary mb-8">
              {(error as any)?.data?.message ||
                "The link might be invalid or expired."}
            </p>
            <button
              onClick={() => router.push("/register")}
              className="text-primary font-semibold hover:underline"
            >
              Back to Registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
