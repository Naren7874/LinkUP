import { Box, Container } from "@chakra-ui/react"
import {Routes, Route, useLocation} from "react-router"
import UserPage from "./components/pages/UserPage"
import PostPage from "./components/pages/PostPage"
import Header from "./components/Header"
import HomePage from "./components/pages/HomePage"
import AuthPage from "./components/pages/AuthPage"

import { useRecoilValue } from "recoil"
import userAtom from "./atoms/userAtom"
import { Navigate } from "react-router-dom"
import UpdateProfile from "./components/pages/UpdateProfile"
import CreatePost from "./components/CreatePost"
import ChatPage from "./components/pages/ChatPage.jsx"
import SettingsPage from "./components/pages/SettingsPage.jsx"
function App() {
  const user = useRecoilValue(userAtom);
  // console.log(user);

  const location = useLocation();
  return (
    <Box position={"relative"} w={"full"}>
    <Container maxW={location.pathname === "/" ? {base:"620px" , md:"900px"} : "620px"}>
      <Header/>
      <Routes>
        <Route path="/" element={user ? <HomePage/> : <Navigate to={'/auth'} />} />
        <Route path="/auth" element={!user ?<AuthPage/> : <Navigate to={'/'}/>}/>
        <Route path="/update" element={user ?<UpdateProfile/> : <Navigate to={'/auth'}/>}/>
        <Route path="/:username" element={
          user? (<>
          <UserPage/>
          <CreatePost/>
          </>):(<>
          <UserPage/>
          </>)
        } />
        <Route path="/:username/post/:pid" element={<PostPage/>} />
        <Route path="/chat" element={user ? <ChatPage/> : <Navigate to={'/auth'}/> } />
        <Route path="/settings" element={user ? <SettingsPage/> : <Navigate to={'/auth'}/> } />
      </Routes>
    </Container>
    </Box>

  )
}

export default App