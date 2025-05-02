import { Box, Flex,  Link, Text, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router";

const PageContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    return (
        <VStack  minHeight="100vh" minWidth={"100vw"}  align="stretch">
            <Flex as="header" bg="gray.800" color="white" p={4} >
                <Flex as="nav" gap={6}>
                    <Link color={'pink'}><NavLink to={'/'}>Home</NavLink></Link>
                    <Link color={'pink'}>About Me</Link>
                    <Link color={'pink'}>Contact</Link>
                </Flex>
            </Flex>

            <Box as="main" flex="1">
                {children}
            </Box>

            <Box as="footer" bg="gray.800" color="white" textAlign="center" py={4}>
                <Text>&copy; {new Date().getFullYear()} Brian Gossett. All rights reserved.</Text>
            </Box>
        </VStack>
    );
};

export default PageContainer;