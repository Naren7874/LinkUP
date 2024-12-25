import { Button, Text } from "@chakra-ui/react";
import useShowToast from "../../hooks/useShowToast.js";
import apiReq from "../../components/lib/apiReq.js";
import  useLogout  from "../../hooks/useLogout.js";

const SettingsPage = () => {
  const showToast = useShowToast();
  const logout = useLogout();


  const freezeAccount = async () => {
    if (!window.confirm("Are you sure you want to freeze your account?")) return;

    try {
      const res = await apiReq.put("/users/freeze");

      if (res.data?.error) {
        console.error("Error: ", res.data.error);
        showToast("Error", res.data.error, "error");
        return;
      }
	  
	  if(res.data?.success){
		  await logout();
		  showToast("Success", res.data?.message || "Account frozen successfully.", "success");
	  }
    } catch (error) {
      console.error("Error: ", error.message);
      showToast("Error", error.message || "Failed to freeze account.", "error");
    }
  };

  return (
    <>
      <Text my={1} fontWeight="bold">
        Freeze Your Account
      </Text>
      <Text my={1}>You can unfreeze your account anytime by logging in.</Text>
      <Button size="sm" colorScheme="red" onClick={freezeAccount}>
        Freeze
      </Button>
    </>
  );
};

export default SettingsPage;
