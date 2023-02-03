/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Container, Header, SpaceBetween } from '@cloudscape-design/components';
import { useContext, useEffect } from 'react';
import { AppLayoutContext } from './App';
import { RuntimeConfigContext } from './Auth';

/**
 * Component to render the home "/" route.
 */
const Home: React.FC = () => {
  const { setAppLayoutProps } = useContext(AppLayoutContext);

  useEffect(() => {
    setAppLayoutProps({
      contentHeader: <Header>Home</Header>,
    });
  }, [setAppLayoutProps]);

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant={'h3'}>Runtime Config</Header>}>
        <RuntimeConfigContext.Consumer>
          { /* Reference runtimeConfig like so */ }
          {({ runtimeContext }) => <pre>{JSON.stringify(runtimeContext, null, 2)}</pre>}
        </RuntimeConfigContext.Consumer>
      </Container>
    </SpaceBetween>
  );
};

export default Home;