import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isLoginPath = nextUrl.pathname === '/admin/login'
      
      if (isOnAdmin) {
        if (isLoginPath) {
          if (isLoggedIn) return Response.redirect(new URL('/admin', nextUrl))
          return true
        }
        if (isLoggedIn) return true
        return false // Redirigir a login si no está autenticado
      } else if (isLoggedIn && isLoginPath) {
        return Response.redirect(new URL('/admin', nextUrl))
      }
      
      return true
    },
  },
  providers: [], // Se definen en auth.ts para no romper el Edge Runtime
} satisfies NextAuthConfig
