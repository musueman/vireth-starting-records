export const revalidate = false;

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f1f2ee] p-6 text-[#202a26]">
      <meta httpEquiv="refresh" content="0; url=/reader.html" />
      <a
        className="rounded border border-[#245c49] bg-white px-4 py-3 font-semibold text-[#173d32]"
        href="/reader.html"
      >
        비레스 시작상황별 기록 열기
      </a>
    </main>
  );
}
