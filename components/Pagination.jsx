// import React from 'react'

// const Pagination = ({page,pageSize,totalItem,onPageChange}) => {
//   const totalPages=Math.ceil(totalItem / pageSize);

//   const handlePageChange=(newPage)=>{
// if(newPage >=1 && newPage <= totalPages){

//   onPageChange(newPage);
// }
//   }

//   return (
//     <section className="container mx-auto flex justify-center items-center my-8">
//       <button className="mr-2 px-2 py-1 border border-gray-300 rounded" disabled={page===1} onClick={()=>handlePageChange(page - 1)}>
//         Previous
//       </button>
//       <span className='mx-2'>
//         Page {page} of {totalPages}
//       </span>
//       <button
//         className='ml-2 px-2 py-1 border border-gray-300 rounded' disabled={page===totalPages} onClick={()=>handlePageChange(page + 1)}>
//         Next
//       </button>
//     </section>

//   )
// }

// export default Pagination




import React from 'react'

const Pagination = ({page, pageSize, totalItem, onPageChange}) => {
  const totalPages = Math.ceil(totalItem / pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  }

  return (
    <section className="container mx-auto flex justify-center items-center my-8">
      <button 
        className={`mr-2 px-4 py-2 border rounded ${
          page === 1 
            ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100' 
            : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'
        }`}
        disabled={page === 1} 
        onClick={() => handlePageChange(page - 1)}
      >
        Previous
      </button>
      
      <span className='mx-4 font-medium'>
        Page {page} of {totalPages}
      </span>
      
      <button
        className={`ml-2 px-4 py-2 border rounded ${
          page === totalPages 
            ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100' 
            : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'
        }`}
        disabled={page === totalPages} 
        onClick={() => handlePageChange(page + 1)}
      >
        Next
      </button>
    </section>
  )
}

export default Pagination;