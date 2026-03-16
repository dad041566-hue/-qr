# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - heading "TableFlow 대기 등록" [level=1] [ref=e6]
      - generic [ref=e7]:
        - button "대기 확인/취소" [ref=e8]
        - button "홈으로 나기기" [ref=e9]
    - generic [ref=e12]:
      - button "뒤로" [ref=e13]:
        - img [ref=e14]
        - text: 뒤로
      - heading "방문 인원을 선택해주세요" [level=2] [ref=e16]
      - paragraph [ref=e17]: 유아를 포함한 총 인원수를 선택해주세요.
      - generic [ref=e18]:
        - button "-" [ref=e19]
        - generic [ref=e20]:
          - img [ref=e21]
          - generic [ref=e26]: "3"
          - generic [ref=e27]: 명
        - button "+" [ref=e28]
      - paragraph [ref=e29]: new row violates row-level security policy for table "waitings"
      - button "대기 등록 완료하기" [ref=e30]
  - region "Notifications alt+T"
```