import { createSocket, queryClient } from 'configs';
import { SocketProvider } from 'lib/context/socket';
import { useState } from 'react';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from 'styles';
import { ServiceDetails } from 'views/serviceDetails';
import { SideBar } from 'views/sideBar';
import { StackDetails } from 'views/stackDetails';
import { StackListView } from 'views/stackList';
import { TaskDetails } from 'views/taskDetails';

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  display: flex;
  flex-direction: row;

  background-color: white;
  /* background-color: ${(props) => props.theme.color.mainBg}; */
`;

export const RootApp = () => {
  const [socket] = useState(() => createSocket());

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
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
            </Container>
          </SocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
