import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import io from "socket.io-client";

const SocketContext = createContext();


export const useSocket = () => {
  return useContext(SocketContext);
};
export const SocketContextProvider = ({ children }) => {

  const [socket, setSocket] = useState(null);
  const user = useRecoilValue(userAtom);
  const [onlineUsers ,setOnlineUsers] = useState("")
  useEffect(() => {
    const socketURL = import.meta.env.VITE_SOCKET_URL ;
    
    const socket = io(socketURL, {
      query: {
        userId: user?._id,
      },
    });
    setSocket(socket);

    socket.on("getOnlineUsers",(user)=>{
      setOnlineUsers(user);
    })
    
    return () => socket && socket.close();
  }, [ user?._id]);
  // console.log(onlineUsers , " online user");
  return (
    <SocketContext.Provider value={{ socket , onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

