export const revalidate = false;

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#e9ece8] p-6 text-[#141b18]">
      <meta httpEquiv="refresh" content="0; url=/reader.html" />
      <a
        className="rounded border border-[#166a73] bg-white px-4 py-3 font-semibold text-[#102124]"
        href="/reader.html"
      >
        비레스 5083 이야기 서고 열기
      </a>
    </main>
  );
}
