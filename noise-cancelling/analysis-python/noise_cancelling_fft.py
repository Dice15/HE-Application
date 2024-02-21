# Sampling interval 설정과 노이즈가 섞인 신호 생성
dt = 0.001  # 초 단위 샘플링 간격
t = np.arange(0, 1, dt)  # 시간 벡터 생성
f_clean = np.sin(2 * np.pi * 50 * t) + np.sin(2 * np.pi * 120 * t)  # 두 주파수를 가진 순수 신호
f_noisy = f_clean + 2.5 * np.random.randn(len(t))  # 가우시안 노이즈 추가

# FFT를 실행하고 노이즈 성분을 식별하는 함수
def fft_noise_identification(f_noisy, t, dt, threshold=100):
    n = len(t)  # 신호 길이
    fhat = np.fft.fft(f_noisy, n)  # 신호에 FFT 수행
    PSD = fhat * np.conj(fhat) / n  # 주파수당 파워 스펙트럼 계산
    freq = (1 / (dt * n)) * np.arange(n)  # Hz 단위의 주파수 x축 생성
    L = np.arange(1, np.floor(n / 2), dtype='int')  # 주파수 벡터의 절반만 사용
    
    # 임계값을 사용하여 유지할 주파수 선택
    indices = PSD > threshold  # 임계값보다 큰 PSD 값에 대한 마스크 생성
    PSDclean = PSD * indices  # 남은 PSD 값에 마스크 적용
    fhat = indices * fhat  # 남은 주파수 성분에 마스크 적용
    ffilt = np.fft.ifft(fhat)  # 필터링된 신호를 역 FFT로 시간 도메인으로 변환
    
    return freq, PSD, PSDclean, L, ffilt

# 정의된 임계값으로 FFT 수행 및 노이즈 식별
threshold = 100  # 노이즈 제거를 위한 임계값 설정
freq, PSD, PSDclean, L, ffilt = fft_noise_identification(f_noisy, t, dt, threshold)

# 결과 그래프 플로팅
fig, axs = plt.subplots(4, 1, figsize=(15, 12))

# 노이즈가 있는 시간 도메인 신호
axs[0].plot(t, f_noisy, color='c', linewidth=1.5, label='Noisy')
axs[0].plot(t, f_clean, color='k', linewidth=2, label='Clean')
axs[0].set_title('Time Domain Signal with Noise')
axs[0].set_xlim(t[0], t[-1])
axs[0].legend()

# 노이즈가 있는 주파수 도메인 표현
axs[1].plot(freq[L], PSD[L], color='c', linewidth=2, label='Noisy')
axs[1].set_title('Frequency Domain Representation with Noise')
axs[1].set_xlim(freq[L[0]], freq[L[-1]])
axs[1].legend()

# 노이즈 제거 후 주파수 도메인
axs[2].plot(freq[L], PSDclean[L], color='k', linewidth=2, label='Cleaned')
axs[2].set_title('Frequency Domain after Noise Removal')
axs[2].set_xlim(freq[L[0]], freq[L[-1]])
axs[2].legend()

# 노이즈 제거 후 시간 도메인 신호
axs[3].plot(t, ffilt.real, color='b', linewidth=2, label='Filtered')
axs[3].plot(t, f_clean, color='k', linewidth=1.5, label='Clean')
axs[3].set_title('Time Domain Signal after Noise Removal')
axs[3].set_xlim(t[0], t[-1])
axs[3].set_ylim(-10, 10)  # 사용자 요청에 따라 y축 범위 조정
axs[3].legend()

plt.tight_layout()
plt.show()
