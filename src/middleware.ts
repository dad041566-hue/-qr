import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 루트 → 로그인 리다이렉트 (로그인 상태면 admin으로)
  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/admin' : '/login', request.url))
  }

  // Protected routes
  if (!user && (pathname.startsWith('/admin') || pathname === '/change-password')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Superadmin route
  if (pathname.startsWith('/superadmin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.app_metadata?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/admin/:path*', '/change-password', '/superadmin/:path*'],
}
