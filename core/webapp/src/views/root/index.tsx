import { queryClient } from 'configs';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from 'styles';
import { ServiceDetails } from 'views/serviceDetails';
import { SideBar } from 'views/sideBar';
import { StackDetails } from 'views/stackDetails';
import { StackListView } from 'views/stackList';

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
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Container>
            <SideBar />
            <Routes>
              <Route path="stack" element={<StackListView />}>
                <Route path=":name" element={<StackDetails />}>
                  <Route
                    path="service/:serviceName"
                    element={<ServiceDetails />}
                  />
                </Route>
                <Route
                  path="service/:serviceName/*"
                  element={<ServiceDetails />}
                />
              </Route>
            </Routes>
          </Container>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
