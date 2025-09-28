// 'use client'
// import { useState,useEffect } from "react"
// import Spinner from "@/components/Spinner"
// import Message from "@/components/Message"

// const Messages = () => {
//   const [messages,setMessages]=useState([]);
//   const [loading,setLoading]=useState(true);

//   useEffect(()=>{
// const getMessages=async()=>{
//   try{

// const res=await fetch('/api/messages');

// if(res.status===200){
//   const data=await res.json();
//   setMessages(data);


// }

//   }catch(err){
// console.log('Error fetching messages',err);
//   }finally{
//     setLoading(false);
//   }
// }

//   },[]);
//   return loading ? (<Spinner loading={loading}/>):(
//     <section className="bg-blue-50">
//       <div className="container m-auto py-24 max-w-6xl">
//         <div
//           className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
//         >
//           <h1 className="text-3xl font-bold mb-4">Your Messages</h1>

//           <div className="space-y-4">
            
//             {messages.length===0 ? (<p>You have no messages</p>) : (
//             messages.map((message)=>(
//               <Message key={message._id} message={message}/>
//             )

//           )
//             )}
            

//           </div>
//         </div>
//       </div>
//     </section>


//   )
// }

// export default Messages





'use client';
import { useState, useEffect } from "react";
import Spinner from "@/components/Spinner";
import Message from "@/components/Message";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const getMessages = async () => {
  try {
    setLoading(true);
    const res = await fetch('/api/messages');

    if (!res.ok) {
      // Try to parse JSON, if fails, fallback to text
      let errorMessage = 'Failed to fetch messages';
      try {
        const errData = await res.json();
        errorMessage = errData.message || errorMessage;
      } catch {
        const text = await res.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    if (mounted) setMessages(data);
  } catch (err) {
    console.error('Error fetching messages:', err);
  } finally {
    if (mounted) setLoading(false);
  }
};


    

    getMessages();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Spinner loading={loading} />;

  return (
    <section className="bg-blue-50">
      <div className="container m-auto py-24 max-w-6xl">
        <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
          <h1 className="text-3xl font-bold mb-4">Your Messages</h1>

          <div className="space-y-4">
            {messages.length === 0 ? (
  <p>You have no messages</p>
) : (
  messages.map((message, index) => (
    <Message 
      key={message._id || message.id || index} 
      message={message} 
    />
  ))
)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Messages;
