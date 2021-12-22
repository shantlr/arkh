import { createSocket, queryClient } from 'configs';
import { SocketProvider, useSocketListen } from 'lib/context/socket';
import { useEffect } from 'react';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from 'styles';
import { SideBar } from 'views/sideBar';
import { StackDetails } from 'views/stackDetails';
import { StackListView } from 'views/stackList';
import { CustomDragLayer } from './customDragLayer';

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;

  display: flex;
  flex-direction: row;

  background-color: white;
`;

export const RootApp = () => {
  const [socket] = useState(() => createSocket());

  useEffect(() => {
    const listener = (reason: Socket.DisconnectReason) => {
      if (reason === 'io server disconnect') {
        console.log('server disconnect');
        setTimeout(() => {
          console.log('retrying connection');
          socket.connect();
        }, 500);
      }
    };
    socket.on('disconnect', listener);
    return () => {
      socket.removeListener('disconnect', listener);
    };
  }, [socket]);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <ThemeProvider theme={theme}>
            <SocketProvider socket={socket}>
              <Container>
                <SideBar />
                <Routes>
                  <Route path="stack" element={<StackListView />}>
                    <Route path=":name" element={<StackDetails />} />
                  </Route>
                </Routes>
                <CustomDragLayer />
              </Container>
            </SocketProvider>
          </ThemeProvider>
        </DndProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
