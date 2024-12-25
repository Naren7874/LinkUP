import { Flex, Image, Link, useColorMode } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { Link as RouterLink } from "react-router-dom";
import { RxAvatar } from "react-icons/rx";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";
import LogOut from "./LogOut";
const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const user = useRecoilValue(userAtom);

  return (
    <Flex justifyContent={user?"space-between":"center"}  mt={6} mb={12}>
      {user && (
        <Link as={RouterLink} to={"/"}>
          <AiFillHome size={24} />
        </Link>
      )}
      <Image
        cursor={"pointer"}
        alt="logo"
        width={6}
        src={colorMode === "light" ? "/dark-logo.svg" : "/light-logo.svg"}
        onClick={toggleColorMode}
      />
      {user && (
        <Flex alignItems={"center"} gap={4}>
        <Link as={RouterLink} to={`/${user.username}`}>
          <RxAvatar size={24} />
        </Link>
        <Link as={RouterLink} to={`/chat`}>
          <BsFillChatQuoteFill size={24} />
        </Link>
        <Link as={RouterLink} to={`/settings`}>
          <MdOutlineSettings size={24} />
        </Link>
        <LogOut/>
        </Flex>
      )}
    </Flex>
  );
};

export default Header;
