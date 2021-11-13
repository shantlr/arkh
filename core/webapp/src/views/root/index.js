import { ChakraProvider } from '@chakra-ui/react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { DragDropContext } from 'react-beautiful-dnd';

import { RootMenu } from '../menu';
import { TemplateList } from '../templateList';
import { CommandView } from 'views/commands';
import {
  SocketGlobalListenerProvider,
  SocketProvider,
} from 'containers/socket';
import { Provider } from 'react-redux';
import { store } from 'state';
import { RunnersView } from 'views/runners';

export const Content = () => {
  return (
    <Switch>
      <Route path="/commands" component={CommandView} />
      <Route path="/templates" component={TemplateList} />
      <Route path="/runners" component={RunnersView} />
      <Redirect to="/commands" />
    </Switch>
  );
};

const client = new QueryClient();

export const Root = () => {
  return (
    <Provider store={store}>
      <Router>
        <ChakraProvider>
          <QueryClientProvider client={client}>
            <SocketProvider>
              <SocketGlobalListenerProvider>
                <DragDropContext>
                  <div className="flex h-full w-full overflow-hidden">
                    <RootMenu />
                    <Content />
                  </div>
                </DragDropContext>
              </SocketGlobalListenerProvider>
            </SocketProvider>
          </QueryClientProvider>
        </ChakraProvider>
      </Router>
    </Provider>
  );
};
