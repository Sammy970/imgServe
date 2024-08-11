import Image from "next/image";

export default function Home() {
  return (
    <main className="grid md:grid-cols-3 sm:grid-cols-2 gap-10 items-center justify-center w-full h-screen p-10 mb-20">
      {/* <div className="flex flex-row gap-10 w-full items-center justify-center"> */}
      <div className="w-[70%] m-auto">
        <img
          src={`https://imgserve.vercel.app/tr:w-300/31898534-55b7-4700-a04a-e38956fac843-2487m.webp`}
          className="object-cover w-full h-full rounded-lg"
        />
      </div>
      <div className="w-[70%] m-auto">
        <img
          src={`https://imgserve.vercel.app/tr:fo-person,ar-4_3,w-300/3cc12433-b5cc-4ca8-8f85-e8d37eb8f8fe-1tn2lc.jpg`}
          className="object-cover w-full h-full rounded-lg"
          fetchPriority="high"
        />
      </div>
      <div className="w-[70%] m-auto">
        <img
          src={`https://imgserve.vercel.app/tr:fo-banana,ar-2_2/7a881a80-3fa0-4ea2-9e9c-f380fc9ab30f-1tn2lg.jpg`}
          className="object-cover w-full h-full rounded-lg"
          fetchPriority="high"
        />
      </div>
      <div className="w-[70%] m-auto">
        <img
          src={`https://imgserve.vercel.app/tr:fo-orange,ar-2_2/7a881a80-3fa0-4ea2-9e9c-f380fc9ab30f-1tn2lg.jpg`}
          className="object-cover w-full h-full rounded-lg"
          fetchPriority="high"
        />
      </div>
      <div className="w-[70%] m-auto">
        <img
          src={`https://imgserve.vercel.app/tr:fo-car,ar-2_2/34c8d0cb-18d5-4202-bb76-1a99e46d5126-1tn2le.jpg`}
          className="object-cover w-full h-full rounded-lg"
          fetchPriority="high"
        />
      </div>
      <div className="w-[70%] m-auto">
        <img
          src={`https://imgserve.vercel.app/tr:fo-trafficLight,ar-2_1/34c8d0cb-18d5-4202-bb76-1a99e46d5126-1tn2le.jpg`}
          className="object-cover w-full h-full rounded-lg"
          fetchPriority="high"
        />
      </div>
      {/* </div> */}
    </main>
  );
}
