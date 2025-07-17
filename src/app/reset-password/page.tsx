"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResetPasswordPage = () => {
  const [step, setStep] = useState("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    code: ["", "", "", "", "", ""],
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    code: "",
    password: [] as string[],
    confirmPassword: [] as string[],
  });
  const [apiError, setApiError] = useState("");

  const inputRefs = useRef(
    [...Array(6)].map(() => React.createRef<HTMLInputElement>())
  );
  const formRef = useRef(null);

  // Timer for resend countdown
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleResendCode = async () => {
    setResendDisabled(true);
    setCountdown(30);
    try {
      // API call to resend code would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      setApiError("Failed to resend code. Please try again.");
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...formData.code];
    newCode[index] = value;
    setFormData((prev) => ({
      ...prev,
      code: newCode,
    }));

    if (value && index < 5) {
      inputRefs.current[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !formData.code[index] && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...formData.code];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    setFormData((prev) => ({ ...prev, code: newCode }));
  };

  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validateCode = (code: string[]): string => {
    const combinedCode = code.join("");
    if (!combinedCode) return "Code is required";
    if (combinedCode.length !== 6) return "Code must be exactly 6 digits";
    if (!/^\d+$/.test(combinedCode)) return "Code must contain only numbers";
    return "";
  };

  const validatePassword = (
    password: string,
    confirmPassword?: string
  ): string[] => {
    const errors: string[] = [];

    if (!password) {
      errors.push("Password is required");
      return errors;
    }

    if (password.length < 8)
      errors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password))
      errors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password))
      errors.push("Password must contain at least one lowercase letter");
    if (!/[0-9]/.test(password))
      errors.push("Password must contain at least one number");
    if (!/[^A-Za-z0-9]/.test(password))
      errors.push("Password must contain at least one special character");

    if (confirmPassword !== undefined && password !== confirmPassword) {
      errors.push("Passwords don't match");
    }

    return errors;
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.match(/[A-Z]/)) strength += 20;
    if (password.match(/[a-z]/)) strength += 20;
    if (password.match(/[0-9]/)) strength += 20;
    if (password.match(/[^A-Za-z0-9]/)) strength += 20;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength <= 20) return "Very Weak";
    if (strength <= 40) return "Weak";
    if (strength <= 60) return "Medium";
    if (strength <= 80) return "Strong";
    return "Very Strong";
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");
    let hasErrors = false;
    const newErrors = { ...errors };

    if (step === "email") {
      newErrors.email = validateEmail(formData.email);
      if (newErrors.email) hasErrors = true;
    } else if (step === "code") {
      newErrors.code = validateCode(formData.code);
      if (newErrors.code) hasErrors = true;
    } else if (step === "password") {
      newErrors.password = validatePassword(formData.password);
      newErrors.confirmPassword = validatePassword(
        formData.password,
        formData.confirmPassword
      );
      if (newErrors.password || newErrors.confirmPassword) hasErrors = true;
    }

    setErrors(newErrors);

    if (!hasErrors) {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (step === "email") {
          setStep("code");
          setCountdown(30);
          setResendDisabled(true);
        } else if (step === "code") setStep("password");
        else if (step === "password") {
          // Final submission would go here
          console.log("Password reset successful");
        }
      } catch (err) {
        setApiError("An error occurred. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const renderForm = () => {
    switch (step) {
      case "email":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-12"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <motion.p
                  id="email-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>
          </motion.div>
        );

      case "code":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div
                className="flex justify-between gap-2"
                role="group"
                aria-label="Verification code input"
              >
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="w-12">
                    <Input
                      ref={inputRefs.current[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={formData.code[index]}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="text-center text-2xl h-14 w-full"
                      aria-label={`Digit ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              {errors.code && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500"
                  role="alert"
                >
                  {errors.code}
                </motion.p>
              )}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={resendDisabled}
                  onClick={handleResendCode}
                  className="text-sm"
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Resend code"}
                </Button>
              </div>
            </div>
          </motion.div>
        );

      case "password":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="h-12 pr-12"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor(
                        calculatePasswordStrength(formData.password)
                      )}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${calculatePasswordStrength(
                          formData.password
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Password strength:{" "}
                    {getPasswordStrengthLabel(
                      calculatePasswordStrength(formData.password)
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="h-12 pr-12"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword
                        ? "confirm-password-error"
                        : undefined
                    }
                  />
                
                </div>
              </div>

              {(errors.password.length > 0 ||
                errors.confirmPassword.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  {Array.from(
                    new Set([...errors.password, ...errors.confirmPassword])
                  ).map((error, index) => (
                    <p
                      key={index}
                      className="text-sm text-red-500"
                      role="alert"
                    >
                      {error}
                    </p>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-2 mb-6"
            >
              {["email", "code", "password"].map((s, index) => (
                <div key={s} className="flex items-center">
                  <motion.div
                    className={`h-3 w-16 rounded-full ${
                      ["email", "code", "password"].indexOf(step) >= index
                        ? "bg-primary"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                  {index < 2 && (
                    <div className="w-4 h-px bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>
              ))}
            </motion.div>
            <div className="flex justify-center mb-6">
              <motion.div
                className="p-4 rounded-full bg-primary/10 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {step === "email" && <Mail className="w-8 h-8 text-primary" />}
                {step === "code" && (
                  <KeyRound className="w-8 h-8 text-primary" />
                )}
                {step === "password" && (
                  <Lock className="w-8 h-8 text-primary" />
                )}
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {step === "email" && "Reset Your Password"}
              {step === "code" && "Verify Your Email"}
              {step === "password" && "Create New Password"}
            </CardTitle>
            <p className="text-center text-gray-500 dark:text-gray-400">
              {step === "email" &&
                "Enter your email to receive a verification code"}
              {step === "code" &&
                `We've sent a 6-digit code to ${formData.email}`}
              {step === "password" &&
                "Choose a strong password to secure your account"}
            </p>
          </CardHeader>
          <CardContent>
            {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">
              <AnimatePresence mode="wait">{renderForm()}</AnimatePresence>
              <div className="flex justify-between items-center pt-4">
                {step !== "email" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep(step === "password" ? "code" : "email");
                      setErrors({});
                      setApiError("");
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4 transform rotate-180" />
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className={`w-24 ${step === "email" ? "ml-auto" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : step === "password" ? (
                    "Reset"
                  ) : (
                    "Next"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
