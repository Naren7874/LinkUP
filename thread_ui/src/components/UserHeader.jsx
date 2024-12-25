import {
  Avatar,
  Box,
  Button,
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  useColorMode,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { CgMoreO } from "react-icons/cg";
import { BsInstagram } from "react-icons/bs";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";

const UserHeader = ({ user }) => {
  const toast = useToast();
  const { colorMode } = useColorMode();
  const currentUser = useRecoilValue(userAtom);

  // Use the custom hook to manage follow/unfollow logic
  const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

  const copyUrl = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(
      () => {
        toast({
          status: "success",
          description: "Profile link copied.",
          duration: 3000,
          isClosable: true,
        });
      },
      (error) => {
        alert("Failed to copy URL: " + error.message);
      }
    );
  };

  if (!user) return null;

  return (
    <VStack gap={4} alignItems={"start"}>
      <Flex justifyContent={"space-between"} width={"full"}>
        <Box>
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            {user.name}
          </Text>
          <Flex gap={2} alignItems={"center"}>
            <Text fontSize={"sm"}>{user.username}</Text>
            <Text
              fontSize={"xs"}
              bg={colorMode === "light" ? "gray.light" : "gray.dark"}
              color={colorMode === "light" ? "white" : "gray.light"}
              p={1}
              borderRadius={"full"}
            >
              threads.net
            </Text>
          </Flex>
        </Box>
        <Box>
          <Avatar
            name={user.name}
            src={user.profilePic || "https://www.pngall.com/wp-content/uploads/12/Avatar-PNG-Image.png"}
            size={{
              base: "md",
              md: "xl",
            }}
          />
        </Box>
      </Flex>
      <Text>{user.bio}</Text>
      {currentUser && currentUser._id === user._id ? (
        <RouterLink to={`/update`}>
          <Button size={"sm"}>Update Profile</Button>
        </RouterLink>
      ) : (
        currentUser && (
          <Button size={"sm"} onClick={handleFollowUnfollow} isLoading={updating}>
            {following ? "Unfollow" : "Follow"}
          </Button>
        )
      )}
      <Flex w={"full"} justifyContent={"space-between"}>
        <Flex gap={2} alignItems={"center"}>
          <Text color={"gray.light"}>{user.followers.length} followers</Text>
          <Box w={1} h={1} bg={"gray.light"} borderRadius={"full"}></Box>
          <Link color={"gray.light"}>instagram.com</Link>
        </Flex>
        <Flex>
          <Box className="icon-container">
            <BsInstagram size={24} cursor={"pointer"} />
          </Box>
          <Box className="icon-container">
            <Menu>
              <MenuButton>
                <CgMoreO size={24} cursor={"pointer"} />
              </MenuButton>
              <Portal>
                <MenuList bg={colorMode === "light" ? "#e6e6e6" : "gray.dark"}>
                  <MenuItem
                    bg={colorMode === "light" ? "#e6e6e6" : "gray.dark"}
                    onClick={copyUrl}
                  >
                    Copy link
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </Box>
        </Flex>
      </Flex>
      <Flex w={"full"}>
        <Flex
          flex={1}
          borderBottom={"1.5px solid white"}
          justifyContent={"center"}
          paddingBottom={3}
          cursor={"pointer"}
        >
          <Text fontWeight={"bold"}> Threads</Text>
        </Flex>
        <Flex
          flex={1}
          borderBottom={"1px solid gray"}
          justifyContent={"center"}
          color={"gray.light"}
          pb="3"
          cursor={"pointer"}
        >
          <Text fontWeight={"bold"}> Replies</Text>
        </Flex>
      </Flex>
    </VStack>
  );
};

export default UserHeader;
