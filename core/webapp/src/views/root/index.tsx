import { createSocket, queryClient } from 'configs';
import { SocketProvider } from 'lib/context/socket';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from 'styles';
import { ServiceDetails } from 'views/serviceDetails';
import { SideBar } from 'views/sideBar';
import { StackDetails } from 'views/stackDetails';
import { StackListView } from 'views/stackList';
import { TaskDetails } from 'views/taskDetails';
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
                    <Route path=":name" element={<StackDetails />}>
                      <Route
                        path="service/:serviceKey"
                        element={<ServiceDetails />}
                      >
                        <Route path="t/:taskId" element={<TaskDetails />} />
                      </Route>
                    </Route>
                    <Route
                      path="service/:serviceName/*"
                      element={<ServiceDetails />}
                    >
                      <Route path="t/:taskId" element={<TaskDetails />} />
                    </Route>
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
