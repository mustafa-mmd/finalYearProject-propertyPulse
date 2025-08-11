const apiUrl=process.env.NEXT_PUBLIC_API_URL || null
async function getProperties() {
  try{
    // Handle case where apiUrl is not set
    if (!apiUrl) {
      return [];
    }
    //fetch all properties
    const res = await fetch(`${apiUrl}/prop`);
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    return res.json();
  }catch(err){
    console.log(err);
    return [];  
  }
}
//fech single property by id
async function getProperty(id) {
  try{
    // Handle case where apiUrl is not set
    if (!apiUrl) {
      return null;
    }
    
    const res = await fetch(`${apiUrl}/prop/${id}`);
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    return res.json();
  }catch(err){
    console.log(err);
    return null;  
  }
}
export { getProperties , getProperty };