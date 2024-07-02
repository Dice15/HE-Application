# 질병 검진 서비스
동형암호를 활용하여 환자의 정보를 보호하면서 질병을 검사하는 웹 서비스

</br>

# 프로젝트 개요
### Info
- 개발 기간 : 2024.03 ~ 2024.06
- SW 등록일 : 2024.06.24 (SW 국가 R&D 성과물 등록)
- 핵심 기술 : <img src="https://img.shields.io/badge/Node%20SEAL-339933?style=flat-square&logo=node.js&logoColor=white"/> ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) <img src="https://img.shields.io/badge/Scikit Learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white"/> <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"/>
- 참여 인원 : 1명 (+피드백 : 김동우 교수)
- 배포 주소 : [https://safe-diagnosis.vercel.app/](https://safe-diagnosis.vercel.app/)
- GitHub : [https://github.com/Dice15/HE-Application](https://github.com/Dice15/HE-Application)

### Works
- 동형암호 CKKS의 암호화, 복호화, 연산을 위한 모듈 개발
- CKKS 암호문의 rescale, relinearize, modulus reduction 자동화
- SIMD 연산을 위해 하나의 암호문에 여러 환자 데이터를 저장하는 로직 구현
- 만성 신장 질환을 예측하는 linear/logistic 회귀 모델 학습 및 CKKS 암호화
- 용량이 큰 공개키를 여러 chunk로 나누어 서버로 전송하는 로직 구현
- 공개키 관리, 환자 데이터 관리, 질병 검진을 하는 REST API 구축
- 웹 페이지 UI 디자인 및 구현

</br>

# 소스코드 주소
### 동형암호 CKKS 모듈
- [CKKS Builder](src/core/modules/homomorphicEncryption/CKKSSeal.ts)

### 클라이언트
- [홈 페이지](src/app/)
- [소개 페이지](src/app/)
- [질병 검사 페이지](src/app/)
- [질병 검사 진행 페이지](src/app/)

### 서버
- [REST API](src/pages/api)
- [Controller](src/controllers)
- [Service](src/services)
- [Middleware](src/middleware.ts)

</br>

# 프로젝트 상세 소개

![슬라이드5](https://github.com/Dice15/HE-Application/assets/102275981/c63e603a-3a1a-4729-90c1-1fe447505745)
![슬라이드6](https://github.com/Dice15/HE-Application/assets/102275981/a74d506a-036e-4027-bb2b-4fe1d8bbaafa)
![슬라이드7](https://github.com/Dice15/HE-Application/assets/102275981/25fc150d-ea0e-456e-9894-4c3baa0c9d9a)
![슬라이드8](https://github.com/Dice15/HE-Application/assets/102275981/f4c1cbd9-c501-4915-82c8-6517cd9b2e5d)
![슬라이드9](https://github.com/Dice15/HE-Application/assets/102275981/5d2341de-b566-4c2f-948a-fd9194404dff)
![슬라이드10](https://github.com/Dice15/HE-Application/assets/102275981/9305b653-9102-4bfe-939f-7e5ba987f69c)
![슬라이드11](https://github.com/Dice15/HE-Application/assets/102275981/9186a040-9a1b-4070-8920-82a308813a8e)
![슬라이드12](https://github.com/Dice15/HE-Application/assets/102275981/c86400fd-fa00-474e-9821-26c62a380096)
![슬라이드13](https://github.com/Dice15/HE-Application/assets/102275981/9e9ada23-429c-4d24-925c-a0c6d4616a76)
![슬라이드14](https://github.com/Dice15/HE-Application/assets/102275981/16c591f7-6dd2-40d7-9e74-b1ac6b80f9bc)
![슬라이드15](https://github.com/Dice15/HE-Application/assets/102275981/1a8390e0-4982-45b8-bd50-9d47614c2597)
![슬라이드16](https://github.com/Dice15/HE-Application/assets/102275981/776ba1c6-9722-4f0e-9629-f28f96c9a01a)
![슬라이드17](https://github.com/Dice15/HE-Application/assets/102275981/779e62b8-c692-4dc3-896f-22edd55d236b)
![슬라이드18](https://github.com/Dice15/HE-Application/assets/102275981/14eb7879-14cd-42ed-9b88-75e548d759bc)
![슬라이드19](https://github.com/Dice15/HE-Application/assets/102275981/577bdc5e-3f8c-42dc-af14-6350b649e525)