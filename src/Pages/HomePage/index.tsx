import { Box,  Heading, Image,  Text, VStack } from "@chakra-ui/react";
import PageContainer from "../../Components/Container";
import ProfilePic from "../../assets/me.jpg"; 

const HomePage = () => {
    return (

        <PageContainer>
            <VStack id="hero" spaceY={4} py={10} bg="gray.100" textAlign="center">
                <Image
                    src={ProfilePic}
                    alt="Your Photo"
                    borderRadius="full"
                    boxSize="150px"
                />
                <Heading>Welcome to My Profile</Heading>
                <Text fontSize="lg">Hi, I'm Brian Gossett, a passionate developer!</Text>
            </VStack>

            <Box id="about" py={10} px={6} bg="white" textAlign="center">
                <Heading mb={4}>About Me</Heading>
                <Text fontSize="md">
                    I am a software developer with a passion for creating innovative solutions.
                    With experience in web development, I enjoy building responsive and user-friendly applications.
                </Text>
            </Box>
        </PageContainer>
    );
};

export default HomePage;