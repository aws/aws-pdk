/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Container, Header, SpaceBetween } from '@cloudscape-design/components';
import { useContext, useEffect } from 'react';
import { AppLayoutContext } from './App';

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
      <Container header={<Header variant={'h3'}>Home</Header>}>
        Hello!
      </Container>
    </SpaceBetween>
  );
};

export default Home;