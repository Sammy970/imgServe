import Image from "next/image";

export default function Home() {
  return (
    <main className="flex items-center justify-center w-full h-screen">
      <div className="flex flex-row gap-10 w-full items-center justify-center">
        <div className="max-w-[100%]">
          <img
            src={`https://imgserve.vercel.app/tr:w-0.7/31898534-55b7-4700-a04a-e38956fac843-2487m.webp`}
            className="object-cover w-full h-full rounded-lg"
          />
        </div>
        <div className="max-w-[100%]">
          <img
            src={`https://imgserve.vercel.app/tr:fo-person,ar-4_3,w-300/3cc12433-b5cc-4ca8-8f85-e8d37eb8f8fe-1tn2lc.jpg`}
            className="object-cover w-full h-full rounded-lg"
            fetchPriority="high"
          />
        </div>
      </div>
    </main>
  );
}
