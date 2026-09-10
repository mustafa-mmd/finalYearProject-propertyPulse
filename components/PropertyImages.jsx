"use client";

import Image from "next/image";
import { Gallery, Item } from "react-photoswipe-gallery";
import { formatPropertyImage } from "@/utils/imageHelper";

const PropertyImages = ({ images = [] }) => {
  const formattedImages = images.map((img) => formatPropertyImage(img));

  if (!formattedImages.length) return null;

  return (
    <Gallery>
      <section className="bg-blue-50 p-4">
        <div className="container mx-auto">
          {formattedImages.length === 1 ? (
            <Item
              original={formattedImages[0]}
              thumbnail={formattedImages[0]}
              width="1600"
              height="1000"
            >
              {({ ref, open }) => (
                <div className="relative h-[400px] max-w-4xl mx-auto rounded-xl overflow-hidden cursor-pointer">
                  <Image
                    ref={ref}
                    onClick={open}
                    src={formattedImages[0]}
                    alt="Property detail photo"
                    fill
                    priority
                    quality={95}
                    unoptimized={formattedImages[0].startsWith("http")}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    className="object-cover w-full h-full rounded-xl hover:scale-105 transition duration-300"
                  />
                </div>
              )}
            </Item>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formattedImages.map((image, index) => (
                <div
                  key={index}
                  className={`${
                    formattedImages.length === 3 && index === 2 ? "md:col-span-2" : "col-span-1"
                  }`}
                >
                  <Item
                    original={image}
                    thumbnail={image}
                    width="1600"
                    height="1000"
                  >
                    {({ ref, open }) => (
                      <div className="relative h-[360px] w-full rounded-xl overflow-hidden cursor-pointer">
                        <Image
                          ref={ref}
                          onClick={open}
                          src={image}
                          alt={`Property photo ${index + 1}`}
                          fill
                          quality={95}
                          unoptimized={image.startsWith("http")}
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover w-full h-full rounded-xl hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}
                  </Item>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Gallery>
  );
};

export default PropertyImages;
