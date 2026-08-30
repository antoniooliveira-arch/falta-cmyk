import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/admin-login']
  const isPublicPath = publicPaths.some(p => path.startsWith(p))

  // Admin paths
  const isAdminPath = path.startsWith('/admin')

  // Escola paths
  const isEscolaPath = path.startsWith('/escola')

  if (!session && !isPublicPath) {
    // Redirect to login if not authenticated
    const redirectUrl = isAdminPath ? '/admin-login' : '/login'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  if (session) {
    const userRole = session.user.user_metadata?.role
    const userSchoolId = session.user.user_metadata?.school_id

    // Admin trying to access escola area
    if (userRole === 'admin' && isEscolaPath) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // Escola trying to access admin area
    if (userRole === 'school' && isAdminPath) {
      return NextResponse.redirect(new URL('/escola/dashboard', request.url))
    }

    // Authenticated user accessing login pages
    if (isPublicPath) {
      const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : '/escola/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}