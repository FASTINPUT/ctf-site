import Link from "next/link";
export default function About() {
  return (
    <main>
      <span className="eyebrow">FASTINPUT / ABOUT</span>
      <h1>기록에서 이해로.</h1>
      <div className="profile-banner">
        <h2>CTF Writeups & Security Notes</h2>
        <p className="muted">
          문제를 해결하는 과정과 그 안의 원리를 기록하는 개인 보안 학습
          아카이브입니다.
        </p>
      </div>
      <div className="chart-grid">
        <section className="card">
          <h2>Research & Learning</h2>
          <p className="muted">
            Web, Pwn, Reversing, Crypto, Forensic 분야에서 배운 내용을 문제
            분석, 실습과 검증, 회고로 정리합니다.
          </p>
          <Link className="button primary" href="/writeups">
            연구 기록 탐색 ↗
          </Link>
        </section>
        <section className="card">
          <h2>Portfolio</h2>
          <p className="muted">
            공개된 풀이와 학습 통계에서 관심 분야와 학습 과정을 확인할 수
            있습니다. 검증하지 않은 경력이나 성과는 표시하지 않습니다.
          </p>
          <Link className="button" href="/stats">
            학습 통계 보기
          </Link>
        </section>
      </div>
    </main>
  );
}
