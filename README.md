# Todo App - Full Stack Application

A modern, secure, and user-friendly task management application built with Next.js and ASP.NET Core.

## Table of Contents
- [Project Overview](#project-overview)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Application Flow](#application-flow)

---

## Project Overview

This is a full-stack todo management system consisting of:
- **Frontend**: Next.js 15 with TypeScript, providing a responsive and modern UI
- **Backend**: ASP.NET Core 9 with JWT authentication and EF Core

### Features
- User registration and authentication (JWT-based)
- Create, read, update, and delete todos
- Mark todos as complete/incomplete
- Due date support
- Protected routes with authentication guards

---

## Technologies

### Frontend Stack
- **Next.js 15**: React-based web framework with App Router
- **React 18**: Component-based UI library
- **TypeScript**: Type-safe JavaScript superset
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Performant form management
- **Zod**: Schema validation library
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state management and caching
- **Axios**: HTTP client with interceptors

### Backend Stack
- **ASP.NET Core 9**: Web API framework
- **Entity Framework Core**: ORM with InMemory database
- **ASP.NET Identity**: User authentication and authorization
- **JWT**: Token-based authentication

---

## Project Structure

```
TodoApp/
├── TodoApp.API/              # Backend API
│   ├── Controllers/          # API endpoints
│   ├── Data/                 # Database context and repositories
│   ├── DTOs/                 # Data transfer objects
│   ├── Models/               # Domain entities and validators
│   └── Services/             # Business logic services
│
└── TodoApp.Web/              # Frontend application
    ├── app/                  # Next.js App Router
    │   ├── layout.tsx        # Root layout
    │   ├── page.tsx          # Home page
    │   ├── providers.tsx     # TanStack Query provider
    │   ├── login/            # Login page
    │   ├── register/         # Registration page
    │   └── todos/            # Todo management page
    ├── components/           # Reusable components
    ├── lib/                  # Utilities and API clients
    │   ├── api-client.ts     # Axios configuration
    │   ├── api/              # API functions
    │   └── validations/      # Zod schemas
    └── store/                # Global state management
```

---

## Installation

### Prerequisites
- Node.js 18+ and npm
- .NET 9 SDK

### Backend Setup
```bash
cd TodoApp.API
dotnet restore
dotnet run
```
API will be available at `http://localhost:5186`

### Frontend Setup
```bash
cd TodoApp.Web
npm install
npm run dev
```
Application will be available at `http://localhost:3000`

### Environment Variables
Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5186
```

Note: The `NEXT_PUBLIC_` prefix is required for browser-accessible variables in Next.js.

---

## Core Concepts

### Next.js App Router
Next.js uses file-based routing where the file structure in the `app` directory automatically creates routes:
- `app/page.tsx` → `/`
- `app/login/page.tsx` → `/login`
- `app/todos/page.tsx` → `/todos`

### Client vs Server Components
- **Server Components**: Default in Next.js 13+, render on the server
- **Client Components**: Marked with `"use client"`, required for hooks and interactivity

Example:
```tsx
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### TanStack Query
Manages server state with automatic caching and background updates:

```tsx
const { data: todos, isLoading } = useQuery({
  queryKey: ["todos"],
  queryFn: todoApi.getAll,
});
```
const { data: todos, isLoading } = useQuery({
  queryKey: ["todos"],
  queryFn: todoApi.getAll,
});
```

### Zustand State Management
Minimalist global state library, simpler than Redux:

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

// Usage in any component
const { user, logout } = useAuthStore();
```

### React Hook Form
Performant form management with minimal re-renders:

```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});

const onSubmit = (data) => {
  console.log(data);
};

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("username")} />
  {errors.username && <p>{errors.username.message}</p>}
</form>
```

### Zod Validation
TypeScript-first schema validation:

```tsx
const loginSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginInput = z.infer<typeof loginSchema>;
```

---

## Application Flow

### 1. User Registration

Flow:
```
User fills form → React Hook Form → Zod validation
  ↓ (if valid)
authApi.register(data) → POST /api/auth/register
  ↓ (if successful)
Success message → Redirect to /login after 2 seconds
```

Implementation:
```tsx
const onSubmit = async (data: RegisterInput) => {
  await authApi.register(data);
  setSuccess(true);
  setTimeout(() => router.push("/login"), 2000);
};
```

### 2. User Login

Flow:
```
User enters credentials → React Hook Form → Zod validation
  ↓
authApi.login(data) → POST /api/auth/login
  ↓ (returns JWT token)
useAuthStore.login(token, user)
  ↓
Token stored in localStorage → Redirect to /todos
```

Implementation:
```tsx
const onSubmit = async (data: LoginInput) => {
  const response = await authApi.login(data);
  login(response.accessToken, { userName: data.userName, ... });
  router.push("/todos");
};
```

### 3. Protected Routes

AuthGuard component ensures authentication:

```tsx
export function AuthGuard({ children }) {
  const { isAuthenticated, initAuth } = useAuthStore();
  
  useEffect(() => {
    initAuth(); // Load token from localStorage
  }, []);
  
  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated]);
  
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
```

Usage:
```tsx
export default function TodosPage() {
  return (
    <AuthGuard>
      <TodosContent />
    </AuthGuard>
  );
}
```

### 4. Fetching Todos

Using TanStack Query:
```tsx
const { data: todos, isLoading } = useQuery({
  queryKey: ["todos"],
  queryFn: todoApi.getAll, // GET /api/todo
});
```
});
```

Automatic token injection via Axios interceptor:
```tsx
// lib/api-client.ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 5. Creating Todos

Using mutations:
```tsx
const createMutation = useMutation({
  mutationFn: todoApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
    reset();
  },
});

const onSubmit = (data) => {
  createMutation.mutate(data); // POST /api/todo
};
```

### 6. Toggle Todo Completion

```tsx
const toggleMutation = useMutation({
  mutationFn: todoApi.toggle,
  onSuccess: (data) => {
    queryClient.setQueryData(["todos"], (old) => {
      return old.map(todo => 
        todo.todoId === data.todoId ? data : todo
      );
    });
  },
});

<input
  type="checkbox"
  checked={todo.isCompleted}
  onChange={() => toggleMutation.mutate(todo.todoId)}
/>
```

### 7. Automatic Logout on 401

Axios response interceptor handles expired tokens:
```tsx
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## Styling with Tailwind CSS

Tailwind uses utility classes for rapid UI development:

```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  {/*
    bg-blue-500: Blue background
    text-white: White text
    p-4: 1rem padding (16px)
    rounded-lg: Rounded corners
    hover:bg-blue-600: Darker blue on hover
  */}
  Hello World
</div>
```

---

## Security Considerations

1. **Token Storage**: Currently using localStorage. Consider httpOnly cookies for production.
2. **HTTPS**: Always use HTTPS in production environments.
3. **CORS**: Backend should only allow trusted origins.
4. **Environment Variables**: Never commit `.env.local` to version control.
5. **Input Validation**: Both client-side (Zod) and server-side validation implemented.

---

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

The optimized build will be created in the `.next` directory.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Todos (Protected)
- `GET /api/todo` - Get all todos
- `GET /api/todo/{id}` - Get todo by ID
- `POST /api/todo` - Create new todo
- `PUT /api/todo/{id}` - Update todo
- `PATCH /api/todo/{id}/toggle` - Toggle completion status
- `DELETE /api/todo/{id}` - Delete todo

---

## Development Workflow

1. Start backend: `cd TodoApp.API && dotnet run`
2. Start frontend: `cd TodoApp.Web && npm run dev`
3. Access application at `http://localhost:3000`
4. API available at `http://localhost:5186`

---

## Future Enhancements

- Swagger/OpenAPI integration for automatic type generation
- Global error boundary implementation
- Skeleton loading states
- Dark mode support
- Unit and integration tests
- Deployment to cloud platforms (Azure, Vercel)
- Real database implementation (SQL Server, PostgreSQL)
- Email verification
- Password reset functionality

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/)

---

## License

This project is for educational purposes.
