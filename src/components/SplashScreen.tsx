"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SplashScreen = () => {
  const [showAnimation, setShowAnimation] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("secure")) {
      setShowAnimation(false);
    } else {
      sessionStorage.setItem("secure", "true");

      const video = videoRef.current;

      // Fallback in case video doesn't end properly
      const timeout = setTimeout(() => {
        setShowAnimation(false);
      }, 10000); // fallback timeout

      if (video) {
        video.play();

        video.addEventListener("ended", () => {
          clearTimeout(timeout);
          setShowAnimation(false);
        });
      }

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [router]);

  return (
    showAnimation && (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
        <video
          ref={videoRef}
          src="intro.mp4" // Make sure this video exists in public/videos
          className="w-full h-full object-cover"
          muted
          playsInline
        />
      </div>
    )
  );
};

export default SplashScreen;
