import userAtom from "../atoms/userAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "./useShowToast";
import apiReq from "../components/lib/apiReq";

const useLogout = () => {
	const setUser = useSetRecoilState(userAtom);
	const showToast = useShowToast();

	const logout = async () => {
		try {
			const res = await apiReq.post("/users/logout");
			

			if (res.data?.error) {
				showToast("Error", res.data?.error, "error");
				return;
			}

			localStorage.removeItem("user-threads");
			setUser(null);
		} catch (error) {
			showToast("Error", error, "error");
		}
	};

	return logout;
};

export default useLogout;