import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-100 py-10 px-2">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 max-sm:ml-4">
        Image Transformations Showcase
      </h1>
      <div className="w-full flex flex-col items-center justify-center mx-auto gap-10 m-10 p-10 rounded-lg shadow-lg bg-white">
        {[
          {
            optimizedSrc:
              "https://imgserve.vercel.app/image/tr:w-600,fo-bowl/31898534-55b7-4700-a04a-e38956fac843-2487m.webp",
            originalSrc:
              "/image/31898534-55b7-4700-a04a-e38956fac843-2487m.webp",
            alt: "Sample Image 1",
          },
          {
            optimizedSrc:
              "https://imgserve.vercel.app/image/tr:fo-person,ar-4_3,w-300,rt-45/3cc12433-b5cc-4ca8-8f85-e8d37eb8f8fe-1tn2lc.jpg",
            originalSrc:
              "/image/3cc12433-b5cc-4ca8-8f85-e8d37eb8f8fe-1tn2lc.jpg",
            alt: "Person Rotated Image",
          },
          {
            optimizedSrc:
              "https://imgserve.vercel.app/image/tr:fo-banana,ar-2_2/7a881a80-3fa0-4ea2-9e9c-f380fc9ab30f-1tn2lg.jpg",
            originalSrc:
              "/image/7a881a80-3fa0-4ea2-9e9c-f380fc9ab30f-1tn2lg.jpg",
            alt: "Banana Image",
          },
          // Add more images here
        ].map((image, index) => (
          <div
            key={index}
            className="w-full flex flex-row gap-10 items-center justify-center"
          >
            <div className="w-[50%]">
              <h2 className="text-md font-semibold text-gray-700 mb-2">
                Transformed Image
              </h2>
              <div className="w-full mb-4">
                <Image
                  src={image.optimizedSrc}
                  alt={image.alt}
                  width={300} // Example width, adjust based on your needs
                  height={300} // Example height, adjust based on your needs
                  layout="responsive"
                  className="rounded-lg"
                  priority
                />
              </div>
            </div>
            <div className="w-[50%]">
              <h2 className="text-md font-semibold text-gray-700 mb-2">
                Original Image
              </h2>
              <div className="w-full">
                <img
                  src={image.originalSrc}
                  alt={image.alt}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
