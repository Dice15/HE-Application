import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';


export async function middleware(request: NextRequest) {
    // 정적 파일이나 내부 요청이 아닌 경우 추가 처리 수행
    if (!isInternalOrStaticRequest(request)) {
        if (!isDeviceTypeMatchedWithPage(request)) {
            if (getDeviceType(request) === 1) {
                return NextResponse.redirect(new URL(`${getHostUrl(request)}/mobile`));
            }
        }

        if (!isWeblogAPIRequest(request)) {
            logWebRequest(request);
        }

        // 로그인이 필요한 페이지에 대한 인증 확인
        if (!isAPIRequest(request) && isRequireAuthentication(request)) {
            // 사용자 인증이 되지 않은 경우 로그인 페이지로 리다이렉트
            if (!(await isUserAuthenticated(request))) {
                return NextResponse.redirect(new URL(getHostUrl(request)));
            }
        }
    }
    return NextResponse.next();
}


function isInternalOrStaticRequest(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname;
    return pathname.startsWith('/_next/')
        || pathname.startsWith('/favicon.ico')
        || pathname.startsWith('/images')
        || pathname.startsWith('/samples');
}


function isAPIRequest(request: NextRequest): boolean {
    return request.nextUrl.pathname.startsWith('/api');
}


function isWeblogAPIRequest(request: NextRequest): boolean {
    return request.nextUrl.pathname.startsWith('/api/weblog');
}


function isRequireAuthentication(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname;
    return pathname.startsWith("/diseasePrediction/kidneyDisease/predict");
}


function getHostUrl(request: NextRequest): string {
    return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}


async function isUserAuthenticated(request: NextRequest): Promise<boolean> {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    return session !== null;
}


function getDeviceType(request: NextRequest): number {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /mobile/i.test(userAgent);
    return Number(isMobile);
}


function isDeviceTypeMatchedWithPage(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /mobile/i.test(userAgent);
    const isMobilePage = request.nextUrl.pathname.includes("mobile");
    return isMobile === isMobilePage;
}


function getClientIp(request: NextRequest): string {
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map(ip => ip.trim());
        return ips[0];
    }
    return request.ip || 'unknown';
}


async function getGeoLocation(ip: string) {
    if (ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
        return { city: 'Local', country: 'Local' };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}`);
    if (!response.ok) {
        console.error('Failed to fetch geo location');
        return { city: 'Unknown', country: 'Unknown' };
    }
    const data = await response.json();
    return { city: data.city, country: data.country };
}


async function logWebRequest(request: NextRequest) {
    const requestUrl = request.nextUrl.href;
    const clientIp = getClientIp(request);
    const clientGeoLocation = await getGeoLocation(clientIp);

    const apiUrl = new URL('/api/weblog/savelog', request.nextUrl.origin);
    apiUrl.searchParams.append('requestUrl', requestUrl);
    apiUrl.searchParams.append('ip', clientIp);
    apiUrl.searchParams.append('city', clientGeoLocation.city);
    apiUrl.searchParams.append('country', clientGeoLocation.country);

    fetch(apiUrl.toString(), { method: 'GET' });
}
