# sayren examples

sayren 운영 환경(게시된 SDK·운영 API)으로 만든 예제 프로젝트입니다. 프로젝트마다 독립 프로젝트이고 잠금 파일·`node_modules`를 자기 폴더에 둡니다.

| 폴더 | 설명 |
|---|---|
| `today-closet/` | 오늘의옷장 — 스토어프론트 템플릿(basic)을 확장한 패션 쇼핑몰. `npx sayren pull`·`deploy`로 호스팅 사이트와 맞춘다 |

`pnpm-workspace.yaml`은 상위 저장소의 pnpm이 이 폴더를 자기 워크스페이스로 잡지 않게 끊는 경계입니다. 각 프로젝트 폴더에서 `pnpm install`을 실행합니다.
