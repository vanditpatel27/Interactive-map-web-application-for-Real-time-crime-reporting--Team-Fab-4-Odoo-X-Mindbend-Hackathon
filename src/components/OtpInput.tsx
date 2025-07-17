"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from "react"
import { Input } from "@/components/ui/input"

interface OtpInputProps {
    value: string
    onChange: (value: string) => void
}

const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
    const [otp, setOtp] = useState<string[]>(value.split("").concat(Array(6 - value.length).fill("")))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, digit: string) => {
        if (digit.length > 1) return // Prevent multi-character input
        const newOtp = [...otp]
        newOtp[index] = digit
        setOtp(newOtp)
        onChange(newOtp.join(""))

        // Move to next input if available
        if (digit !== "" && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").slice(0, 6).split("")
        const newOtp = [...pastedData, ...Array(6 - pastedData.length).fill("")]
        setOtp(newOtp)
        onChange(newOtp.join(""))
        inputRefs.current[pastedData.length]?.focus()
    }

    return (
        <div className="flex gap-2">
            {otp.map((digit, index) => (
                <Input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="\d{1}"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    className="w-12 h-12 text-center text-lg"
                />
            ))}
        </div>
    )
}

export default OtpInput

