import { ChakraProvider } from '@chakra-ui/react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

import { RootMenu } from '../menu';
import { TemplateList } from '../templateList';
import { CommandView } from 'views/commands';

export const Content = () => {
  return (
    <Switch>
      <Route path="/commands" component={CommandView} />
      <Route path="/templates" component={TemplateList} />
      <Redirect to="/commands" />
    </Switch>
  );
};

const client = new QueryClient();

export const Root = () => {
  return (
    <Router>
      <ChakraProvider>
        <QueryClientProvider client={client}>
          <div className="flex h-full w-full overflow-hidden">
            <RootMenu />
            <Content />
          </div>
        </QueryClientProvider>
      </ChakraProvider>
    </Router>
  );
};
