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
    return pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico');
}


function isAPIRequest(request: NextRequest): boolean {
    return request.nextUrl.pathname.startsWith('/api');
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
