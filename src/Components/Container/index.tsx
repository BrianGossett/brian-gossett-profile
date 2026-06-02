import { useState } from 'react'
import { Box, Flex, Link, Text, VStack } from "@chakra-ui/react"
import { NavLink } from "react-router"
import { colors } from "../../Theme"

const PageContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <VStack minHeight="100vh" minWidth="100vw" align="stretch" bg={colors.pageBg}>
      <Header />
      <Box as="main" flex="1">
        {children}
      </Box>
      <Footer />
    </VStack>
  )
}

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = (
    <>
      <Link href="/#hero"       color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Home</Link>
      <Link href="/#about"      color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">About</Link>
      <Link href="/#experience" color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Experience</Link>
      <Link href="/#contact"    color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} textDecoration="none">Contact</Link>
      <NavLink
        to="/study"
        style={({ isActive }) => ({
          textDecoration: 'none',
          fontSize: '14px',
          color: isActive ? colors.accent : colors.textMuted,
        })}
      >
        Study
      </NavLink>
    </>
  )

  return (
    <Box>
      <Flex
        as="header"
        bg={colors.navBg}
        borderBottom={`1px solid ${colors.border}`}
        px={8}
        py={4}
        align="center"
        gap={8}
      >
        <Text fontWeight="800" fontSize="lg" color={colors.accent} letterSpacing="0.5px">
          BG
        </Text>

        {/* Desktop nav */}
        <Flex as="nav" gap={6} display={{ base: 'none', md: 'flex' }}>
          {navLinks}
        </Flex>

        {/* Hamburger button — mobile only */}
        <Box
          as="button"
          display={{ base: 'flex', md: 'none' }}
          ml="auto"
          onClick={() => setMenuOpen(o => !o)}
          bg="none"
          border="none"
          cursor="pointer"
          color={colors.textMuted}
          fontSize="xl"
          p={1}
          _hover={{ color: colors.accent }}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </Box>
      </Flex>

      {/* Mobile dropdown */}
      {menuOpen && (
        <Box
          display={{ base: 'flex', md: 'none' }}
          flexDirection="column"
          bg={colors.navBg}
          borderBottom={`1px solid ${colors.border}`}
          px={8}
          py={4}
          gap={4}
          onClick={() => setMenuOpen(false)}
        >
          {navLinks}
        </Box>
      )}
    </Box>
  )
}

export const Footer = () => {
  return (
    <Box
      as="footer"
      bg={colors.navBg}
      borderTop={`1px solid ${colors.border}`}
      textAlign="center"
      py={5}
    >
      <Text fontSize="sm" color={colors.textMuted}>
        &copy; {new Date().getFullYear()} Brian Gossett. All rights reserved.
      </Text>
    </Box>
  )
}

export default PageContainer
