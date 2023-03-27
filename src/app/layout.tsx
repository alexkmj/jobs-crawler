"use client";

import './globals.css'

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

const metadata = {
  title: 'Jobs Crawler',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CustomAppBar></CustomAppBar>
        {children}
      </body>
    </html>
  )
}

function CustomAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: "#FFFFFF", color: "#2A2A2E" }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            { metadata.title }
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}