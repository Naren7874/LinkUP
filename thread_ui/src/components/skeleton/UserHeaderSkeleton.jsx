import {
    Box,
    Flex,
    Skeleton,
    SkeletonCircle,
    SkeletonText,
    VStack,
  } from "@chakra-ui/react";
  
  const UserHeaderSkeleton = () => {
    return (
      <VStack gap={4} alignItems={"start"} width="full">
        {/* Header with Name and Avatar */}
        <Flex justifyContent={"space-between"} width={"full"}>
          {/* Left Side - Name and Username */}
          <Box>
            <Skeleton height="24px" width="100px" mb={2} />  {/* Name */}
            <Skeleton height="16px" width="60px" />           {/* Username */}
          </Box>
  
          {/* Right Side - Avatar */}
          <SkeletonCircle size={{ base: "12", md: "16" }} />
        </Flex>
  
        {/* Bio Section */}
        <SkeletonText noOfLines={2} spacing="4" width="80%" />
        
        
      </VStack>
    );
  };
  
  export default UserHeaderSkeleton;
  