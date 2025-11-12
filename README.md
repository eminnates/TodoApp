# 🎯 Todo App - Next.js Frontend Rehberi

Modern, güvenli ve kullanıcı dostu bir todo uygulaması. Bu rehber Next.js'e hiç bilgin olmasa bile başlayabilmen için hazırlandı.

## 📚 İçindekiler
- [Proje Nedir?](#proje-nedir)
- [Teknolojiler](#teknolojiler)
- [Klasör Yapısı](#klasör-yapısı)
- [Kurulum](#kurulum)
- [Kavramlar](#kavramlar)
- [Nasıl Çalışır?](#nasıl-çalışır)

---

## 🎯 Proje Nedir?

Bu Next.js frontend uygulaması, ASP.NET Core backend'ini kullanan bir todo yönetim sistemi. Kullanıcılar:
- Kayıt olabilir ve giriş yapabilir (JWT authentication)
- Todo ekleyebilir, düzenleyebilir, silebilir
- Todo'ları tamamlanmış olarak işaretleyebilir
- Tarih ekleyebilir

---

## 🛠 Teknolojiler

### Temel
- **Next.js 15**: React tabanlı web framework'ü (sayfalar oluşturur, routing yapar)
- **React 18**: UI bileşenlerini oluşturan kütüphane
- **TypeScript**: JavaScript'e tip güvenliği ekler (hataları önler)

### Stil
- **Tailwind CSS**: Utility-first CSS framework'ü (hızlı styling)

### Form & Validation
- **React Hook Form**: Formları yönetir, performanslı
- **Zod**: Şema doğrulama (email doğru mu, şifre yeterli uzun mu?)

### State Management
- **Zustand**: Basit, global state yönetimi (kullanıcı bilgisi, login durumu)
- **TanStack Query**: Server state yönetimi (API istekleri, cache, otomatik yenileme)

### API İletişimi
- **Axios**: HTTP istekleri için (fetch'in gelişmiş versiyonu)

---

## 📁 Klasör Yapısı

```
TodoApp.Web/
├── app/                    # Next.js App Router (sayfalar)
│   ├── layout.tsx         # Ana layout (her sayfada ortak)
│   ├── page.tsx           # Ana sayfa (/)
│   ├── providers.tsx      # TanStack Query provider
│   ├── globals.css        # Global CSS
│   ├── login/
│   │   └── page.tsx       # Login sayfası (/login)
│   ├── register/
│   │   └── page.tsx       # Register sayfası (/register)
│   └── todos/
│       └── page.tsx       # Todos sayfası (/todos)
├── components/            # Yeniden kullanılabilir bileşenler
│   └── auth-guard.tsx     # Korumalı sayfa wrapper'ı
├── lib/                   # Yardımcı fonksiyonlar
│   ├── api-client.ts      # Axios instance (token ekler)
│   ├── api/
│   │   ├── auth.ts        # Auth API fonksiyonları
│   │   └── todo.ts        # Todo API fonksiyonları
│   └── validations/
│       ├── auth.ts        # Login/Register validasyon şemaları
│       └── todo.ts        # Todo validasyon şemaları
├── store/                 # Global state
│   └── auth-store.ts      # Kullanıcı login state (Zustand)
├── .env.local            # Environment variables (API URL)
├── package.json          # Bağımlılıklar
├── tailwind.config.ts    # Tailwind konfigürasyonu
└── tsconfig.json         # TypeScript konfigürasyonu
```

---

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle
```bash
cd TodoApp.Web
npm install
```

### 2. Environment Variables
`.env.local` dosyası zaten oluşturuldu:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
> ⚠️ `NEXT_PUBLIC_` öneki: Next.js'de browser'da erişilebilir değişkenler bu önekle başlar.

### 3. Backend'i Çalıştır
Başka bir terminalde:
```bash
cd TodoApp/TodoApp.API
dotnet run
```
Backend `http://localhost:5000` üzerinde çalışmalı.

### 4. Frontend'i Çalıştır
```bash
npm run dev
```
Frontend `http://localhost:3000` üzerinde açılacak.

---

## 📖 Kavramlar

### Next.js Nedir?
React tabanlı bir framework. Avantajları:
- **File-based routing**: `app/login/page.tsx` → `/login` rotası otomatik oluşur
- **Server & Client Components**: Bazı kodlar sunucuda, bazıları tarayıcıda çalışır
- **Optimizasyon**: Otomatik kod bölme, image optimization vs.

### Client vs Server Components
- **Server Component**: Default, sunucuda render olur (SEO+, veri getirme hızlı)
- **Client Component**: `"use client"` ile başlar, tarayıcıda çalışır (state, event handlers için gerekli)

Örnek:
```tsx
"use client"; // Bu satır olmadan useState çalışmaz!

import { useState } from "react";

export default function MyPage() {
  const [count, setCount] = useState(0); // Client-side state
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### TanStack Query (React Query) Nedir?
Server state'i yöneten kütüphane. Avantajları:
- **Otomatik cache**: Aynı veriyi tekrar getirmez
- **Background refetch**: Veri eskiyince otomatik yeniler
- **Loading/Error states**: Tek satırda `isLoading`, `error` durumları

Örnek:
```tsx
const { data: todos, isLoading } = useQuery({
  queryKey: ["todos"],        // Cache key
  queryFn: todoApi.getAll,    // Veri getirme fonksiyonu
});

if (isLoading) return <p>Yükleniyor...</p>;
return <ul>{todos.map(t => <li>{t.todoContent}</li>)}</ul>;
```

### Zustand Nedir?
Basit global state kütüphanesi. Redux'tan çok daha basit.

Örnek:
```tsx
// store/auth-store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (token, user) => {
    localStorage.setItem("token", token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, isAuthenticated: false });
  },
}));

// Kullanımı (herhangi bir component'te)
const { user, logout } = useAuthStore();
<p>Hoş geldin {user.fullName}</p>
<button onClick={logout}>Çıkış</button>
```

### React Hook Form Nedir?
Performanslı form yönetimi. Her tuşa basmada re-render olmaz.

Örnek:
```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema), // Zod ile validasyon
});

const onSubmit = (data) => {
  console.log(data); // { email: "...", password: "..." }
};

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("email")} />
  {errors.email && <p>{errors.email.message}</p>}
</form>
```

### Zod Nedir?
TypeScript-first şema validasyonu.

Örnek:
```tsx
const loginSchema = z.object({
  email: z.string().email("Geçerli email gir"),
  password: z.string().min(6, "En az 6 karakter"),
});

type LoginInput = z.infer<typeof loginSchema>; // { email: string, password: string }
```

---

## ⚙️ Nasıl Çalışır?

### 1. Kullanıcı Kaydı (/register)

**Akış:**
```
User → Form doldurur → React Hook Form → Zod validasyon
  ↓ (Geçerli ise)
authApi.register(data) → Axios → Backend /api/auth/register
  ↓ (Başarılı ise)
Success mesajı → 2 saniye sonra /login'e yönlendir
```

**Kod:**
```tsx
// app/register/page.tsx
const onSubmit = async (data: RegisterInput) => {
  await authApi.register(data);  // API çağrısı
  setSuccess(true);
  setTimeout(() => router.push("/login"), 2000);
};
```

### 2. Giriş Yapma (/login)

**Akış:**
```
User → Email/Şifre gir → React Hook Form → Zod validasyon
  ↓
authApi.login(data) → Backend /api/auth/login
  ↓ (Başarılı ise)
JWT Token döner → useAuthStore.login(token, user)
  ↓
Token localStorage'a kaydedilir → /todos'a yönlendir
```

**Kod:**
```tsx
// app/login/page.tsx
const onSubmit = async (data: LoginInput) => {
  const response = await authApi.login(data); // { accessToken, expiresAt }
  login(response.accessToken, { email: data.email, ... });
  router.push("/todos");
};
```

### 3. Korumalı Sayfa (/todos)

**AuthGuard:**
```tsx
// components/auth-guard.tsx
export function AuthGuard({ children }) {
  const { isAuthenticated, initAuth } = useAuthStore();
  
  useEffect(() => {
    initAuth(); // localStorage'dan token'ı yükle
  }, []);
  
  useEffect(() => {
    if (!isAuthenticated) router.push("/login"); // Login yoksa yönlendir
  }, [isAuthenticated]);
  
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
```

**Kullanımı:**
```tsx
// app/todos/page.tsx
export default function TodosPage() {
  return (
    <AuthGuard>
      <TodosContent /> {/* Sadece login varsa gösterir */}
    </AuthGuard>
  );
}
```

### 4. Todo Listeleme

**TanStack Query:**
```tsx
const { data: todos, isLoading } = useQuery({
  queryKey: ["todos"],
  queryFn: todoApi.getAll, // GET /api/todo
});

if (isLoading) return <p>Yükleniyor...</p>;
return todos.map(todo => <TodoItem key={todo.todoId} todo={todo} />);
```

**Axios Interceptor (Otomatik Token Ekleme):**
```tsx
// lib/api-client.ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Her istekte ekle
  }
  return config;
});
```

### 5. Todo Oluşturma

**Mutation:**
```tsx
const createMutation = useMutation({
  mutationFn: todoApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] }); // Liste'yi yenile
    reset(); // Formu temizle
  },
});

const onSubmit = (data) => {
  createMutation.mutate(data); // POST /api/todo
};
```

### 6. Todo Toggle (Tamamla)

```tsx
const toggleMutation = useMutation({
  mutationFn: todoApi.toggle,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});

<input
  type="checkbox"
  checked={todo.isCompleted}
  onChange={() => toggleMutation.mutate(todo.todoId)} // PATCH /api/todo/{id}/toggle
/>
```

### 7. 401 Hatası (Token Süresi Doldu)

**Axios Response Interceptor:**
```tsx
// lib/api-client.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // Otomatik logout
    }
    return Promise.reject(error);
  }
);
```

---

## 🎨 Tailwind CSS Kullanımı

Tailwind, utility-class'lar kullanır. Örnek:
```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  {/* 
    bg-blue-500: Mavi arka plan
    text-white: Beyaz metin
    p-4: 1rem padding (16px)
    rounded-lg: Kenarları yuvarlat
    hover:bg-blue-600: Üzerine gelince koyu mavi
  */}
  Merhaba!
</div>
```

---

## 🔐 Güvenlik Notları

1. **JWT Token localStorage'da**: Basit ama XSS'e açık. Prod'da httpOnly cookie düşün.
2. **HTTPS**: Production'da mutlaka HTTPS kullan.
3. **CORS**: Backend'de sadece güvendiğin origin'lere izin ver.
4. **Environment Variables**: `.env.local` Git'e commit edilmemeli (.gitignore'da var).

---

## 🚀 Production Build

```bash
npm run build
npm start
```
Build edilen dosyalar `.next/` klasöründe olur.

---

## 📝 Sonraki Adımlar

1. **Swagger Entegrasyonu**: Backend'den otomatik tip üretimi
2. **Error Handling**: Global error boundary
3. **Loading States**: Skeleton loaders
4. **Dark Mode**: Tailwind dark mode
5. **Testing**: Jest + React Testing Library
6. **Deploy**: Vercel, Netlify veya Azure

---

## 🆘 Yardım

- [Next.js Dokümantasyon](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

---

## 📄 Lisans

Bu proje eğitim amaçlıdır.
