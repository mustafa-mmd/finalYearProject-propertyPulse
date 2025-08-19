// import Image from 'next/image';

// const PropertyHeaderImage = ({image}) => {
//   return (
//     <section>
//       <div className="container-xl m-auto">
//         <div className="grid grid-cols-1">
//           <Image
//             src={image}
//             alt=""
//             className="object-cover h-[400px] w-full"
//             width={0}
//             height={0}
//             sizes="100vw"
//             priority={true}
//           />
//         </div>
//       </div>
//     </section>
//   )
// }

// export default PropertyHeaderImage





import Image from "next/image";

const PropertyHeaderImage = ({ image }) => {
  // fallback image from /public/images/
  const fallbackImage = "/images/default-house.jpg";  

  return (
    <section>
      <div className="container-xl m-auto">
        <div className="grid grid-cols-1">
          <div className="relative w-full h-[400px]">
            <Image
              src={image && image.trim() !== "" ? image : fallbackImage}
              alt="Property header"
            className="object-cover h-[400px] w-full"
             width={0}
             height={0}
             sizes="100vw"
            priority={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyHeaderImage;
