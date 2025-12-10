"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations/auth"; // Schema'nın register için olanını import et
import { authApi } from "@/lib/api/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); // Damga animasyonu için state

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError("");
      await authApi.register(data);
      
      // 1. Kayıt başarılı olunca Damga Animasyonunu başlat
      setIsSuccess(true);
      
      // 2. Biraz bekleyip Login sayfasına yönlendir
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden" style={{
      background: 'linear-gradient(135deg, #8B7355 0%, #6B5E52 50%, #5A4E42 100%)', // Login ile aynı zemin
      perspective: '1000px',
    }}>
      
      {/* THE LIBRARY CARD */}
      <motion.div
        initial={{ y: -800, rotate: -5 }} // Kart yukarıdan ve hafif eğik gelir
        animate={{ y: 0, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 60, 
          damping: 15, 
          delay: 0.2 
        }}
        style={{
          width: '90%',
          maxWidth: '450px',
          backgroundColor: '#F5F0E6', // Açık manila/saman kağıdı rengi
          backgroundImage: `
            linear-gradient(#E5E0D6 1px, transparent 1px),
            linear-gradient(90deg, #E5E0D6 1px, transparent 1px)
          `, // Hafif kareli/çizgili doku
          backgroundSize: '20px 20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          padding: '40px',
          position: 'relative',
          borderRadius: '2px',
          border: '1px solid #D9CFC0',
        }}
      >
        {/* Delik (Kartoteks deliği) */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '24px',
          backgroundColor: '#5A4E42', // Arka plan rengi (delik hissi için)
          borderRadius: '50%',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
          zIndex: 2
        }} />

        {/* Header Section */}
        <div className="text-center mb-8 border-b-2 border-[#8B7355] pb-4 border-dashed">
          <h1 style={{ 
            fontFamily: "'Courier New', monospace", 
            fontWeight: 'bold', 
            fontSize: '1.5rem', 
            color: '#5A4E42',
            letterSpacing: '-1px',
            textTransform: 'uppercase'
          }}>
            Membership Record
          </h1>
          <p style={{ 
            fontFamily: "'Niconne', cursive", 
            fontSize: '1.8rem', 
            color: '#8B7355',
            marginTop: '-5px'
          }}>
            Leaf Note Archives
          </p>
          <div style={{ 
            marginTop: '10px', 
            fontSize: '0.8rem', 
            fontFamily: "'Courier New', monospace",
            display: 'flex', 
            justifyContent: 'space-between',
            color: '#8B7355'
          }}>
            <span>No: {Math.floor(Math.random() * 10000)}</span>
            <span>Date: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(185, 28, 28, 0.1)', 
            border: '1px dashed #B91C1C', 
            color: '#B91C1C', 
            padding: '8px', 
            marginBottom: '16px', 
            fontFamily: "'Courier New', monospace", 
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative">
          
          {/* Form Alanları - Satır Çizgisi Stilinde */}
          {[
            { label: "Full Name", name: "fullName", type: "text" },
            { label: "Username", name: "userName", type: "text" },
            { label: "Password", name: "password", type: "password" },
            { label: "Confirm Password", name: "confirmPassword", type: "password" }
          ].map((field) => (
            <div key={field.name} style={{ position: 'relative', marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                color: '#8B7355', 
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {field.label}:
              </label>
              <input
                {...register(field.name as any)}
                type={field.type}
                style={{
                  width: '100%',
                  padding: '4px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #B5A495', // Alt çizgi
                  color: '#2D241E',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '1.1rem',
                  outline: 'none',
                  borderRadius: 0,
                }}
              />
              {errors[field.name as keyof RegisterInput] && (
                <p style={{ color: '#B91C1C', fontSize: '0.75rem', marginTop: '2px', fontFamily: "'Courier New'" }}>
                  {errors[field.name as keyof RegisterInput]?.message}
                </p>
              )}
            </div>
          ))}

          <div style={{ paddingTop: '20px' }}>
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2D241E',
                color: '#F5F0E6',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                fontSize: '1rem',
                border: '2px solid #2D241E',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {isSubmitting ? "Processing..." : "Submit Application"}
            </button>
          </div>

          {/* THE STAMP ANIMATION (DAMGA) */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ scale: 3, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: -5 }} // Hafif yamuk vurulur
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15,
                  duration: 0.3
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '4px solid #C41E3A', // Damga Kırmızısı
                  color: '#C41E3A',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '2rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  zIndex: 50,
                  backgroundColor: 'rgba(196, 30, 58, 0.1)', // Hafif mürekkep ıslaklığı
                  backdropFilter: 'blur(1px)',
                  boxShadow: '0 0 0 4px rgba(196, 30, 58, 0.2)', // Mürekkep yayılması
                  pointerEvents: 'none', // Tıklamayı engellemesin
                  whiteSpace: 'nowrap'
                }}
              >
                APPROVED
              </motion.div>
            )}
          </AnimatePresence>

        </form>

        <p style={{ 
          marginTop: '30px', 
          textAlign: 'center', 
          fontFamily: "'Courier New', monospace", 
          fontSize: '0.8rem',
          color: '#8B7355'
        }}>
          Already a member? <a href="/login" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Login here</a>
        </p>

      </motion.div>
    </div>
  );
}