import { useState } from "react";
import useShowToast from "./useShowToast";
import userAtom from "../atoms/userAtom";
import { useRecoilValue } from "recoil";
import apiReq from "../components/lib/apiReq";

const useFollowUnfollow = (user) => {
  const currentUser = useRecoilValue(userAtom);
  const [following, setFollowing] = useState(
    user?.followers?.includes(currentUser?._id) || false
  );
  const [updating, setUpdating] = useState(false);
  const showToast = useShowToast();

  const handleFollowUnfollow = async () => {
    if (!currentUser) {
      showToast("Error", "You need to be logged in.", "error");
      return;
    }

    if (updating) return; // Prevent multiple clicks

    setUpdating(true);
    try {
      const response = await apiReq.post(`/users/follow/${user._id}`);
      setFollowing((prev) => !prev);

      if (following) {
        showToast("Success", `User unfollowed successfully.`, "success");
        user.followers = user.followers?.filter((id) => id !== currentUser._id) || [];
      } else {
        showToast("Success", `User followed successfully.`, "success");
        user.followers = [...(user.followers || []), currentUser._id];
      }
    } catch (error) {
      showToast(
        "Error",
        error?.response?.data?.message || error.message || "An unexpected error occurred.",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  return { handleFollowUnfollow, updating, following };
};

export default useFollowUnfollow;
