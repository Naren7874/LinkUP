import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useShowToast from "./useShowToast";
import apiReq from "../components/lib/apiReq";


const useGetUserProfile = ()=>{
    const [user, setUser] = useState(null);
    const [loading , setLoading] = useState(true);
    const {username} = useParams();
    const showToast = useShowToast();

    useEffect(()=>{
        const getUser = async () => {
            try {
              const response = await apiReq.get(`/users/profile/${username}`);
              console.log(response.data);
      
              if (response.data?.error) {
                showToast("Error", response.data.error, "error");
                return;
              }
              if(response.data.isFrozen){
                setUser(null)
                return;
              }
              setUser(response.data);
            } catch (error) {
              console.log("Error: " + error.message);
              showToast("Error", error.message, "error"); // Use error.message here
              setUser(null);
            } finally {
              setLoading(false);
            }
          };
          getUser();
    },[username , showToast])

    return {user, loading};
}

export default useGetUserProfile;