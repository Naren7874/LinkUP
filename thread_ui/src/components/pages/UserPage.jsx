import { useEffect, useState } from "react";
import UserHeader from "../UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../../hooks/useShowToast";
import apiReq from "../lib/apiReq";
import UserHeaderSkeleton from "../skeleton/UserHeaderSkeleton";
import UserPostSkeleton from "../skeleton/UserPostSkeleton";
import Post from "../Post";
import useGetUserProfile from "../../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postAtom from "../../atoms/postAtom";

const UserPage = () => {
  // const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);
  const {user, loading} = useGetUserProfile();
  const [posts, setPosts] = useRecoilState(postAtom);
  const showToast = useShowToast();
  const { username } = useParams();
  const [postLoading , setPostLoading] = useState(true);

  useEffect(() => {

    const getUserPost = async ()=>{
      if(!user) return ;
      try {
          const res  = await apiReq.get(`/posts/user/${username}`)
          if (res.data.error) {
            showToast("Error", res.data.error, "error");
            return;
          }
          console.log(res.data);
          setPosts(res.data);
      } catch (error) {
        console.log("Error: " + error.message);
        showToast("Error", error.message, "error");
        setPosts([]);
      }
      finally{
        setPostLoading(false);
      }
    }
   
    getUserPost(); // Call this function after the user data is fetched
  }, [username, showToast, setPosts, user]);


  if (loading ) {
    return (
      <>
        <UserHeaderSkeleton />
      </>
    );
  }

  if (!user) {
    return <h1>User not Found</h1>;
  }

  return (
    <>
      <UserHeader user={user} />
      {!postLoading && posts.length === 0 && (
        <h2  style={{marginTop:"22px"}}>User has not posts</h2>
      )}
      {postLoading && (
        <>
        <UserPostSkeleton />
        <UserPostSkeleton />
        <UserPostSkeleton />
        </>
      )}
      {
        posts.map((post)=>(
          <Post key={post._id} post={post} 
            postedBy={post.postedBy} />
        ))
      }
    </>
  );
};

export default UserPage;
