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
      const isOnProtectedPublic = nextUrl.pathname.startsWith('/acervo') || nextUrl.pathname.startsWith('/proyectos')
      const isPublicLoginPath = nextUrl.pathname === '/ingresar'
      
      if (isOnAdmin) {
        if (isLoginPath) {
          if (isLoggedIn) return Response.redirect(new URL('/admin', nextUrl))
          return true
        }
        if (isLoggedIn) return true
        return false // Redirigir a login de admin si no está autenticado
      } else if (isLoggedIn && isLoginPath) {
        return Response.redirect(new URL('/admin', nextUrl))
      }

      if (isOnProtectedPublic) {
        if (isLoggedIn) return true
        // Redirect to friendly login screen for public users
        const loginUrl = new URL('/ingresar', nextUrl)
        loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
        return Response.redirect(loginUrl)
      }

      if (isLoggedIn && isPublicLoginPath) {
        // Redirect to their callback url or home if they are already logged in
        const callbackUrl = nextUrl.searchParams.get('callbackUrl') || '/'
        return Response.redirect(new URL(callbackUrl, nextUrl))
      }
      
      return true
    },
  },
  providers: [], // Se definen en auth.ts para no romper el Edge Runtime
} satisfies NextAuthConfig
