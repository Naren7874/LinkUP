/* eslint-disable no-unused-vars */
import {
  Avatar,
  Divider,
  Flex,
  Image,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput.jsx";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import selectedConversationAtom from "../atoms/selectedConversationAtom.js";
import { useEffect, useRef, useState } from "react";
import useShowToast from "../hooks/useShowToast.js";
import apiReq from "./lib/apiReq.js";
import userAtom from "../atoms/userAtom.js";
import { useSocket } from "../context/SocketContext.jsx";
import conversationAtom from "../atoms/messagesAtom.js";
import messageSound from '../assets/sounds/message.mp3';
const MessageContainer = () => {
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const [loadingMessage, setLoadingMessages] = useState(true);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();
  const bottomRef = useRef(); // Ref to track the last message
  const setConversations = useSetRecoilState(conversationAtom);

  useEffect(()=>{

    const lastMessageIsFromOtherUser =  messages.length && messages[messages.length - 1].sender !== currentUser._id

    if(lastMessageIsFromOtherUser){
      socket.emit("markMessageAsSeen",{
        conversationId: selectedConversation._id,
        userId: selectedConversation.userId,
      })
    }

    socket.on('messagesSeen' , ({conversationId})=>{
      if(selectedConversation._id === conversationId){
        setMessages(prev =>{
          const updatedMessages = prev.map(message =>{
            if(!message.seen){
              return{
                ...message,
                seen: true,
              }
            }
            return message
          })
          return updatedMessages
        })
      }
    })
  },[currentUser._id, messages, selectedConversation, socket])

  // Scroll to the last message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    socket.on("newMessage", (message) => {

      if(selectedConversation._id === message.conversationId){
      setMessages((prev) => [...prev, message]);
      }

      const sound = new Audio(messageSound);
      sound.play()
      setConversations((prev) => {
				const updatedConversations = prev.map((conversation) => {
					if (conversation._id === message.conversationId) {
						return {
              ...conversation,
              lastMessages: {
                text: message.text,
                sender: message.sender,
              },
            };
					}
					return conversation;
				});
				return updatedConversations;
			});
    });

    return () => socket.off("newMessage");
  }, [selectedConversation, setConversations, socket ]);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    const getMessages = async () => {
      setLoadingMessages(true);
      setMessages([]);

      try {
        if (selectedConversation.mock) return;
        const res = await apiReq.get(
          `/messages/${selectedConversation.userId}`
        );
        if (res.data.error) {
          showToast("Error", res.data.error, "error");
          return;
        }
        setMessages(res.data);
      } catch (error) {
        console.log("Error: " + error.message);
        showToast("Error", "Failed to fetch messages", "error");
      } finally {
        setLoadingMessages(false);
      }
    };
    getMessages();
  }, [
    showToast,
    selectedConversation.userId,
    selectedConversation._id,
    selectedConversation.mock,
  ]);

  return (
    <Flex
      flex="70"
      bg={useColorModeValue("gray.200", "gray.dark")}
      borderRadius={"md"}
      p={2}
      flexDirection={"column"}
    >
      {/* Message header */}
      <Flex w={"full"} h={12} alignItems={"center"} gap={2}>
        <Avatar src={selectedConversation.userProfilePic} size={"sm"} />
        <Text display={"flex"} alignItems={"center"}>
          {selectedConversation.username}
          <Image src="/verified.png" w={4} h={4} ml={1} />
        </Text>
      </Flex>
      <Divider />

      <Flex
        flexDir={"column"}
        gap={4}
        my={4}
        p={2}
        height={"400px"}
        overflowY={"auto"}
      >
        {loadingMessage &&
          [...Array(5)].map((_, i) => (
            <Flex
              key={i}
              gap={2}
              alignItems={"center"}
              p={1}
              borderRadius={"md"}
              alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
            >
              {i % 2 === 0 && <SkeletonCircle size={7} />}
              <Flex flexDir={"column"} gap={2}>
                <Skeleton h="8px" w="250px" />
                <Skeleton h="8px" w="250px" />
                <Skeleton h="8px" w="250px" />
              </Flex>
              {i % 2 !== 0 && <SkeletonCircle size={7} />}
            </Flex>
          ))}

        {!loadingMessage &&
          messages.map((message, index) => (
            <Message
              key={index}
              message={message}
              ownMessage={currentUser._id === message.sender}
            />
          ))}
        {/* Dummy element to scroll into view */}
        <div ref={bottomRef} />
      </Flex>
      <MessageInput setMessages={setMessages} />
    </Flex>
  );
};

export default MessageContainer;
