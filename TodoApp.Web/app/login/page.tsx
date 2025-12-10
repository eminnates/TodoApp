"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpening && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        router.push("/todos");
      }
    };
    if (isOpening) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpening, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError("");
      const response = await authApi.login(data);
      
      login(response.accessToken, {
        id: "",
        userName: data.userName,
        fullName: "",
      });
      
      if (prefersReducedMotion) {
        router.push("/todos");
        return;
      }
      
      setIsOpening(true);
      
      // Yönlendirme süresi - daha kısa ve optimize
      setTimeout(() => {
        router.push("/todos");
      }, 1800); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleSkipAnimation = () => {
    if (isOpening) router.push("/todos");
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden" style={{
      background: 'linear-gradient(135deg, #8B7355 0%, #6B5E52 50%, #5A4E42 100%)',
      perspective: '2500px',
    }}>
      {/* Skip overlay */}
      <AnimatePresence>
        {isOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 cursor-pointer"
            onClick={handleSkipAnimation}
          >
             <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
              <p style={{ color: '#E5DDD0', fontFamily: "'Georgia', serif", fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Tap anywhere to skip
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE BOOK CONTAINER */}
      <motion.div
        initial={{ scale: 1, x: 0 }}
        animate={isOpening ? {
          scale: 3.5,
          x: '20%',
        } : (isSubmitting ? {
          scale: [1, 1.02, 1],
        } : {})}
        transition={isOpening ? {
          duration: 1,
          ease: "easeOut",
          delay: 0.6,
        } : {
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
        className="w-[90%] sm:w-[85%] md:w-[70%] lg:w-[60%] xl:w-[500px]"
        style={{
          maxWidth: '500px',
          aspectRatio: '3/4',
          position: 'relative',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* === PAGE STACK === */}
        {Array.from({ length: 6 }).map((_, index) => {
            const isTopPage = index === 0;
            const darkness = index * 7; 
            const zOffset = -(index + 1) * 1.5; 

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: isTopPage ? '#FAF8F3' : `hsl(38, 25%, ${96 - darkness}%)`,
                  borderRadius: '3px 6px 6px 3px',
                  boxShadow: isTopPage 
                    ? 'inset 25px 0 40px rgba(0,0,0,0.15)' 
                    : `inset ${25 + index}px 0 ${40 + index*2}px rgba(0,0,0,${0.15 + index * 0.05})`,
                  zIndex: -index,
                  transform: `translateZ(${zOffset}px)`,
                  backgroundImage: isTopPage ? `
                    repeating-linear-gradient(transparent, transparent 31px, rgba(217, 207, 192, 0.3) 31px, rgba(217, 207, 192, 0.3) 32px)
                  ` : 'none',
                  backgroundSize: '100% 32px',
                  backgroundPosition: '0 8px',
                  borderRight: index > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  borderBottom: index > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {isTopPage && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35px', background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' }} />}
              </div>
            );
        })}

        {/* === FRONT COVER === */}
        <motion.div
          animate={isOpening ? { rotateY: -180 } : { rotateY: 0 }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
          }}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            zIndex: 10,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* -- COVER FRONT -- */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #8B7355 0%, #6B5E52 50%, #7A6A5C 100%)',
            borderRadius: '4px 8px 8px 4px',
            border: '4px solid #5A4E42',
            boxShadow: '5px 5px 20px rgba(0,0,0,0.4)',
            padding: '20px',
            backgroundImage: `repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,0.03) 0px, transparent 2px, transparent 3px, rgba(0,0,0,0.03) 4px)`,
            transform: 'translateZ(0)',
          }}>
            
            {/* Corner decorations - hide on very small screens */}
            <svg className="hidden sm:block" style={{ position: 'absolute', top: '8px', left: '8px', width: '30px', height: '30px' }} viewBox="0 0 40 40">
              <path d="M 0,15 L 0,0 L 15,0" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.7" />
              <circle cx="8" cy="8" r="2" fill="#D4AF37" opacity="0.6" />
            </svg>
            <svg style={{ position: 'absolute', top: '12px', right: '12px', width: '40px', height: '40px' }} viewBox="0 0 40 40">
              <path d="M 40,15 L 40,0 L 25,0" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.7" />
              <circle cx="32" cy="8" r="2" fill="#D4AF37" opacity="0.6" />
            </svg>
            <svg style={{ position: 'absolute', bottom: '12px', left: '12px', width: '40px', height: '40px' }} viewBox="0 0 40 40">
              <path d="M 0,25 L 0,40 L 15,40" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.7" />
              <circle cx="8" cy="32" r="2" fill="#D4AF37" opacity="0.6" />
            </svg>
            <svg style={{ position: 'absolute', bottom: '12px', right: '12px', width: '40px', height: '40px' }} viewBox="0 0 40 40">
              <path d="M 40,25 L 40,40 L 25,40" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.7" />
              <circle cx="32" cy="32" r="2" fill="#D4AF37" opacity="0.6" />
            </svg>

            <div style={{ position: 'absolute', inset: '20px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '4px', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '-10px', right: '30%', width: '30px', height: '80px', background: 'linear-gradient(180deg, #C41E3A 0%, #8B1E3F 100%)', clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)', boxShadow: '2px 4px 8px rgba(0,0,0,0.3)', zIndex: 1 }} />

            <div className="text-center mb-8">
              <h1 style={{ fontFamily: "'Niconne', cursive", fontSize: '3.5rem', color: '#E5DDD0', textShadow: '2px 2px 4px rgba(0,0,0,0.6)', letterSpacing: '3px', marginBottom: '10px' }}>Leaf Note</h1>
              <div style={{ width: '60%', height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', margin: '0 auto' }} />
            </div>

            {error && <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '2px solid rgba(220, 38, 38, 0.3)', color: '#FCA5A5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontFamily: "'Courier New', monospace", fontSize: '0.9rem' }}>{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#E5DDD0', marginBottom: '8px', fontFamily: "'Georgia', serif" }}>Username</label>
                <input {...register("userName")} type="text" disabled={isOpening} style={{ width: '100%', padding: '12px 16px', border: '2px solid #B5A495', borderRadius: '8px', backgroundColor: 'rgba(255,254,249,0.9)', color: '#4A4239', fontFamily: "'Courier New', monospace", fontSize: '1rem', outline: 'none' }} placeholder="Enter your username" />
                {errors.userName && <p style={{ color: '#FCA5A5', fontSize: '0.85rem', marginTop: '6px', fontFamily: "'Courier New'" }}>{errors.userName.message}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#E5DDD0', marginBottom: '8px', fontFamily: "'Georgia', serif" }}>Password</label>
                <input {...register("password")} type="password" disabled={isOpening} style={{ width: '100%', padding: '12px 16px', border: '2px solid #B5A495', borderRadius: '8px', backgroundColor: 'rgba(255,254,249,0.9)', color: '#4A4239', fontFamily: "'Courier New', monospace", fontSize: '1rem', outline: 'none' }} placeholder="Enter your password" />
                {errors.password && <p style={{ color: '#FCA5A5', fontSize: '0.85rem', marginTop: '6px', fontFamily: "'Courier New'" }}>{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting || isOpening} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #B5A495 0%, #9B8A7C 100%)', color: '#FFFEF9', border: '3px solid #8B7355', borderRadius: '8px', fontFamily: "'Georgia', serif", fontSize: '1.1rem', fontWeight: '600', cursor: isSubmitting || isOpening ? 'not-allowed' : 'pointer', opacity: isSubmitting || isOpening ? 0.7 : 1, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.3s' }}>
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Opening Book...
                  </span>
                ) : "Open Book"}
              </button>
            </form>
            <p style={{ marginTop: '24px', textAlign: 'center', color: '#D9CFC0', fontFamily: "'Georgia', serif", fontSize: '0.9rem' }}>Don&apos;t have an account? <a href="/register" style={{ color: '#E5DDD0', fontWeight: '600', textDecoration: 'none', borderBottom: '1px solid #E5DDD0' }}>Create One</a></p>
          </div>

          {/* -- COVER BACK (Kapağın İçi) -- */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#F0EBE0',
            borderRadius: '8px 4px 4px 8px',
            boxShadow: 'inset -5px 0 20px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ border: '2px solid #B5A495', padding: '20px', textAlign: 'center', opacity: 0.6, transform: 'scaleX(-1)' }}>
              <p style={{ fontFamily: "'Georgia', serif", fontSize: '0.8rem', color: '#8B7355' }}>Ex Libris</p>
              <p style={{ fontFamily: "'Niconne', cursive", fontSize: '1.5rem', color: '#6B5E52' }}>Leaf Note</p>
            </div>
          </div>
        </motion.div>

        {/* SPINE (Kitap Sırtı) */}
        <motion.div 
           animate={isOpening ? { rotateY: -90 } : { rotateY: 0 }}
           transition={{ duration: 1.6, ease: "easeInOut" }}
           style={{
            position: 'absolute',
            left: '-25px',
            top: 0,
            bottom: 0,
            width: '25px',
            background: 'linear-gradient(90deg, #5A4E42 0%, #6B5E52 100%)',
            transformOrigin: 'right center',
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
            boxShadow: '-3px 0 8px rgba(0,0,0,0.4)',
            zIndex: 9
           }}
        />

      </motion.div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}