import {
  Box,
  Button,
  Flex,
  Input,
  Skeleton,
  SkeletonCircle,
  Text,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { GiConversation } from "react-icons/gi";
import Conversation from "../Conversation";
import MessageContainer from "../MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../../hooks/useShowToast";
import apiReq from "../lib/apiReq";
import { useRecoilState, useRecoilValue } from "recoil";
import conversationAtom from "../../atoms/messagesAtom.js";
import selectedConversationAtom from "../../atoms/selectedConversationAtom.js";
import userAtom from "../../atoms/userAtom.js";
import { useSocket } from "../../context/SocketContext.jsx";

const ChatPage = () => {
  const [conversation, setConversation] = useRecoilState(conversationAtom);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);

  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const {socket , onlineUsers} = useSocket()


  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = ({ conversationId }) => {
      setConversation((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? {
                ...conversation,
                lastMessages: {
                  ...conversation.lastMessages,
                  seen: true,
                },
              }
            : conversation
        )
      );
    };

    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [setConversation, socket]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await apiReq.get("/messages/conversation");
        if (res.data.error) {
          showToast("Error", res.data.error, "error");
          return;
        }
        setConversation(res.data);
      } catch (error) {
        showToast("Error", "Failed to fetch conversations", "error");
        console.log(error.message)
      } finally {
        setLoadingConversation(false);
      }
    };
    fetchConversations();
  }, [showToast, setConversation]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) {
      showToast("Error", "Search text cannot be empty", "error");
      return;
    }

    setLoadingSearch(true);
    try {
      const res = await apiReq.get(`/users/profile/${searchText}`);
      const searchedUser = res.data;

      if (!searchedUser || searchedUser.error) {
        showToast("Error", searchedUser.error || "User not found", "error");
        return;
      }

      if (searchedUser._id === currentUser._id) {
        showToast("Error", "You cannot start a conversation with yourself", "error");
        return;
      }

      const existingConversation = conversation.find(
        (conv) => conv.participants[0]._id === searchedUser._id
      );

      if (existingConversation) {
        setSelectedConversation({
          _id: existingConversation._id,
          userId: searchedUser._id,
          username: searchedUser.username,
          userProfilePic: searchedUser.profilePic || "./NoProfile",
        });
      } else {
        const dummyConversation = {
          mock: true,
          lastMessage: {
            text: "",
            sender: "",
          },
          _id: Date.now(),
          participants: [
            {
              _id: searchedUser._id,
              username: searchedUser.username,
              profilePic: searchedUser.profilePic || "./NoProfile",
            },
          ],
        };

        setConversation((prevConvs) => [...prevConvs, dummyConversation]);
      }
    } catch (error) {
      showToast("Error", "Failed to search for user"+ error, "error");
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <Box
      position="absolute"
      w={{ base: "100%", md: "80%", lg: "750px" }}
      p={4}
      left="50%"
      transform="translateX(-50%)"
    >
      <Flex
        gap={4}
        flexDirection={{ base: "column", md: "row" }}
        maxW={{ base: "400px", md: "full" }}
        mx="auto"
      >
        <Flex
          flex={30}
          gap={2}
          flexDirection="column"
          maxW={{ sm: "250px", md: "full" }}
          mx="auto"
          maxH="82vh"
          overflowY="auto"
        >
          <form onSubmit={handleSearch}>
            <Flex alignItems="center" gap={2}>
              <Input
                placeholder="Search for a user"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button size="sm" type="submit" isLoading={loadingSearch}>
                <SearchIcon />
              </Button>
            </Flex>
          </form>

          {loadingConversation ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Flex key={i} gap={4} alignItems="center" p="1" borderRadius="md">
                <SkeletonCircle size="10" />
                <Flex w="full" flexDirection="column" gap={3}>
                  <Skeleton h="10px" w="80px" />
                  <Skeleton h="8px" w="90%" />
                </Flex>
              </Flex>
            ))
          ) : conversation.length > 0 ? (
            conversation.map((c) => (
              <Conversation
                key={c._id}
                conversation={c}
                isOnline={onlineUsers.includes(c.participants[0]._id)}

                setSelectedConversation={setSelectedConversation}
              />
            ))
          ) : (
            <Text textAlign="center" mt={4}>
              No conversations found
            </Text>
          )}
        </Flex>

        {!selectedConversation?._id ? (
          <Flex
            flex={70}
            borderRadius="md"
            p={2}
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            height="400px"
          >
            <GiConversation size={100} />
            <Text fontSize={20}>Select a conversation to start messaging</Text>
          </Flex>
        ) : (
          <MessageContainer />
        )}
      </Flex>
    </Box>
  );
};

export default ChatPage;
